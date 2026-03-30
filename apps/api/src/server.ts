import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { appConfig } from './config.js';
import { db, redis } from './db.js';
import { estimateCostUsdMicros, generateText, resolveAiExecutionPlan, usdMicrosToKshCents } from './ai.js';
import {
  buildTotpUri,
  deriveSessionBindingFingerprint,
  generateRefreshToken,
  generateTotpSecret,
  hashOpaqueToken,
  hashPassword,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
  verifyTotpToken
} from './auth.js';
import {
  type CurriculumStrandInput,
  createBannerAnnouncement,
  createTeacherAssignment,
  createSelfServiceUser,
  createAiUsageEvent,
  createAuditLog,
  createPaymentRequest,
  createSchool,
  createSchoolDiscount,
  deleteBannerAnnouncement,
  deleteSchool,
  deleteSchoolDiscount,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  expirePendingPaymentRequests,
  enableTotp,
  findActiveEmailVerificationToken,
  findActiveRefreshToken,
  findActivePasswordResetToken,
  findSchoolById,
  findSchoolPricingForUser,
  findPaymentRequestByCheckoutRequestId,
  findCurriculumSubStrandContext,
  findPaymentRequestByIdForUser,
  findSubscriptionPlanByCode,
  findUserByEmail,
  findUserById,
  getBillingProfile,
  getBillingAnalytics,
  getActiveSubscription,
  getActiveBannerAnnouncement,
  getAdminAiAnalytics,
  listAdminUsers,
  getSubscriptionAiSpendKshCents,
  getTotpSecret,
  getUserTotpStatus,
  hasSuccessfulPayments,
  invalidateEmailVerificationTokensForUser,
  invalidatePasswordResetTokensForUser,
  insertEmailVerificationToken,
  insertPasswordResetToken,
  insertRefreshToken,
  listBannerAnnouncements,
  listAssignmentSubmissionsForTeacher,
  listLearningPodcastsForUser,
  listLibraryBooksForUser,
  listSchoolDiscounts,
  listSchools,
  listStudentAssignments,
  listSubscriptionPlans,
  listTeacherAssignments,
  listTeacherStudents,
  listCurriculumForGrade,
  markPaymentRequestFailed,
  markPaymentRequestInitiated,
  markPaymentRequestSuccessful,
  markCurriculumSubStrandCompleted,
  markUserEmailVerified,
  replaceCurriculumSubject,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokensForSession,
  replaceActiveSubscription,
  saveCurriculumSubStrandPages,
  submitStudentAssignment,
  updateBannerAnnouncement,
  updateSchool,
  updateSchoolDiscount,
  updateUserOnboarding,
  updateUserPassword,
  upsertBillingProfile,
  upsertTotpSecret,
  withTransaction
} from './repositories.js';
import { requireAuthenticated, requireRoles, requireSchoolContext } from './rbac.js';
import {
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
  sendTransactionalEmail
} from './mailer.js';
import {
  buildSubscriptionReference,
  formatKenyanPhoneNumber,
  initiateStkPush,
  maskKenyanPhoneNumber,
  type BillingPlanCode
} from './payments.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['student', 'teacher']),
  schoolId: z.string().uuid().nullable().optional(),
  gender: z.enum(['male', 'female', 'not_specified']).optional(),
  grade: z.string().trim().min(2).max(40).nullable().optional(),
  mpesaPhoneNumber: z.string().trim().min(9).max(20).nullable().optional(),
  onboardingCompleted: z.boolean().optional()
});

const totpSchema = z.object({
  token: z.string().length(6)
});

const rotatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(10)
});

const completePasswordResetSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(10)
});

const verificationEmailSchema = z.object({
  email: z.string().email()
});

const completeEmailVerificationSchema = z.object({
  token: z.string().min(32)
});

const tokenQuerySchema = z.object({
  token: z.string().min(32)
});

const mpesaCheckoutSchema = z.object({
  planCode: z.enum(['weekly', 'monthly', 'annual', 'admin_weekly', 'trial_monthly_1bob']),
  phoneNumber: z.string().min(9),
  returnTo: z.string().min(1).max(160).default('dashboard')
});

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  principal: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  assignedPlanCode: z.enum(['weekly', 'monthly', 'annual']),
  discountId: z.string().uuid().nullable().optional()
});

const schoolParamsSchema = z.object({
  schoolId: z.string().uuid()
});

const schoolDiscountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['percentage', 'fixed_ksh']),
  amount: z.number().int().min(1),
  isActive: z.boolean().default(true)
});

const discountParamsSchema = z.object({
  discountId: z.string().uuid()
});

const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(4).max(240),
  ctaLabel: z.string().trim().max(40).nullable().optional(),
  ctaTarget: z.enum(['ask_tutor', 'manage_subscription', 'homework_list', 'bookshelf_view']),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true)
});

const announcementParamsSchema = z.object({
  announcementId: z.string().uuid()
});

const onboardingSchema = z.object({
  schoolId: z.string().uuid(),
  gender: z.enum(['male', 'female', 'not_specified']),
  grade: z.string().trim().min(2).max(40),
  mpesaPhoneNumber: z.string().trim().min(9).max(20).nullable().optional()
});

const teacherAssignmentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(2000),
  gradeLevel: z.string().trim().min(2).max(40),
  dueDate: z.string().datetime().optional(),
  questions: z.array(z.object({
    id: z.number().int(),
    type: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
    text: z.string().trim().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.boolean()]).optional(),
    explanation: z.string().optional()
  })).min(1)
});

const assignmentParamsSchema = z.object({
  assignmentId: z.string().uuid()
});

const studentAssignmentSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  answers: z.array(z.object({
    questionId: z.number().int(),
    question: z.string().trim().min(1),
    answer: z.string(),
    isCorrect: z.boolean()
  }))
});

const DAILY_QUOTES = [
  'Small lessons every day become big wins.',
  'Consistency beats cramming.',
  'Curiosity is your real superpower.',
  'Every question you ask makes you sharper.',
  'Progress feels small until you look back.'
] as const;

const checkoutParamsSchema = z.object({
  paymentRequestId: z.string().uuid()
});

const mpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().optional(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z
            .array(
              z.object({
                Name: z.string(),
                Value: z.union([z.string(), z.number()]).optional()
              })
            )
            .default([])
        })
        .optional()
    })
  })
});

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHandoffPage(args: {
  title: string;
  message: string;
  detail?: string;
  status: 'success' | 'error';
  deepLink?: string;
  buttonLabel?: string;
  bodyHtml?: string;
}) {
  const deepLink = args.deepLink ? escapeHtml(args.deepLink) : '';
  const button = deepLink
    ? `<a class="primary" href="${deepLink}">${escapeHtml(args.buttonLabel ?? 'Open Kitabu App')}</a>`
    : '';
  const script = deepLink
    ? `<script>
         const target = ${JSON.stringify(args.deepLink)};
         setTimeout(() => { window.location.href = target; }, 250);
       </script>`
    : '';

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(args.title)}</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          font-family: "Segoe UI", Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 30%),
            linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
          color: #0f172a;
        }
        .card {
          width: min(92vw, 540px);
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(148,163,184,0.28);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 24px 60px rgba(15,23,42,0.12);
          backdrop-filter: blur(14px);
        }
        .eyebrow {
          margin: 0 0 12px;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 12px;
          font-weight: 800;
        }
        h1 {
          margin: 0 0 12px;
          font-size: 32px;
          line-height: 1.05;
        }
        p {
          margin: 0 0 14px;
          color: #475569;
          line-height: 1.7;
        }
        .success { color: #166534; }
        .error { color: #b91c1c; }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }
        .primary, button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          border: 0;
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          cursor: pointer;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          padding: 14px;
          font: inherit;
          margin: 6px 0 14px;
        }
        label {
          display: block;
          font-weight: 700;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <main class="card">
        <p class="eyebrow">Kitabu AI</p>
        <h1>${escapeHtml(args.title)}</h1>
        <p class="${args.status}">${escapeHtml(args.message)}</p>
        ${args.detail ? `<p>${escapeHtml(args.detail)}</p>` : ''}
        ${args.bodyHtml ?? ''}
        <div class="actions">${button}</div>
      </main>
      ${script}
    </body>
  </html>`;
}

const generateTextSchema = z.object({
  prompt: z.string().min(1),
  systemInstruction: z.string().optional(),
  responseMimeType: z.string().optional(),
  feature: z.string().min(1).default('chat'),
  attachment: z
    .object({
      mimeType: z.string().min(1),
      data: z.string().min(1),
      name: z.string().min(1).optional(),
      type: z.enum(['image', 'file'])
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().min(1)
      })
    )
    .optional()
});

const curriculumItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1)
});

const contentPageSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
});

const curriculumSubStrandSchema = z.object({
  number: z.string().optional(),
  title: z.string().min(1),
  type: z.enum(['knowledge', 'skill', 'competence']).default('knowledge'),
  description: z.string().optional(),
  pages: z.array(contentPageSchema).default([]),
  outcomes: z.array(curriculumItemSchema).default([]),
  inquiryQuestions: z.array(curriculumItemSchema).default([])
});

const curriculumStrandSchema = z.object({
  number: z.string().optional(),
  title: z.string().min(1),
  subTitle: z.string().optional(),
  subStrands: z.array(curriculumSubStrandSchema).default([])
});

const curriculumSubjectParamsSchema = z.object({
  subjectId: z.string().min(1)
});

const curriculumQuerySchema = z.object({
  grade: z.string().min(1),
  subjectId: z.string().min(1).optional()
});

const curriculumReplaceSchema = z.object({
  grade: z.string().min(1),
  subjectName: z.string().min(1),
  strands: z.array(curriculumStrandSchema)
});

const curriculumImportSchema = z.object({
  grade: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().default('application/pdf'),
  base64Data: z.string().min(1)
});

const subStrandParamsSchema = z.object({
  subStrandId: z.string().uuid()
});

const subStrandQuizSchema = z.object({
  questionCount: z.number().int().min(3).max(20).default(10)
});

const subStrandCompletionSchema = z.object({
  quizScore: z.number().min(0).max(100).optional()
});

export function buildServer() {
  const app = Fastify({
    logger: true,
    trustProxy: appConfig.KITABU_TRUST_PROXY,
    bodyLimit: appConfig.KITABU_BODY_LIMIT_BYTES
  });

  app.register(cors, {
    origin: [appConfig.KITABU_ADMIN_WEB_ORIGIN]
  });
  app.register(helmet);
  app.register(sensible);
  app.register(rateLimit, {
    global: false,
    redis
  });
  if (appConfig.KITABU_ENABLE_API_DOCS || appConfig.KITABU_NODE_ENV !== 'production') {
    app.register(swagger, {
      openapi: {
        info: {
          title: 'Kitabu API',
          version: '1.0.0'
        }
      }
    });
    app.register(swaggerUi, {
      routePrefix: '/docs'
    });
  }

  app.decorateRequest('user', undefined);

  app.addHook('preHandler', async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return;
    }
    const token = authHeader.slice('Bearer '.length);
    try {
      request.user = await verifyAccessToken(token);
    } catch {
      request.user = undefined;
    }
  });

  app.get('/health', async () => {
    await db.query('SELECT 1');
    await redis.ping();
    return { status: 'ok' };
  });

  function buildAuthResponse(args: {
    user: Awaited<ReturnType<typeof findUserByEmail>> | Awaited<ReturnType<typeof findUserById>>;
    accessToken: string;
    refreshToken: string;
    totpEnabled: boolean;
    sessionId?: string | null;
  }) {
    if (!args.user) {
      throw new Error('User is required');
    }

    const normalizedUser = 'schoolId' in args.user
      ? {
          id: args.user.id,
          schoolId: args.user.schoolId,
          sessionId: args.sessionId ?? args.user.sessionId,
          email: args.user.email,
          fullName: args.user.fullName,
          emailVerified: args.user.emailVerified,
          roles: args.user.roles,
          gender: args.user.gender ?? 'not_specified',
          grade: args.user.grade ?? null,
          onboardingCompleted: Boolean(args.user.onboardingCompleted),
          mustRotatePassword: Boolean(args.user.mustRotatePassword),
          isBreakGlass: Boolean(args.user.isBreakGlass)
        }
      : {
          id: args.user.id,
          schoolId: args.user.school_id,
          sessionId: args.sessionId ?? null,
          email: args.user.email,
          fullName: args.user.full_name,
          emailVerified: args.user.email_verified,
          roles: args.user.roles,
          gender: args.user.gender,
          grade: args.user.grade_level,
          onboardingCompleted: args.user.onboarding_completed,
          mustRotatePassword: args.user.must_rotate_password,
          isBreakGlass: args.user.is_break_glass
        };

    const requiresPlatformTotp = normalizedUser.roles.includes('platform_admin') && !args.totpEnabled;
    const enforceProductionBreakGlassPolicy = appConfig.KITABU_NODE_ENV === 'production';
    return {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      user: {
        id: normalizedUser.id,
        schoolId: normalizedUser.schoolId,
        sessionId: normalizedUser.sessionId,
        email: normalizedUser.email,
        fullName: normalizedUser.fullName,
        emailVerified: normalizedUser.emailVerified,
        roles: normalizedUser.roles,
        gender: normalizedUser.gender,
        grade: normalizedUser.grade,
        onboardingCompleted: normalizedUser.onboardingCompleted
      },
      authState: {
        mustRotatePassword: enforceProductionBreakGlassPolicy
          ? normalizedUser.mustRotatePassword
          : false,
        requiresPlatformTotp: enforceProductionBreakGlassPolicy ? requiresPlatformTotp : false,
        isBreakGlass: normalizedUser.isBreakGlass
      }
    };
  }

  function getDeepLink(path: string, params: Record<string, string> = {}) {
    const base = appConfig.KITABU_APP_DEEP_LINK_BASE.replace(/\/$/, '');
    const search = new URLSearchParams(params).toString();
    return `${base}/${path}${search ? `?${search}` : ''}`;
  }

  function getSessionContext(request: FastifyRequest) {
    const deviceIdHeader = request.headers['x-kitabu-device-id'];
    const userAgentHeader = request.headers['user-agent'];
    const acceptLanguageHeader = request.headers['accept-language'];
    const deviceLabelHeader = request.headers['x-kitabu-device-label'];

    const deviceId = Array.isArray(deviceIdHeader) ? deviceIdHeader[0] : deviceIdHeader;
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;
    const acceptLanguage = Array.isArray(acceptLanguageHeader) ? acceptLanguageHeader[0] : acceptLanguageHeader;
    const deviceLabel = Array.isArray(deviceLabelHeader) ? deviceLabelHeader[0] : deviceLabelHeader;

    return {
      deviceLabel: deviceLabel?.slice(0, 120) ?? null,
      sessionBindingHash: deriveSessionBindingFingerprint({
        deviceId: deviceId?.slice(0, 200),
        userAgent,
        acceptLanguage
      })
    };
  }

  function getAllowedPlanCodesForUser(user: NonNullable<FastifyRequest['user']>): BillingPlanCode[] {
    if (user.roles.includes('platform_admin') || user.roles.includes('school_admin')) {
      return ['admin_weekly'];
    }

    return ['weekly', 'monthly', 'annual'];
  }

  function slugifySchoolName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function applyDiscount(priceKshCents: number, discount: {
    type: 'percentage' | 'fixed_ksh' | null;
    amount: number | null;
    isActive?: boolean;
  }) {
    if (!discount.type || !discount.amount || discount.isActive === false) {
      return priceKshCents;
    }

    if (discount.type === 'percentage') {
      return Math.max(100, Math.round(priceKshCents * (1 - discount.amount / 100)));
    }

    return Math.max(100, priceKshCents - discount.amount * 100);
  }

  function serializePlan(args: {
    code: BillingPlanCode;
    name: string;
    billingCycle: 'weekly' | 'monthly' | 'annual';
    priceKshCents: number;
    originalPriceKshCents?: number;
    isPopular?: boolean;
    isSchoolManaged?: boolean;
    discountName?: string | null;
  }) {
    return {
      code: args.code,
      name: args.name,
      billingCycle: args.billingCycle,
      priceKsh: args.priceKshCents / 100,
      priceKshCents: args.priceKshCents,
      originalPriceKsh: args.originalPriceKshCents ? args.originalPriceKshCents / 100 : null,
      originalPriceKshCents: args.originalPriceKshCents ?? null,
      isPopular: Boolean(args.isPopular),
      isSchoolManaged: Boolean(args.isSchoolManaged),
      discountLabel: args.discountName ?? null
    };
  }

  function serializeSchool(school: NonNullable<Awaited<ReturnType<typeof findSchoolById>>>) {
    const basePriceKshCents = Number(school.assigned_plan_price_ksh_cents);
    const effectivePriceKshCents = applyDiscount(basePriceKshCents, {
      type: school.discount_type,
      amount: school.discount_amount
    });

    return {
      id: school.id,
      name: school.name,
      status: school.status,
      location: school.location,
      principal: school.principal,
      phone: school.phone,
      email: school.email,
      totalStudents: school.total_students,
      gradeCounts: school.grade_counts,
      pricing: {
        assignedPlanCode: school.assigned_plan_code,
        assignedPlanName: school.assigned_plan_name,
        billingCycle: school.assigned_billing_cycle,
        basePriceKsh: basePriceKshCents / 100,
        basePriceKshCents,
        effectivePriceKsh: effectivePriceKshCents / 100,
        effectivePriceKshCents,
        discount: school.discount_id
          ? {
              id: school.discount_id,
              name: school.discount_name,
              type: school.discount_type,
              amount: school.discount_amount
            }
          : null
      }
    };
  }

  function buildQuoteOfTheDay() {
    const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return DAILY_QUOTES[dayIndex % DAILY_QUOTES.length];
  }

  function getPlanPeriodEnd(start: Date, billingCycle: 'weekly' | 'monthly' | 'annual') {
    const next = new Date(start);

    if (billingCycle === 'weekly') {
      next.setDate(next.getDate() + 7);
      return next;
    }

    if (billingCycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
      return next;
    }

    next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  function getCallbackItemValue(items: Array<{ Name: string; Value?: string | number }>, name: string) {
    const item = items.find(entry => entry.Name === name);
    return item?.Value;
  }

  function normalizeImportedCurriculum(
    args: {
      grade: string;
      subjectId: string;
      subjectName: string;
    },
    payload: Array<{
      number?: string;
      title: string;
      subStrands: Array<{
        number?: string;
        title: string;
        outcomes?: Array<{ id?: string; text: string } | string>;
        inquiryQuestions?: Array<{ id?: string; text: string } | string>;
      }>;
    }>
  ): CurriculumStrandInput[] {
    return payload.map((strand, strandIndex) => ({
      number: strand.number || `${strandIndex + 1}.0`,
      title: strand.title,
      subTitle: `${args.subjectName} imported curriculum`,
      subStrands: (strand.subStrands || []).map((subStrand, subIndex) => ({
        number: subStrand.number || `${strandIndex + 1}.${subIndex + 1}`,
        title: subStrand.title,
        type: 'knowledge',
        pages: [],
        outcomes: (subStrand.outcomes || [])
          .map((item, itemIndex) => ({
            id:
              typeof item === 'string'
                ? `${args.grade}-${args.subjectId}-${strandIndex + 1}-${subIndex + 1}-outcome-${itemIndex + 1}`
                : item.id,
            text: typeof item === 'string' ? item : item.text
          }))
          .filter(item => item.text.trim().length > 0),
        inquiryQuestions: (subStrand.inquiryQuestions || [])
          .map((item, itemIndex) => ({
            id:
              typeof item === 'string'
                ? `${args.grade}-${args.subjectId}-${strandIndex + 1}-${subIndex + 1}-question-${itemIndex + 1}`
                : item.id,
            text: typeof item === 'string' ? item : item.text
          }))
          .filter(item => item.text.trim().length > 0)
      }))
    }));
  }

  async function requireActiveSubscriptionForAi(
    reply: FastifyReply,
    user: NonNullable<FastifyRequest['user']>
  ) {
    const subscription = await getActiveSubscription(user.id);
    if (!subscription) {
      reply.status(402);
      return { error: { message: 'Active subscription required' }, subscription: null };
    }

    return { error: null, subscription };
  }

  function buildLessonGenerationPrompt(context: NonNullable<Awaited<ReturnType<typeof findCurriculumSubStrandContext>>>) {
    const outcomes = (context.outcomes ?? []).map(item => `- ${item.text}`).join('\n') || '- No explicit outcomes provided';
    const inquiryQuestions =
      (context.inquiry_questions ?? []).map(item => `- ${item.text}`).join('\n') ||
      '- No explicit inquiry questions provided';

    return `Create a rich textbook-style lesson for a learner.

Grade: ${context.grade_level}
Subject: ${context.subject_name}
Strand: ${context.strand_title}
Sub-strand: ${context.sub_strand_title}
Learning outcomes:
${outcomes}

Inquiry questions:
${inquiryQuestions}

Return valid JSON with this shape:
{
  "pages": [
    {
      "title": "string",
      "content": "string"
    }
  ]
}

Requirements:
- Generate 4 to 6 lesson pages.
- Each page must feel like a real learner-friendly book page, not a short note.
- Use clear paragraphs, short examples, and bullets where helpful.
- The lesson must teach the learner enough to understand the outcomes.
- Do not include markdown fences.
- The final page should contain a short recap and a transition into the quiz.`;
  }

  function buildLessonQuizPrompt(context: NonNullable<Awaited<ReturnType<typeof findCurriculumSubStrandContext>>>, questionCount: number) {
    const outcomes = (context.outcomes ?? []).map(item => `- ${item.text}`).join('\n') || '- No explicit outcomes provided';
    const inquiryQuestions =
      (context.inquiry_questions ?? []).map(item => `- ${item.text}`).join('\n') ||
      '- No explicit inquiry questions provided';
    const lessonPages =
      (context.pages ?? [])
        .map(page => `${page.title}\n${page.content}`)
        .join('\n\n') || 'No generated lesson pages are stored yet.';

    return `Generate ${questionCount} quiz questions for a learner after finishing a lesson.

Grade: ${context.grade_level}
Subject: ${context.subject_name}
Strand: ${context.strand_title}
Sub-strand: ${context.sub_strand_title}

Learning outcomes:
${outcomes}

Inquiry questions:
${inquiryQuestions}

Lesson content:
${lessonPages}

Return valid JSON with this shape:
{
  "questions": [
    {
      "id": 1,
      "type": "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY",
      "text": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Requirements:
- Questions must directly test the stated outcomes.
- Mix the question types when appropriate.
- Keep explanations learner-friendly and concise.
- Do not include markdown fences.`;
  }

  async function runSubscriptionScopedAiText(args: {
    request: FastifyRequest;
    reply: FastifyReply;
    body: z.infer<typeof generateTextSchema>;
  }) {
    const currentUser = args.request.user!;
    const subscriptionCheck = await requireActiveSubscriptionForAi(args.reply, currentUser);
    if (subscriptionCheck.error || !subscriptionCheck.subscription) {
      return {
        error: subscriptionCheck.error,
        text: null,
        subscription: null
      };
    }

    const executionPlan = resolveAiExecutionPlan(args.body.feature);
    const subscription = subscriptionCheck.subscription;
    const existingSpend = await getSubscriptionAiSpendKshCents(subscription.id);
    const provisionalTokenEstimate = Math.max(Math.ceil(args.body.prompt.length / 4), 150);
    const provisionalCostUsdMicros = estimateCostUsdMicros(executionPlan, provisionalTokenEstimate, 0);
    const provisionalCostKshCents = usdMicrosToKshCents(provisionalCostUsdMicros, appConfig.KITABU_KSH_PER_USD);
    const budgetKshCents = Number(subscription.price_ksh_cents);

    if (existingSpend + provisionalCostKshCents > budgetKshCents) {
      await withTransaction(async client => {
        await createAiUsageEvent(client, {
          userId: currentUser.id,
          schoolId: currentUser.schoolId,
          subscriptionId: subscription.id,
          feature: args.body.feature,
          provider: executionPlan.provider,
          model: executionPlan.model,
          promptTokens: provisionalTokenEstimate,
          completionTokens: 0,
          totalTokens: provisionalTokenEstimate,
          estimatedCostUsdMicros: provisionalCostUsdMicros,
          fxRateKshPerUsd: appConfig.KITABU_KSH_PER_USD,
          estimatedCostKshCents: provisionalCostKshCents,
          status: 'blocked'
        });
        await createAuditLog(client, currentUser.id, currentUser.schoolId, 'ai.limit.blocked', {
          feature: args.body.feature,
          budgetKshCents,
          existingSpendKshCents: existingSpend
        });
      });

      args.reply.status(402);
      return {
        error: {
          message: 'AI usage limit reached for the current subscription period',
          showProPlan: true
        },
        text: null,
        subscription
      };
    }

    try {
      const result = await generateText(args.body, executionPlan);
      const costUsdMicros = estimateCostUsdMicros(executionPlan, result.promptTokens, result.completionTokens);
      const costKshCents = usdMicrosToKshCents(costUsdMicros, appConfig.KITABU_KSH_PER_USD);

      await withTransaction(async client => {
        await createAiUsageEvent(client, {
          userId: currentUser.id,
          schoolId: currentUser.schoolId,
          subscriptionId: subscription.id,
          feature: args.body.feature,
          provider: executionPlan.provider,
          model: executionPlan.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          estimatedCostUsdMicros: costUsdMicros,
          fxRateKshPerUsd: appConfig.KITABU_KSH_PER_USD,
          estimatedCostKshCents: costKshCents,
          status: 'completed'
        });
      });

      return {
        error: null,
        text: result.text,
        subscription
      };
    } catch (error) {
      await withTransaction(async client => {
        await createAiUsageEvent(client, {
          userId: currentUser.id,
          schoolId: currentUser.schoolId,
          subscriptionId: subscription.id,
          feature: args.body.feature,
          provider: executionPlan.provider,
          model: executionPlan.model,
          promptTokens: provisionalTokenEstimate,
          completionTokens: 0,
          totalTokens: provisionalTokenEstimate,
          estimatedCostUsdMicros: provisionalCostUsdMicros,
          fxRateKshPerUsd: appConfig.KITABU_KSH_PER_USD,
          estimatedCostKshCents: provisionalCostKshCents,
          status: 'failed'
        });
      });

      args.request.log.error({ err: error }, 'AI generation failed');
      args.reply.status(500);
      return {
        error: {
          message: 'AI request failed'
        },
        text: null,
        subscription
      };
    }
  }

  async function confirmEmailVerificationToken(rawToken: string, reply: FastifyReply) {
    const tokenHash = hashOpaqueToken(rawToken);
    const verificationToken = await findActiveEmailVerificationToken(tokenHash);

    if (!verificationToken || verificationToken.used_at || verificationToken.expires_at < new Date()) {
      reply.code(400);
      return {
        ok: false as const,
        message: 'This verification link is invalid or has expired'
      };
    }

    const user = await findUserById(verificationToken.user_id);
    if (!user) {
      reply.code(400);
      return {
        ok: false as const,
        message: 'This verification link is invalid or has expired'
      };
    }

    await withTransaction(async client => {
      await markUserEmailVerified(client, user.id);
      await consumeEmailVerificationToken(client, tokenHash);
      await invalidateEmailVerificationTokensForUser(client, user.id);
      await createAuditLog(client, user.id, user.schoolId, 'auth.email_verification.completed');
    });

    return {
      ok: true as const,
      user
    };
  }

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await findUserByEmail(body.email);

    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      await withTransaction(client => createAuditLog(client, null, null, 'auth.login.failed', { email: body.email }));
      return reply.unauthorized('Invalid credentials');
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashOpaqueToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + appConfig.KITABU_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    const sessionContext = getSessionContext(request);
    const sessionId = randomBytes(16).toString('hex');

    await withTransaction(async client => {
      await insertRefreshToken(client, user.id, refreshTokenHash, refreshExpiresAt, {
        sessionId,
        sessionBindingHash: sessionContext.sessionBindingHash,
        deviceLabel: sessionContext.deviceLabel
      });
      await createAuditLog(client, user.id, user.school_id, 'auth.login.succeeded');
    });

    const totpEnabled = await getUserTotpStatus(user.id);
    const shouldBypassStepUp =
      appConfig.KITABU_NODE_ENV !== 'production' &&
      !totpEnabled &&
      user.roles.some(role => role === 'platform_admin');

      const accessToken = await signAccessToken({
        sub: user.id,
        schoolId: user.school_id,
        sid: sessionId,
        email: user.email,
        fullName: user.full_name,
        emailVerified: user.email_verified,
        roles: user.roles,
        gender: user.gender,
        grade: user.grade_level,
        onboardingCompleted: user.onboarding_completed,
        stepUp: shouldBypassStepUp,
        mustRotatePassword: user.must_rotate_password,
        isBreakGlass: user.is_break_glass
      });

    return buildAuthResponse({ user, accessToken, refreshToken, totpEnabled, sessionId });
  });

  app.post('/auth/signup', { config: { rateLimit: { max: 15, timeWindow: '5 minutes' } } }, async (request, reply) => {
    const body = signupSchema.parse(request.body);
    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      return reply.conflict('An account with that email already exists');
    }

    const passwordHash = await hashPassword(body.password);
      const user = await createSelfServiceUser({
        schoolId: body.schoolId ?? null,
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        role: body.role,
        gender: body.gender,
        grade: body.grade ?? null,
        onboardingCompleted: body.onboardingCompleted ?? body.role !== 'student'
      });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashOpaqueToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + appConfig.KITABU_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    const sessionContext = getSessionContext(request);
    const sessionId = randomBytes(16).toString('hex');

    await withTransaction(async client => {
      await insertRefreshToken(client, user.id, refreshTokenHash, refreshExpiresAt, {
        sessionId,
        sessionBindingHash: sessionContext.sessionBindingHash,
        deviceLabel: sessionContext.deviceLabel
      });
      if (body.mpesaPhoneNumber) {
        await upsertBillingProfile(client, user.id, formatKenyanPhoneNumber(body.mpesaPhoneNumber));
      }
    });

      const accessToken = await signAccessToken({
        sub: user.id,
        schoolId: user.schoolId,
        sid: sessionId,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        roles: user.roles,
        gender: user.gender,
        grade: user.grade ?? null,
        onboardingCompleted: user.onboardingCompleted,
        stepUp: false,
        mustRotatePassword: false,
        isBreakGlass: false
      });

    const rawVerificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = hashOpaqueToken(rawVerificationToken);
    const verificationExpiresAt = new Date(Date.now() + appConfig.KITABU_EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);
    const verificationUrl = `${appConfig.KITABU_EMAIL_VERIFICATION_URL}?token=${encodeURIComponent(rawVerificationToken)}`;

    await withTransaction(async client => {
      await invalidateEmailVerificationTokensForUser(client, user.id);
      await insertEmailVerificationToken(client, user.id, verificationTokenHash, verificationExpiresAt);
      await createAuditLog(client, user.id, user.schoolId, 'auth.email_verification.requested', {
        email: user.email
      });
    });

    const delivered = await sendTransactionalEmail(
      buildEmailVerificationEmail({
        recipientEmail: user.email,
        verificationUrl,
        ttlMinutes: appConfig.KITABU_EMAIL_VERIFICATION_TTL_MINUTES
      })
    );

    if (!delivered) {
      app.log.warn(
        {
          userId: user.id,
          verificationUrl
        },
        'Verification email not sent because SMTP is not configured'
      );
    }

    return reply.status(201).send(buildAuthResponse({ user, accessToken, refreshToken, totpEnabled: false, sessionId }));
  });

  app.post('/auth/email-verification/resend', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request) => {
    const body = verificationEmailSchema.parse(request.body);
    const user = await findUserByEmail(body.email);

    if (user && !user.email_verified) {
      const rawVerificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = hashOpaqueToken(rawVerificationToken);
      const verificationExpiresAt = new Date(Date.now() + appConfig.KITABU_EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);
      const verificationUrl = `${appConfig.KITABU_EMAIL_VERIFICATION_URL}?token=${encodeURIComponent(rawVerificationToken)}`;

      await withTransaction(async client => {
        await invalidateEmailVerificationTokensForUser(client, user.id);
        await insertEmailVerificationToken(client, user.id, verificationTokenHash, verificationExpiresAt);
        await createAuditLog(client, user.id, user.school_id, 'auth.email_verification.requested', {
          email: user.email,
          reason: 'resend'
        });
      });

      const delivered = await sendTransactionalEmail(
        buildEmailVerificationEmail({
          recipientEmail: user.email,
          verificationUrl,
          ttlMinutes: appConfig.KITABU_EMAIL_VERIFICATION_TTL_MINUTES
        })
      );

      if (!delivered) {
        app.log.warn(
          {
            userId: user.id,
            verificationUrl
          },
          'Verification email not sent because SMTP is not configured'
        );
      }
    } else {
      await withTransaction(async client => {
        await createAuditLog(client, user?.id ?? null, user?.school_id ?? null, 'auth.email_verification.requested.ignored', {
          email: body.email.toLowerCase()
        });
      });
    }

    return {
      message: 'If an unverified account exists for that email, a verification email will be sent.'
    };
  });

  app.post('/auth/email-verification/confirm', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = completeEmailVerificationSchema.parse(request.body);
    const result = await confirmEmailVerificationToken(body.token, reply);
    if (!result.ok) {
      return { message: result.message };
    }

    return {
      message: 'Email verified. You can continue using Kitabu AI.'
    };
  });

  app.get('/verify-email', async (request, reply) => {
    const query = tokenQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply
        .type('text/html')
        .send(
          renderHandoffPage({
            title: 'Verification failed',
            message: 'This verification link is missing or invalid.',
            status: 'error'
          })
        );
    }

    const result = await confirmEmailVerificationToken(query.data.token, reply);
    if (!result.ok) {
      return reply
        .type('text/html')
        .send(
          renderHandoffPage({
            title: 'Verification failed',
            message: result.message,
            status: 'error'
          })
        );
    }

    return reply
      .type('text/html')
      .send(
        renderHandoffPage({
          title: 'Email verified',
          message: 'Your email is confirmed. Opening Kitabu App now.',
          detail: 'If the app does not open automatically, use the button below.',
          status: 'success',
          deepLink: getDeepLink('email-verified', { email: result.user.email })
        })
      );
  });

  app.get('/reset-password', async (request, reply) => {
    const query = tokenQuerySchema.safeParse(request.query);
    const token = query.success ? query.data.token : '';
    const bodyHtml = `
      <form id="reset-form">
        <label for="new-password">New password</label>
        <input id="new-password" name="new-password" type="password" minlength="10" required />
        <button type="submit">Update password</button>
        <p id="status"></p>
      </form>
      <script>
        const form = document.getElementById('reset-form');
        const status = document.getElementById('status');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          status.textContent = 'Updating password...';
          const response = await fetch('/auth/password/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: ${JSON.stringify(token)},
              newPassword: document.getElementById('new-password').value
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            status.textContent = payload.message || 'Password reset failed';
            status.className = 'error';
            return;
          }
          status.textContent = payload.message || 'Password updated. Opening Kitabu App.';
          status.className = 'success';
          setTimeout(() => { window.location.href = ${JSON.stringify(getDeepLink('password-reset-complete'))}; }, 250);
        });
      </script>`;

    return reply
      .type('text/html')
      .send(
        renderHandoffPage({
          title: 'Reset your password',
          message: 'Choose a new password to finish account recovery.',
          detail: 'After reset, Kitabu App will reopen so you can sign in again.',
          status: query.success ? 'success' : 'error',
          bodyHtml
        })
      );
  });

  app.get('/.well-known/assetlinks.json', async (_request, reply) => {
    const fingerprints = appConfig.KITABU_ANDROID_SHA256_CERT_FINGERPRINTS
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);

    return reply.send([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: appConfig.KITABU_ANDROID_PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints
        }
      }
    ]);
  });

  app.post('/auth/forgot-password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request) => {
    const body = forgotPasswordSchema.parse(request.body);
    const user = await findUserByEmail(body.email);

    if (user) {
      const rawResetToken = randomBytes(32).toString('hex');
      const tokenHash = hashOpaqueToken(rawResetToken);
      const resetExpiresAt = new Date(Date.now() + appConfig.KITABU_PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
      const resetUrl = `${appConfig.KITABU_PASSWORD_RESET_URL}?token=${encodeURIComponent(rawResetToken)}`;

      await withTransaction(async client => {
        await invalidatePasswordResetTokensForUser(client, user.id);
        await insertPasswordResetToken(client, user.id, tokenHash, resetExpiresAt);
        await createAuditLog(client, user.id, user.school_id, 'auth.password.reset.requested', {
          email: body.email.toLowerCase()
        });
      });

      const delivered = await sendTransactionalEmail(
        buildPasswordResetEmail({
          recipientEmail: user.email,
          resetUrl,
          ttlMinutes: appConfig.KITABU_PASSWORD_RESET_TTL_MINUTES
        })
      );

      if (!delivered) {
        app.log.warn(
          {
            userId: user.id,
            resetUrl
          },
          'Password reset email not sent because SMTP is not configured'
        );
      }
    } else {
      await withTransaction(async client => {
        await createAuditLog(client, null, null, 'auth.password.reset.requested.unknown', {
          email: body.email.toLowerCase()
        });
      });
    }

    return {
      message: 'If an account exists for that email, password reset help will be sent.'
    };
  });

  app.post('/auth/password/reset', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = completePasswordResetSchema.parse(request.body);
    const tokenHash = hashOpaqueToken(body.token);
    const resetToken = await findActivePasswordResetToken(tokenHash);

    if (!resetToken || resetToken.used_at || resetToken.expires_at < new Date()) {
      return reply.badRequest('This password reset link is invalid or has expired');
    }

    const user = await findUserById(resetToken.user_id);
    if (!user) {
      return reply.badRequest('This password reset link is invalid or has expired');
    }

    const passwordHash = await hashPassword(body.newPassword);
    await withTransaction(async client => {
      await updateUserPassword(client, user.id, passwordHash);
      await consumePasswordResetToken(client, tokenHash);
      await invalidatePasswordResetTokensForUser(client, user.id);
      await revokeAllRefreshTokensForUser(client, user.id);
      await createAuditLog(client, user.id, user.schoolId, 'auth.password.reset.completed');
    });

    return {
      message: 'Password updated. You can now sign in with your new password.'
    };
  });

  app.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: appConfig.KITABU_REFRESH_RATE_LIMIT_MAX,
        timeWindow: appConfig.KITABU_REFRESH_RATE_LIMIT_WINDOW
      }
    }
  }, async (request, reply) => {
    const body = refreshSchema.parse(request.body);
    const tokenHash = hashOpaqueToken(body.refreshToken);
    const currentToken = await findActiveRefreshToken(tokenHash);
    if (!currentToken || currentToken.revoked_at || currentToken.expires_at < new Date()) {
      return reply.unauthorized('Refresh token is invalid');
    }

    const user = await findUserById(currentToken.user_id);
    if (!user) {
      return reply.unauthorized('User not found');
    }

    const sessionContext = getSessionContext(request);
    if (currentToken.session_binding_hash !== sessionContext.sessionBindingHash) {
      await withTransaction(async client => {
        await revokeRefreshTokensForSession(client, currentToken.user_id, currentToken.session_id);
        await createAuditLog(client, user.id, user.schoolId, 'auth.refresh.binding_mismatch', {
          sessionId: currentToken.session_id,
          deviceLabel: currentToken.device_label
        });
      });
      return reply.unauthorized('Refresh token is not valid for this session');
    }

    const nextRefreshToken = generateRefreshToken();
    const nextRefreshTokenHash = hashOpaqueToken(nextRefreshToken);
    const nextRefreshExpiresAt = new Date(Date.now() + appConfig.KITABU_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await withTransaction(async client => {
      const nextTokenId = await insertRefreshToken(client, user.id, nextRefreshTokenHash, nextRefreshExpiresAt, {
        replacedByTokenId: currentToken.id,
        sessionId: currentToken.session_id,
        sessionBindingHash: currentToken.session_binding_hash,
        deviceLabel: currentToken.device_label
      });
      await revokeRefreshToken(client, tokenHash, nextTokenId);
      await createAuditLog(client, user.id, user.schoolId, 'auth.refresh.succeeded');
    });

      const accessToken = await signAccessToken({
        sub: user.id,
        schoolId: user.schoolId,
        sid: currentToken.session_id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        roles: user.roles,
        gender: user.gender,
        grade: user.grade ?? null,
        onboardingCompleted: user.onboardingCompleted,
        stepUp: false,
        mustRotatePassword: user.mustRotatePassword,
        isBreakGlass: user.isBreakGlass
      });

    return buildAuthResponse({
      user,
      accessToken,
      refreshToken: nextRefreshToken,
      totpEnabled: await getUserTotpStatus(user.id),
      sessionId: currentToken.session_id
    });
  });

  app.post('/auth/password/rotate', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }
    const currentUser = request.user!;

    const body = rotatePasswordSchema.parse(request.body);
    const user = await findUserByEmail(currentUser.email);
    if (!user || !(await verifyPassword(body.currentPassword, user.password_hash))) {
      return reply.unauthorized('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(body.newPassword);
    await withTransaction(async client => {
      await updateUserPassword(client, currentUser.id, newPasswordHash);
      await createAuditLog(client, currentUser.id, currentUser.schoolId, 'auth.password.rotated');
    });

    const refreshedUser = await findUserById(currentUser.id);
    if (!refreshedUser) {
      return reply.notFound('User not found');
    }

      const accessToken = await signAccessToken({
        sub: refreshedUser.id,
        schoolId: refreshedUser.schoolId,
        sid: currentUser.sessionId ?? undefined,
        email: refreshedUser.email,
        fullName: refreshedUser.fullName,
        emailVerified: refreshedUser.emailVerified,
        roles: refreshedUser.roles,
        gender: refreshedUser.gender,
        grade: refreshedUser.grade ?? null,
        onboardingCompleted: refreshedUser.onboardingCompleted,
        stepUp: refreshedUser.stepUp,
        mustRotatePassword: false,
        isBreakGlass: refreshedUser.isBreakGlass
      });

    return {
      accessToken,
      authState: {
        mustRotatePassword: false,
        requiresPlatformTotp:
          appConfig.KITABU_NODE_ENV === 'production' &&
          refreshedUser.roles.includes('platform_admin') &&
          !(await getUserTotpStatus(refreshedUser.id)),
        isBreakGlass: Boolean(refreshedUser.isBreakGlass)
      }
    };
  });

  app.post('/auth/totp/setup/begin', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const secret = generateTotpSecret();
    const otpauthUrl = buildTotpUri(request.user!.email, secret);

    await withTransaction(async client => {
      await upsertTotpSecret(client, request.user!.id, secret, false);
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'auth.totp.setup.started');
    });

    return {
      secret,
      otpauthUrl
    };
  });

  app.post('/auth/totp/setup/confirm', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const body = totpSchema.parse(request.body);
    const credential = await getTotpSecret(request.user!.id);
    if (!credential) {
      return reply.badRequest('TOTP setup has not been started');
    }
    if (!verifyTotpToken(credential.secret, body.token)) {
      return reply.unauthorized('Invalid TOTP token');
    }

    await withTransaction(async client => {
      await enableTotp(client, request.user!.id);
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'auth.totp.setup.completed');
    });

    const refreshedUser = await findUserById(request.user!.id);
    if (!refreshedUser) {
      return reply.notFound('User not found');
    }

      const accessToken = await signAccessToken({
        sub: refreshedUser.id,
        schoolId: refreshedUser.schoolId,
        sid: request.user!.sessionId ?? undefined,
        email: refreshedUser.email,
        fullName: refreshedUser.fullName,
        emailVerified: refreshedUser.emailVerified,
        roles: refreshedUser.roles,
        gender: refreshedUser.gender,
        grade: refreshedUser.grade ?? null,
        onboardingCompleted: refreshedUser.onboardingCompleted,
        stepUp: true,
        mustRotatePassword: refreshedUser.mustRotatePassword,
        isBreakGlass: refreshedUser.isBreakGlass
      });

    return {
      accessToken,
      authState: {
        mustRotatePassword:
          appConfig.KITABU_NODE_ENV === 'production' ? Boolean(refreshedUser.mustRotatePassword) : false,
        requiresPlatformTotp: false,
        isBreakGlass: Boolean(refreshedUser.isBreakGlass)
      }
    };
  });

  app.post('/auth/step-up/totp', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }
    const currentUser = request.user!;
    if (!currentUser.roles.includes('platform_admin')) {
      return reply.forbidden('TOTP step-up is only required for platform admins');
    }

    const body = totpSchema.parse(request.body);
    const credential = await getTotpSecret(currentUser.id);
    if (!credential?.enabled) {
      return reply.forbidden('TOTP is not enabled for this user');
    }
    if (!verifyTotpToken(credential.secret, body.token)) {
      await withTransaction(client => createAuditLog(client, currentUser.id, currentUser.schoolId, 'auth.step_up.failed'));
      return reply.unauthorized('Invalid TOTP token');
    }

      const accessToken = await signAccessToken({
        sub: currentUser.id,
        schoolId: currentUser.schoolId,
        sid: currentUser.sessionId ?? undefined,
        email: currentUser.email,
        fullName: currentUser.fullName,
        emailVerified: currentUser.emailVerified,
        roles: currentUser.roles,
        gender: currentUser.gender,
        grade: currentUser.grade ?? null,
        onboardingCompleted: currentUser.onboardingCompleted,
        stepUp: true,
        mustRotatePassword: currentUser.mustRotatePassword,
        isBreakGlass: currentUser.isBreakGlass
      });

    await withTransaction(client => createAuditLog(client, currentUser.id, currentUser.schoolId, 'auth.step_up.succeeded'));

    return {
      accessToken,
      expiresInSeconds: appConfig.KITABU_STEP_UP_TTL_SECONDS
    };
  });

  app.get('/curriculum', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const query = curriculumQuerySchema.parse(request.query);
    const subjects = await listCurriculumForGrade(query.grade, request.user!.id);
    return {
      grade: query.grade,
      subjects: query.subjectId
        ? subjects.filter(subject => subject.subjectId === query.subjectId)
        : subjects
    };
  });

  app.put('/curriculum/subjects/:subjectId', async (request, reply) => {
    const authError = await requireRoles(request, reply, ['school_admin', 'platform_admin']);
    if (authError) {
      return authError;
    }

    const params = curriculumSubjectParamsSchema.parse(request.params);
    const body = curriculumReplaceSchema.parse(request.body);

    await withTransaction(async client => {
      await replaceCurriculumSubject(client, {
        actorUserId: request.user!.id,
        grade: body.grade,
        subjectId: params.subjectId,
        subjectName: body.subjectName,
        strands: body.strands
      });
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'curriculum.subject.replaced', {
        grade: body.grade,
        subjectId: params.subjectId,
        strandCount: body.strands.length
      });
    });

    const subjects = await listCurriculumForGrade(body.grade, request.user!.id);
    return {
      grade: body.grade,
      subjects: subjects.filter(subject => subject.subjectId === params.subjectId)
    };
  });

  app.post('/curriculum/import/pdf', async (request, reply) => {
    const authError = await requireRoles(request, reply, ['school_admin', 'platform_admin']);
    if (authError) {
      return authError;
    }

    const body = curriculumImportSchema.parse(request.body);
    const prompt = `Analyze the attached curriculum PDF and extract strands and sub-strands.

Return valid JSON with this shape:
{
  "strands": [
    {
      "number": "1.0",
      "title": "STRAND",
      "subStrands": [
        {
          "number": "1.1",
          "title": "Sub-strand",
          "outcomes": [{ "text": "Outcome" }],
          "inquiryQuestions": [{ "text": "Question" }]
        }
      ]
    }
  ]
}`;

    const aiResult = await runSubscriptionScopedAiText({
      request,
      reply,
      body: {
        prompt,
        responseMimeType: 'application/json',
        feature: 'curriculum_import_processing',
        attachment: {
          mimeType: body.mimeType,
          data: body.base64Data,
          name: body.fileName ?? `${body.subjectId}-curriculum.pdf`,
          type: 'file'
        }
      }
    });

    if (aiResult.error || !aiResult.text) {
      return aiResult.error;
    }

    const parsed = JSON.parse(aiResult.text) as {
      strands?: Array<{
        number?: string;
        title: string;
        subStrands: Array<{
          number?: string;
          title: string;
          outcomes?: Array<{ id?: string; text: string } | string>;
          inquiryQuestions?: Array<{ id?: string; text: string } | string>;
        }>;
      }>;
    };
    const normalizedStrands = normalizeImportedCurriculum(
      {
        grade: body.grade,
        subjectId: body.subjectId,
        subjectName: body.subjectName
      },
      parsed.strands ?? []
    );

    await withTransaction(async client => {
      await replaceCurriculumSubject(client, {
        actorUserId: request.user!.id,
        grade: body.grade,
        subjectId: body.subjectId,
        subjectName: body.subjectName,
        strands: normalizedStrands
      });
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'curriculum.subject.imported', {
        grade: body.grade,
        subjectId: body.subjectId,
        subjectName: body.subjectName,
        strandCount: normalizedStrands.length
      });
    });

    const subjects = await listCurriculumForGrade(body.grade, request.user!.id);
    return {
      grade: body.grade,
      subjects: subjects.filter(subject => subject.subjectId === body.subjectId)
    };
  });

  app.post('/curriculum/sub-strands/:subStrandId/lesson', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const params = subStrandParamsSchema.parse(request.params);
    const context = await findCurriculumSubStrandContext(params.subStrandId);
    if (!context) {
      return reply.notFound('Sub-strand not found');
    }

    if (context.pages.length > 0) {
      return {
        subStrandId: context.sub_strand_id,
        pages: context.pages
      };
    }

    const aiResult = await runSubscriptionScopedAiText({
      request,
      reply,
      body: {
        prompt: buildLessonGenerationPrompt(context),
        responseMimeType: 'application/json',
        feature: 'curriculum_lesson_generation'
      }
    });

    if (aiResult.error || !aiResult.text) {
      return aiResult.error;
    }

    const parsed = JSON.parse(aiResult.text) as { pages?: Array<{ title: string; content: string }> };
    const pages = (parsed.pages ?? []).filter(
      page => page.title.trim().length > 0 && page.content.trim().length > 0
    );

    await withTransaction(async client => {
      await saveCurriculumSubStrandPages(client, params.subStrandId, pages);
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'curriculum.lesson.generated', {
        subStrandId: params.subStrandId,
        pageCount: pages.length
      });
    });

    return {
      subStrandId: params.subStrandId,
      pages
    };
  });

  app.post('/curriculum/sub-strands/:subStrandId/quiz', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const params = subStrandParamsSchema.parse(request.params);
    const body = subStrandQuizSchema.parse(request.body);
    const context = await findCurriculumSubStrandContext(params.subStrandId);
    if (!context) {
      return reply.notFound('Sub-strand not found');
    }

    const aiResult = await runSubscriptionScopedAiText({
      request,
      reply,
      body: {
        prompt: buildLessonQuizPrompt(context, body.questionCount),
        responseMimeType: 'application/json',
        feature: 'curriculum_quiz_generation'
      }
    });

    if (aiResult.error || !aiResult.text) {
      return aiResult.error;
    }

    const parsed = JSON.parse(aiResult.text) as {
      questions?: Array<{
        id?: number;
        type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
        text: string;
        options?: string[];
        correctAnswer?: string | boolean;
        explanation?: string;
      }>;
    };

    return {
      subStrandId: params.subStrandId,
      questions: (parsed.questions ?? []).map((question, index) => ({
        ...question,
        id: question.id ?? index + 1
      }))
    };
  });

  app.post('/curriculum/sub-strands/:subStrandId/complete', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const params = subStrandParamsSchema.parse(request.params);
    const body = subStrandCompletionSchema.parse(request.body);
    const context = await findCurriculumSubStrandContext(params.subStrandId);
    if (!context) {
      return reply.notFound('Sub-strand not found');
    }

    await withTransaction(async client => {
      await markCurriculumSubStrandCompleted(
        client,
        request.user!.id,
        params.subStrandId,
        body.quizScore ?? null
      );
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'curriculum.sub_strand.completed', {
        subStrandId: params.subStrandId,
        quizScore: body.quizScore ?? null
      });
    });

    return {
      completed: true,
      subStrandId: params.subStrandId,
      grade: context.grade_level,
      subjectId: context.subject_id
    };
  });

  app.get('/schools', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const schools = await listSchools();
    return {
      schools: schools.map(serializeSchool)
    };
  });

  app.get('/app/banner', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const firstName = request.user!.fullName.trim().split(/\s+/)[0] || 'there';
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    const activeAnnouncement = await getActiveBannerAnnouncement();

    if (activeAnnouncement) {
      return {
        kind: 'announcement',
        greeting: `Hi ${firstName}, here is something useful for today`,
        timeOfDay,
        title: activeAnnouncement.title,
        message: activeAnnouncement.message,
        ctaLabel: activeAnnouncement.cta_label ?? 'Open',
        ctaTarget: activeAnnouncement.cta_target
      };
    }

    return {
      kind: 'quote',
      greeting: `Hi ${firstName}, ready to learn?`,
      timeOfDay,
      title: 'Quote of the day',
      message: buildQuoteOfTheDay(),
      ctaLabel: 'Ask Tutor',
      ctaTarget: 'ask_tutor'
    };
  });

  app.get('/app/library/books', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const books = await listLibraryBooksForUser(request.user!);
    return {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        spineColor: book.spine_color,
        textColor: book.text_color,
        height: book.height,
        spinePattern: book.spine_pattern
      }))
    };
  });

  app.get('/app/podcasts', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const podcasts = await listLearningPodcastsForUser(request.user!);
    return {
      podcasts: podcasts.map(podcast => ({
        id: podcast.id,
        title: podcast.title,
        subject: podcast.subject,
        type: podcast.type,
        duration: podcast.duration,
        views: podcast.views,
        date: podcast.published_on.toISOString().slice(0, 10),
        author: podcast.author,
        thumbnail: podcast.thumbnail_url,
        url: podcast.media_url
      }))
    };
  });

  app.get('/homework/assignments', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['student']);
    if (precondition) {
      return precondition;
    }

    const assignments = await listStudentAssignments(request.user!);
    return {
      assignments: assignments.map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        description: item.description,
        gradeLevel: item.grade_level,
        dueDate: item.due_at ? item.due_at.toISOString() : null,
        status: item.status,
        questions: item.questions,
        score: item.score,
        submittedDate: item.submitted_at ? item.submitted_at.toISOString() : null
      }))
    };
  });

  app.post('/homework/assignments/:assignmentId/submit', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['student']);
    if (precondition) {
      return precondition;
    }

    const params = assignmentParamsSchema.parse(request.params);
    const body = studentAssignmentSubmissionSchema.parse(request.body);

    await withTransaction(async client => {
      await submitStudentAssignment(client, request.user!, params.assignmentId, body);
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'assignment.submitted', {
        assignmentId: params.assignmentId,
        score: body.score
      });
    });

    return { success: true };
  });

  app.get('/teacher/students', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['teacher', 'school_admin', 'platform_admin']);
    if (precondition) {
      return precondition;
    }

    const students = await listTeacherStudents(request.user!);
    return {
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        assessmentScore: student.assessment_score,
        homeworkCompletion: student.homework_completion,
        lastActive: student.last_active,
        trend: student.trend
      }))
    };
  });

  app.get('/teacher/assignments', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['teacher', 'school_admin', 'platform_admin']);
    if (precondition) {
      return precondition;
    }

    const [assignments, submissions] = await Promise.all([
      listTeacherAssignments(request.user!),
      listAssignmentSubmissionsForTeacher(request.user!)
    ]);

    const submissionsByAssignment = submissions.reduce<Record<string, unknown[]>>((acc, item) => {
      if (!acc[item.assignment_id]) {
        acc[item.assignment_id] = [];
      }
      acc[item.assignment_id].push({
        studentId: item.student_id,
        studentName: item.student_name,
        score: item.score,
        status: item.status,
        answers: item.answers
      });
      return acc;
    }, {});

    return {
      assignments: assignments.map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        description: item.description,
        gradeLevel: item.grade_level,
        dueDate: item.due_at ? item.due_at.toISOString() : null,
        status: 'pending',
        questions: item.questions,
        submittedCount: item.submitted_count,
        totalStudents: item.total_students,
        averageScore: item.average_score,
        dateSent: item.created_at.toISOString()
      })),
      submissionsByAssignment
    };
  });

  app.post('/teacher/assignments', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['teacher', 'school_admin', 'platform_admin']);
    if (precondition) {
      return precondition;
    }

    const body = teacherAssignmentSchema.parse(request.body);

    const assignmentId = await withTransaction(async client => {
      const createdAssignmentId = await createTeacherAssignment(client, request.user!, {
        title: body.title,
        subject: body.subject,
        description: body.description,
        gradeLevel: body.gradeLevel,
        dueAt: body.dueDate ? new Date(body.dueDate) : null,
        questions: body.questions
      });

      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'teacher.assignment.created', {
        assignmentId: createdAssignmentId,
        subject: body.subject,
        gradeLevel: body.gradeLevel
      });

      return createdAssignmentId;
    });

    return reply.status(201).send({ assignmentId });
  });

  app.get('/admin/users', async (request, reply) => {
    const needsStepUp = request.user?.roles.includes('platform_admin');
    const precondition = await requireRoles(request, reply, ['school_admin', 'platform_admin'], {
      requireStepUp: needsStepUp
    });
    if (precondition) {
      return precondition;
    }

    const users = await listAdminUsers(request.user!);
    return { users };
  });

  app.post('/me/onboarding', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    if (!request.user!.roles.includes('student')) {
      return reply.forbidden('Only student accounts can complete onboarding here');
    }

    const body = onboardingSchema.parse(request.body);
    const normalizedPhone = body.mpesaPhoneNumber
      ? formatKenyanPhoneNumber(body.mpesaPhoneNumber)
      : null;

    await withTransaction(async client => {
      await updateUserOnboarding(client, {
        userId: request.user!.id,
        schoolId: body.schoolId,
        gender: body.gender,
        grade: body.grade,
        mpesaPhoneNumber: normalizedPhone
      });
      await createAuditLog(client, request.user!.id, body.schoolId, 'auth.onboarding.completed', {
        grade: body.grade
      });
    });

    const refreshedUser = await findUserById(request.user!.id);
    if (!refreshedUser) {
      return reply.notFound('User not found');
    }

    const accessToken = await signAccessToken({
      sub: refreshedUser.id,
      schoolId: refreshedUser.schoolId,
      sid: request.user!.sessionId ?? undefined,
      email: refreshedUser.email,
      fullName: refreshedUser.fullName,
      emailVerified: refreshedUser.emailVerified,
      roles: refreshedUser.roles,
      gender: refreshedUser.gender,
      grade: refreshedUser.grade ?? null,
      onboardingCompleted: refreshedUser.onboardingCompleted,
      stepUp: refreshedUser.stepUp,
      mustRotatePassword: refreshedUser.mustRotatePassword,
      isBreakGlass: refreshedUser.isBreakGlass
    });

    return {
      accessToken,
      user: {
        id: refreshedUser.id,
        schoolId: refreshedUser.schoolId,
        sessionId: request.user!.sessionId,
        email: refreshedUser.email,
        fullName: refreshedUser.fullName,
        emailVerified: refreshedUser.emailVerified,
        roles: refreshedUser.roles,
        gender: refreshedUser.gender,
        grade: refreshedUser.grade ?? null,
        onboardingCompleted: refreshedUser.onboardingCompleted
      }
    };
  });

  app.get('/admin/schools', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const schools = await listSchools();
    return {
      schools: schools.map(serializeSchool)
    };
  });

  app.get('/admin/subscription-plans', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const plans = await listSubscriptionPlans(['weekly', 'monthly', 'annual']);
    return {
      plans: plans.map(plan =>
        serializePlan({
          code: plan.code,
          name: plan.name,
          billingCycle: plan.billing_cycle,
          priceKshCents: Number(plan.price_ksh_cents),
          isPopular: plan.code === 'monthly'
        })
      )
    };
  });

  app.post('/admin/schools', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const body = schoolSchema.parse(request.body);
    const assignedPlan = await findSubscriptionPlanByCode(body.assignedPlanCode);
    if (!assignedPlan || assignedPlan.is_hidden) {
      return reply.badRequest('Assigned subscription package is invalid');
    }

    const schoolId = await withTransaction(async client => {
      const createdSchoolId = await createSchool(client, {
        name: body.name,
        slug: slugifySchoolName(body.name),
        location: body.location,
        principal: body.principal,
        phone: body.phone,
        email: body.email,
        assignedPlanId: assignedPlan.id,
        discountId: body.discountId ?? null
      });
      await createAuditLog(client, request.user!.id, createdSchoolId, 'admin.school.created', {
        assignedPlanCode: body.assignedPlanCode
      });
      return createdSchoolId;
    });

    const school = await findSchoolById(schoolId);
    return reply.status(201).send({
      school: school ? serializeSchool(school) : null
    });
  });

  app.patch('/admin/schools/:schoolId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = schoolParamsSchema.parse(request.params);
    const body = schoolSchema.parse(request.body);
    const assignedPlan = await findSubscriptionPlanByCode(body.assignedPlanCode);
    if (!assignedPlan || assignedPlan.is_hidden) {
      return reply.badRequest('Assigned subscription package is invalid');
    }

    await withTransaction(async client => {
      await updateSchool(client, params.schoolId, {
        name: body.name,
        slug: slugifySchoolName(body.name),
        location: body.location,
        principal: body.principal,
        phone: body.phone,
        email: body.email,
        assignedPlanId: assignedPlan.id,
        discountId: body.discountId ?? null
      });
      await createAuditLog(client, request.user!.id, params.schoolId, 'admin.school.updated', {
        assignedPlanCode: body.assignedPlanCode
      });
    });

    const school = await findSchoolById(params.schoolId);
    return {
      school: school ? serializeSchool(school) : null
    };
  });

  app.delete('/admin/schools/:schoolId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = schoolParamsSchema.parse(request.params);
    await withTransaction(async client => {
      await deleteSchool(client, params.schoolId);
      await createAuditLog(client, request.user!.id, params.schoolId, 'admin.school.deleted');
    });

    return { deleted: true };
  });

  app.get('/admin/discounts', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    return {
      discounts: await listSchoolDiscounts()
    };
  });

  app.post('/admin/discounts', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const body = schoolDiscountSchema.parse(request.body);
    const discountId = await withTransaction(async client => {
      const createdDiscountId = await createSchoolDiscount(client, body);
      await createAuditLog(client, request.user!.id, null, 'admin.discount.created', {
        discountId: createdDiscountId
      });
      return createdDiscountId;
    });

    return reply.status(201).send({ discountId });
  });

  app.patch('/admin/discounts/:discountId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = discountParamsSchema.parse(request.params);
    const body = schoolDiscountSchema.parse(request.body);
    await withTransaction(async client => {
      await updateSchoolDiscount(client, params.discountId, body);
      await createAuditLog(client, request.user!.id, null, 'admin.discount.updated', {
        discountId: params.discountId
      });
    });

    return { updated: true };
  });

  app.delete('/admin/discounts/:discountId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = discountParamsSchema.parse(request.params);
    await withTransaction(async client => {
      await deleteSchoolDiscount(client, params.discountId);
      await createAuditLog(client, request.user!.id, null, 'admin.discount.deleted', {
        discountId: params.discountId
      });
    });

    return { deleted: true };
  });

  app.get('/admin/announcements', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    return {
      announcements: await listBannerAnnouncements()
    };
  });

  app.post('/admin/announcements', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const body = announcementSchema.parse(request.body);
    const announcementId = await withTransaction(async client => {
      const createdAnnouncementId = await createBannerAnnouncement(client, {
        title: body.title,
        message: body.message,
        ctaLabel: body.ctaLabel ?? null,
        ctaTarget: body.ctaTarget,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive
      });
      await createAuditLog(client, request.user!.id, null, 'admin.announcement.created', {
        announcementId: createdAnnouncementId
      });
      return createdAnnouncementId;
    });

    return reply.status(201).send({ announcementId });
  });

  app.patch('/admin/announcements/:announcementId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = announcementParamsSchema.parse(request.params);
    const body = announcementSchema.parse(request.body);
    await withTransaction(async client => {
      await updateBannerAnnouncement(client, params.announcementId, {
        title: body.title,
        message: body.message,
        ctaLabel: body.ctaLabel ?? null,
        ctaTarget: body.ctaTarget,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive
      });
      await createAuditLog(client, request.user!.id, null, 'admin.announcement.updated', {
        announcementId: params.announcementId
      });
    });

    return { updated: true };
  });

  app.delete('/admin/announcements/:announcementId', async (request, reply) => {
    const precondition = await requireRoles(request, reply, ['platform_admin']);
    if (precondition) {
      return precondition;
    }

    const params = announcementParamsSchema.parse(request.params);
    await withTransaction(async client => {
      await deleteBannerAnnouncement(client, params.announcementId);
      await createAuditLog(client, request.user!.id, null, 'admin.announcement.deleted', {
        announcementId: params.announcementId
      });
    });

    return { deleted: true };
  });

  app.get('/billing/plans', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const [schoolPricing, hasPaidBefore, hiddenTrialPlan] = await Promise.all([
      findSchoolPricingForUser(request.user!.id),
      hasSuccessfulPayments(request.user!.id),
      findSubscriptionPlanByCode('trial_monthly_1bob')
    ]);

    const isSchoolManaged =
      Boolean(schoolPricing) &&
      !request.user!.roles.includes('platform_admin') &&
      !request.user!.roles.includes('school_admin');

    const plans = isSchoolManaged && schoolPricing
      ? [
          serializePlan({
            code: schoolPricing.assigned_plan_code,
            name: schoolPricing.assigned_plan_name,
            billingCycle: schoolPricing.assigned_billing_cycle,
            priceKshCents: applyDiscount(Number(schoolPricing.assigned_plan_price_ksh_cents), {
              type: schoolPricing.discount_type,
              amount: schoolPricing.discount_amount
            }),
            originalPriceKshCents: Number(schoolPricing.assigned_plan_price_ksh_cents),
            isPopular: schoolPricing.assigned_plan_code === 'monthly',
            isSchoolManaged: true,
            discountName: schoolPricing.discount_name
          })
        ]
      : (await listSubscriptionPlans(getAllowedPlanCodesForUser(request.user!))).map(plan =>
          serializePlan({
            code: plan.code,
            name: plan.name,
            billingCycle: plan.billing_cycle,
            priceKshCents: Number(plan.price_ksh_cents),
            isPopular: plan.code === 'monthly'
          })
        );

    return {
      plans,
      school: isSchoolManaged && schoolPricing ? serializeSchool(schoolPricing) : null,
      trialOffer:
        !hasPaidBefore && hiddenTrialPlan
          ? serializePlan({
              code: hiddenTrialPlan.code,
              name: hiddenTrialPlan.name,
              billingCycle: hiddenTrialPlan.billing_cycle,
              priceKshCents: Number(hiddenTrialPlan.price_ksh_cents)
            })
          : null
    };
  });

  app.get('/billing/subscription', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const [subscription, billingProfile, schoolPricing, hasPaidBefore] = await Promise.all([
      getActiveSubscription(request.user!.id),
      getBillingProfile(request.user!.id),
      findSchoolPricingForUser(request.user!.id),
      hasSuccessfulPayments(request.user!.id)
    ]);

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            code: subscription.plan_code,
            name: subscription.plan_name,
            billingCycle: subscription.billing_cycle,
            priceKsh: Number(subscription.price_ksh_cents) / 100,
            periodStart: subscription.period_start.toISOString(),
            periodEnd: subscription.period_end.toISOString(),
            status: subscription.status
          }
        : null,
      savedMpesaPhoneNumber: billingProfile?.mpesa_phone_number ?? null,
      maskedMpesaPhoneNumber: maskKenyanPhoneNumber(billingProfile?.mpesa_phone_number ?? null),
      hasPaidBefore,
      school: schoolPricing ? serializeSchool(schoolPricing) : null
    };
  });

  app.post('/billing/checkout/mpesa', {
    config: { rateLimit: { max: 6, timeWindow: '1 minute' } }
  }, async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    await withTransaction(async client => {
      await expirePendingPaymentRequests(client);
    });

    const body = mpesaCheckoutSchema.parse(request.body);
    const normalizedPhoneNumber = formatKenyanPhoneNumber(body.phoneNumber);
    const [plan, activeSubscription, schoolPricing, hasPaidBefore] = await Promise.all([
      findSubscriptionPlanByCode(body.planCode),
      getActiveSubscription(request.user!.id),
      findSchoolPricingForUser(request.user!.id),
      hasSuccessfulPayments(request.user!.id)
    ]);

    if (!plan) {
      return reply.notFound('Subscription plan not found');
    }

    const isAdminUser =
      request.user!.roles.includes('platform_admin') || request.user!.roles.includes('school_admin');
    const isSchoolManaged = Boolean(schoolPricing) && !isAdminUser;

    let amountKshCents = Number(plan.price_ksh_cents);

    if (body.planCode === 'trial_monthly_1bob') {
      if (hasPaidBefore) {
        return reply.forbidden('Try for 1 bob is only available before your first payment');
      }
    } else if (isSchoolManaged && schoolPricing) {
      if (body.planCode !== schoolPricing.assigned_plan_code) {
        return reply.forbidden('Your school account can only use the assigned subscription package');
      }
      amountKshCents = applyDiscount(Number(schoolPricing.assigned_plan_price_ksh_cents), {
        type: schoolPricing.discount_type,
        amount: schoolPricing.discount_amount
      });
    } else {
      const allowedPlans = getAllowedPlanCodesForUser(request.user!);
      if (!allowedPlans.includes(body.planCode)) {
        return reply.forbidden('That plan is not available for this account');
      }
    }

    if (activeSubscription?.plan_code === plan.code && activeSubscription.period_end > new Date()) {
      return {
        alreadySubscribed: true,
        subscription: {
          id: activeSubscription.id,
          code: activeSubscription.plan_code,
          periodEnd: activeSubscription.period_end.toISOString()
        }
      };
    }

    const expiresAt = new Date(Date.now() + appConfig.KITABU_MPESA_STK_TIMEOUT_MINUTES * 60 * 1000);
    const paymentRequestId = await withTransaction(async client => {
      const requestId = await createPaymentRequest(client, {
        userId: request.user!.id,
        planId: plan.id,
        planCode: plan.code,
        amountKshCents,
        phoneNumber: normalizedPhoneNumber,
        returnTo: body.returnTo,
        expiresAt
      });
      await upsertBillingProfile(client, request.user!.id, normalizedPhoneNumber);
      await createAuditLog(client, request.user!.id, request.user!.schoolId, 'billing.checkout.started', {
        planCode: plan.code,
        paymentRequestId: requestId,
        returnTo: body.returnTo,
        amountKshCents
      });
      return requestId;
    });

    try {
      const stkResponse = await initiateStkPush({
        amountKsh: amountKshCents / 100,
        phoneNumber: normalizedPhoneNumber,
        reference: buildSubscriptionReference(request.user!.id, plan.code),
        description: appConfig.KITABU_MPESA_TRANSACTION_DESC
      });

      await withTransaction(async client => {
        await markPaymentRequestInitiated(
          client,
          paymentRequestId,
          stkResponse.merchantRequestId,
          stkResponse.checkoutRequestId
        );
      });

      return {
        paymentRequestId,
        checkoutRequestId: stkResponse.checkoutRequestId,
        customerMessage: stkResponse.customerMessage,
        expiresAt: expiresAt.toISOString(),
        maskedMpesaPhoneNumber: maskKenyanPhoneNumber(normalizedPhoneNumber)
      };
    } catch (error) {
      await withTransaction(async client => {
        await markPaymentRequestFailed(client, paymentRequestId, {
          status: 'failed',
          resultCode: null,
          resultDesc: error instanceof Error ? error.message : 'Unable to initiate STK push',
          rawCallback: {
            stage: 'initiation',
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      });

      return reply.badRequest(error instanceof Error ? error.message : 'Unable to initiate checkout');
    }
  });

  app.get('/billing/checkout/:paymentRequestId', async (request, reply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }

    const params = checkoutParamsSchema.parse(request.params);
    const paymentRequest = await findPaymentRequestByIdForUser(params.paymentRequestId, request.user!.id);

    if (!paymentRequest) {
      return reply.notFound('Checkout request not found');
    }

    const subscription = paymentRequest.status === 'paid'
      ? await getActiveSubscription(request.user!.id)
      : null;

    return {
      paymentRequestId: paymentRequest.id,
      status: paymentRequest.status,
      returnTo: paymentRequest.return_to,
      phoneNumber: paymentRequest.phone_number,
      maskedPhoneNumber: maskKenyanPhoneNumber(paymentRequest.phone_number),
      resultCode: paymentRequest.result_code,
      resultDescription: paymentRequest.result_desc,
      receiptNumber: paymentRequest.mpesa_receipt_number,
      expiresAt: paymentRequest.expires_at.toISOString(),
      subscription: subscription
        ? {
            code: subscription.plan_code,
            name: subscription.plan_name,
            periodEnd: subscription.period_end.toISOString()
          }
        : null
    };
  });

  app.post('/billing/mpesa/callback', async (request, reply) => {
    const payload = mpesaCallbackSchema.parse(request.body);
    const callback = payload.Body.stkCallback;
    const items = callback.CallbackMetadata?.Item ?? [];
    const paymentRequest = await findPaymentRequestByCheckoutRequestId(callback.CheckoutRequestID);

    if (!paymentRequest) {
      request.log.warn({ checkoutRequestId: callback.CheckoutRequestID }, 'M-Pesa callback did not match a payment request');
      return { accepted: true };
    }

    if (paymentRequest.status === 'paid') {
      return { accepted: true };
    }

    const receiptNumber = getCallbackItemValue(items, 'MpesaReceiptNumber');

    await withTransaction(async client => {
      if (callback.ResultCode === 0) {
        const plan = await findSubscriptionPlanByCode(paymentRequest.plan_code);
        if (!plan) {
          throw new Error('Subscription plan missing for successful payment');
        }

        const periodStart = new Date();
        const periodEnd = getPlanPeriodEnd(periodStart, plan.billing_cycle);

        await markPaymentRequestSuccessful(client, paymentRequest.id, {
          receiptNumber: typeof receiptNumber === 'string' ? receiptNumber : null,
          resultCode: callback.ResultCode,
          resultDesc: callback.ResultDesc,
          rawCallback: payload as Record<string, unknown>
        });

        await replaceActiveSubscription(client, {
          userId: paymentRequest.user_id,
          planId: paymentRequest.plan_id,
          billingCycle: plan.billing_cycle,
          priceKshCents: Number(paymentRequest.amount_ksh_cents),
          periodStart,
          periodEnd
        });

        await createAuditLog(client, paymentRequest.user_id, null, 'billing.checkout.completed', {
          paymentRequestId: paymentRequest.id,
          planCode: paymentRequest.plan_code,
          receiptNumber: typeof receiptNumber === 'string' ? receiptNumber : null
        });
      } else {
        const failureStatus = callback.ResultCode === 1032 ? 'cancelled' : 'failed';
        await markPaymentRequestFailed(client, paymentRequest.id, {
          status: failureStatus,
          resultCode: callback.ResultCode,
          resultDesc: callback.ResultDesc,
          rawCallback: payload as Record<string, unknown>
        });
        await createAuditLog(client, paymentRequest.user_id, null, 'billing.checkout.failed', {
          paymentRequestId: paymentRequest.id,
          planCode: paymentRequest.plan_code,
          resultCode: callback.ResultCode,
          resultDesc: callback.ResultDesc
        });
      }
    });

    return { accepted: true };
  });

  app.get('/admin/analytics/ai-usage', {
    config: {
      rateLimit: {
        max: appConfig.KITABU_ADMIN_ANALYTICS_RATE_LIMIT_MAX,
        timeWindow: appConfig.KITABU_ADMIN_ANALYTICS_RATE_LIMIT_WINDOW
      }
    }
  }, async (request, reply) => {
    const needsStepUp = request.user?.roles.includes('platform_admin');
    const precondition = await requireRoles(request, reply, ['school_admin', 'platform_admin'], {
      requireStepUp: needsStepUp
    });
    if (precondition) {
      return precondition;
    }
    const schoolContextError = await requireSchoolContext(request, reply, { allowPlatformAdmin: true });
    if (schoolContextError) {
      return schoolContextError;
    }
    return getAdminAiAnalytics(request.user!);
  });

  app.get('/admin/analytics/billing', {
    config: {
      rateLimit: {
        max: appConfig.KITABU_ADMIN_ANALYTICS_RATE_LIMIT_MAX,
        timeWindow: appConfig.KITABU_ADMIN_ANALYTICS_RATE_LIMIT_WINDOW
      }
    }
  }, async (request, reply) => {
    const needsStepUp = request.user?.roles.includes('platform_admin');
    const precondition = await requireRoles(request, reply, ['school_admin', 'platform_admin'], {
      requireStepUp: needsStepUp
    });
    if (precondition) {
      return precondition;
    }
    const schoolContextError = await requireSchoolContext(request, reply, { allowPlatformAdmin: true });
    if (schoolContextError) {
      return schoolContextError;
    }
    return getBillingAnalytics(request.user!);
  });

  const generateTextHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const authError = await requireAuthenticated(request, reply);
    if (authError) {
      return authError;
    }
    const body = generateTextSchema.parse(request.body);

    const result = await runSubscriptionScopedAiText({
      request,
      reply,
      body
    });

    if (result.error || !result.text) {
      return result.error;
    }

    return { text: result.text };
  };

  const aiGenerationRateLimit = {
    config: {
      rateLimit: {
        max: appConfig.KITABU_AI_RATE_LIMIT_MAX,
        timeWindow: appConfig.KITABU_AI_RATE_LIMIT_WINDOW
      }
    }
  };

  app.post('/generate-text', aiGenerationRateLimit, generateTextHandler);
  app.post('/ai/generate-text', aiGenerationRateLimit, generateTextHandler);

  return app;
}
