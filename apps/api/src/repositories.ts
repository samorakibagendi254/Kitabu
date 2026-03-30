import type { PoolClient, QueryResultRow } from 'pg';
import { db } from './db.js';
import type {
  AppRole,
  AuthenticatedUser,
  EmailVerificationTokenRecord,
  PasswordResetTokenRecord
} from './types.js';
import type { BillingPlanCode } from './payments.js';

type MaybeClient = PoolClient | typeof db;

function q<T extends QueryResultRow>(client: MaybeClient, text: string, values: unknown[] = []) {
  return client.query<T>(text, values);
}

export interface UserRecord {
  id: string;
  school_id: string | null;
  email: string;
  full_name: string;
  password_hash: string;
  email_verified: boolean;
  gender: 'male' | 'female' | 'not_specified';
  grade_level: string | null;
  onboarding_completed: boolean;
  must_rotate_password: boolean;
  is_break_glass: boolean;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  session_id: string;
  session_binding_hash: string;
  device_label: string | null;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface SubscriptionPlanRecord {
  id: string;
  code: BillingPlanCode;
  name: string;
  billing_cycle: 'weekly' | 'monthly' | 'annual';
  price_ksh_cents: string;
  is_pro: boolean;
  is_hidden: boolean;
}

export interface BillingProfileRecord {
  user_id: string;
  mpesa_phone_number: string | null;
  updated_at: Date;
}

export interface PaymentRequestRecord {
  id: string;
  user_id: string;
  plan_id: string;
  plan_code: BillingPlanCode;
  status: string;
  amount_ksh_cents: string;
  phone_number: string;
  return_to: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  result_code: number | null;
  result_desc: string | null;
  expires_at: Date;
  completed_at: Date | null;
  created_at: Date;
}

export interface SchoolDiscountRecord {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_ksh';
  amount: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  status: string;
  location: string;
  principal: string | null;
  phone: string | null;
  email: string | null;
  assigned_plan_id: string;
  assigned_plan_code: BillingPlanCode;
  assigned_plan_name: string;
  assigned_billing_cycle: 'weekly' | 'monthly' | 'annual';
  assigned_plan_price_ksh_cents: string;
  discount_id: string | null;
  discount_name: string | null;
  discount_type: 'percentage' | 'fixed_ksh' | null;
  discount_amount: number | null;
  total_students: number;
  grade_counts: Record<string, number>;
}

export interface BannerAnnouncementRecord {
  id: string;
  title: string;
  message: string;
  cta_label: string | null;
  cta_target: string;
  starts_at: Date;
  ends_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CurriculumStrandInput {
  number?: string;
  title: string;
  subTitle?: string;
  subStrands: Array<{
    number?: string;
    title: string;
    type: 'knowledge' | 'skill' | 'competence';
    description?: string;
    pages?: Array<{ title: string; content: string }>;
    outcomes?: Array<{ id?: string; text: string }>;
    inquiryQuestions?: Array<{ id?: string; text: string }>;
  }>;
}

export interface CurriculumStrandRecord {
  id: string;
  grade_level: string;
  subject_id: string;
  subject_name: string;
  number: string | null;
  title: string;
  sub_title: string;
  position: number;
}

export interface CurriculumSubStrandRecord {
  id: string;
  strand_id: string;
  number: string | null;
  title: string;
  type: 'knowledge' | 'skill' | 'competence';
  description: string | null;
  position: number;
  outcomes: Array<{ id?: string; text: string }>;
  inquiry_questions: Array<{ id?: string; text: string }>;
  pages: Array<{ title: string; content: string }>;
  lesson_generated_at: Date | null;
}

export interface CurriculumSubjectBundle {
  subjectId: string;
  subjectName: string;
  strands: Array<{
    id: string;
    title: string;
    subTitle: string;
    number?: string;
    subStrands: Array<{
      id: string;
      title: string;
      type: 'knowledge' | 'skill' | 'competence';
      description?: string;
      pages: Array<{ title: string; content: string }>;
      isLocked: boolean;
      isCompleted: boolean;
      number?: string;
      outcomes: Array<{ id: string; text: string }>;
      inquiryQuestions: Array<{ id: string; text: string }>;
    }>;
  }>;
}

export interface LibraryBookRecord {
  id: string;
  title: string;
  author: string;
  spine_color: string;
  text_color: string;
  height: string;
  spine_pattern: 'plain' | 'striped' | 'banded';
}

export interface LearningPodcastRecord {
  id: string;
  title: string;
  subject: string;
  type: 'audio' | 'video';
  duration: string;
  views: string;
  published_on: Date;
  author: string;
  thumbnail_url: string | null;
  media_url: string;
}

export interface TeacherStudentRecord {
  id: string;
  name: string;
  grade: string;
  assessment_score: number;
  homework_completion: number;
  last_active: string;
  trend: 'Improving' | 'Stable' | 'Excellent';
}

export interface TeacherAssignmentRecord {
  id: string;
  title: string;
  subject: string;
  description: string;
  grade_level: string;
  due_at: Date | null;
  created_at: Date;
  questions: Array<{
    id: number;
    type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
    text: string;
    options?: string[];
    correctAnswer?: string | boolean;
    explanation?: string;
  }>;
  submitted_count: number;
  total_students: number;
  average_score: number;
}

export interface SubmissionReviewRecord {
  assignment_id: string;
  student_id: string;
  student_name: string;
  score: number;
  status: 'Completed' | 'Late' | 'Pending';
  answers: Array<{
    questionId: number;
    question: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

export interface StudentAssignmentRecord {
  id: string;
  title: string;
  subject: string;
  description: string;
  grade_level: string;
  due_at: Date | null;
  questions: Array<{
    id: number;
    type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
    text: string;
    options?: string[];
    correctAnswer?: string | boolean;
    explanation?: string;
  }>;
  status: 'pending' | 'completed';
  score: number | null;
  submitted_at: Date | null;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  grade: string;
  school: string;
  email: string;
  status: 'Online' | 'Offline' | 'Active';
  color: 'green' | 'gray';
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByEmail(email: string): Promise<(UserRecord & { roles: AppRole[] }) | null> {
  const userResult = await db.query<UserRecord>(
    `SELECT id, school_id, email, full_name, password_hash, email_verified, gender, grade_level,
            onboarding_completed, must_rotate_password, is_break_glass
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  const roleResult = await db.query<{ role: AppRole }>(
    `SELECT role FROM user_roles WHERE user_id = $1`,
    [user.id]
  );

  return {
    ...user,
    roles: roleResult.rows.map(row => row.role)
  };
}

export async function findUserById(userId: string): Promise<AuthenticatedUser | null> {
  const userResult = await db.query<{
    id: string;
    school_id: string | null;
    email: string;
    full_name: string;
    email_verified: boolean;
    gender: 'male' | 'female' | 'not_specified';
    grade_level: string | null;
    onboarding_completed: boolean;
    must_rotate_password: boolean;
    is_break_glass: boolean;
  }>(
    `SELECT id, school_id, email, full_name, email_verified, gender, grade_level,
            onboarding_completed, must_rotate_password, is_break_glass
     FROM users
     WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  const roleResult = await db.query<{ role: AppRole }>('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
  return {
    id: user.id,
    schoolId: user.school_id,
    sessionId: null,
    email: user.email,
    fullName: user.full_name,
    emailVerified: user.email_verified,
    roles: roleResult.rows.map(row => row.role),
    gender: user.gender,
    grade: user.grade_level,
    onboardingCompleted: user.onboarding_completed,
    stepUp: false,
    mustRotatePassword: user.must_rotate_password,
    isBreakGlass: user.is_break_glass
  };
}

export async function createSelfServiceUser(input: {
  schoolId: string | null;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'student' | 'teacher';
  gender?: 'male' | 'female' | 'not_specified';
  grade?: string | null;
  onboardingCompleted?: boolean;
}) {
  return withTransaction(async client => {
    const userResult = await q<{
      id: string;
      school_id: string | null;
      email: string;
      full_name: string;
      email_verified: boolean;
      gender: 'male' | 'female' | 'not_specified';
      grade_level: string | null;
      onboarding_completed: boolean;
      must_rotate_password: boolean;
      is_break_glass: boolean;
    }>(
      client,
      `INSERT INTO users (school_id, email, password_hash, full_name, gender, grade_level, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, school_id, email, full_name, email_verified, gender, grade_level,
                 onboarding_completed, must_rotate_password, is_break_glass`,
      [
        input.schoolId,
        input.email.toLowerCase(),
        input.passwordHash,
        input.fullName,
        input.gender ?? 'not_specified',
        input.grade ?? null,
        input.onboardingCompleted ?? false
      ]
    );
    const user = userResult.rows[0];
    await q(
      client,
      `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`,
      [user.id, input.role]
    );
    await createAuditLog(client, user.id, user.school_id, 'auth.signup.succeeded', { role: input.role });
    return {
      id: user.id,
      schoolId: user.school_id,
      sessionId: null,
      email: user.email,
      fullName: user.full_name,
      emailVerified: user.email_verified,
      roles: [input.role] as AppRole[],
      gender: user.gender,
      grade: user.grade_level,
      onboardingCompleted: user.onboarding_completed,
      stepUp: false,
      mustRotatePassword: user.must_rotate_password,
      isBreakGlass: user.is_break_glass
    };
  });
}

export async function insertRefreshToken(
  client: MaybeClient,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  options: {
    replacedByTokenId?: string | null;
    sessionId: string;
    sessionBindingHash: string;
    deviceLabel?: string | null;
  }
): Promise<string> {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO refresh_tokens (
      user_id, token_hash, expires_at, replaced_by_token_id, session_id, session_binding_hash, device_label
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId,
      tokenHash,
      expiresAt,
      options.replacedByTokenId ?? null,
      options.sessionId,
      options.sessionBindingHash,
      options.deviceLabel ?? null
    ]
  );
  return result.rows[0].id;
}

export async function revokeRefreshToken(client: MaybeClient, tokenHash: string, replacedByTokenId: string | null) {
  await q(
    client,
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), replaced_by_token_id = $2
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash, replacedByTokenId]
  );
}

export async function findActiveRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
  const result = await db.query<RefreshTokenRecord>(
    `SELECT id, user_id, session_id, session_binding_hash, device_label, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function revokeAllRefreshTokensForUser(client: MaybeClient, userId: string) {
  await q(
    client,
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function revokeRefreshTokensForSession(client: MaybeClient, userId: string, sessionId: string) {
  await q(
    client,
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND session_id = $2 AND revoked_at IS NULL`,
    [userId, sessionId]
  );
}

export async function invalidatePasswordResetTokensForUser(client: MaybeClient, userId: string) {
  await q(
    client,
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
}

export async function insertPasswordResetToken(client: MaybeClient, userId: string, tokenHash: string, expiresAt: Date) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0].id;
}

export async function findActivePasswordResetToken(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
  const result = await db.query<PasswordResetTokenRecord>(
    `SELECT id, user_id, token_hash, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function consumePasswordResetToken(client: MaybeClient, tokenHash: string) {
  await q(
    client,
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1 AND used_at IS NULL`,
    [tokenHash]
  );
}

export async function invalidateEmailVerificationTokensForUser(client: MaybeClient, userId: string) {
  await q(
    client,
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
}

export async function insertEmailVerificationToken(client: MaybeClient, userId: string, tokenHash: string, expiresAt: Date) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0].id;
}

export async function findActiveEmailVerificationToken(tokenHash: string): Promise<EmailVerificationTokenRecord | null> {
  const result = await db.query<EmailVerificationTokenRecord>(
    `SELECT id, user_id, token_hash, expires_at, used_at
     FROM email_verification_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function consumeEmailVerificationToken(client: MaybeClient, tokenHash: string) {
  await q(
    client,
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE token_hash = $1 AND used_at IS NULL`,
    [tokenHash]
  );
}

export async function markUserEmailVerified(client: MaybeClient, userId: string) {
  await q(
    client,
    `UPDATE users
     SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
}

export async function getTotpSecret(userId: string): Promise<{ secret: string; enabled: boolean } | null> {
  const result = await db.query<{ secret: string; enabled: boolean }>(
    `SELECT secret, enabled FROM totp_credentials WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function upsertTotpSecret(client: MaybeClient, userId: string, secret: string, enabled: boolean) {
  await q(
    client,
    `INSERT INTO totp_credentials (user_id, secret, enabled, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET secret = EXCLUDED.secret, enabled = EXCLUDED.enabled, updated_at = NOW()`,
    [userId, secret, enabled]
  );
}

export async function enableTotp(client: MaybeClient, userId: string) {
  await q(client, `UPDATE totp_credentials SET enabled = TRUE, updated_at = NOW() WHERE user_id = $1`, [userId]);
}

export async function updateUserPassword(client: MaybeClient, userId: string, passwordHash: string) {
  await q(
    client,
    `UPDATE users
     SET password_hash = $2, must_rotate_password = FALSE, updated_at = NOW()
     WHERE id = $1`,
    [userId, passwordHash]
  );
}

export async function getUserTotpStatus(userId: string): Promise<boolean> {
  const credential = await getTotpSecret(userId);
  return Boolean(credential?.enabled);
}

export async function createAuditLog(
  client: MaybeClient,
  actorUserId: string | null,
  schoolId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
  targetType?: string,
  targetId?: string
) {
  await q(
    client,
    `INSERT INTO audit_logs (actor_user_id, school_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [actorUserId, schoolId, action, targetType ?? null, targetId ?? null, JSON.stringify(metadata)]
  );
}

export async function getActiveSubscription(userId: string) {
  const result = await db.query<{
    id: string;
    user_id: string;
    plan_id: string;
    plan_code: BillingPlanCode;
    plan_name: string;
    billing_cycle: 'weekly' | 'monthly' | 'annual';
    price_ksh_cents: string;
    period_start: Date;
    period_end: Date;
    status: string;
  }>(
    `SELECT s.id, s.user_id, s.plan_id, p.code AS plan_code, p.name AS plan_name, s.billing_cycle, s.price_ksh_cents, s.period_start, s.period_end, s.status
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE user_id = $1
       AND status = 'active'
       AND NOW() BETWEEN period_start AND period_end
     ORDER BY period_end DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function listSubscriptionPlans(codes?: BillingPlanCode[]) {
  const values: unknown[] = [];
  const whereClauses: string[] = ['is_hidden = FALSE'];

  if (codes && codes.length > 0) {
    values.push(codes);
    whereClauses.push(`code = ANY($${values.length})`);
  }

  const result = await db.query<SubscriptionPlanRecord>(
    `SELECT id, code, name, billing_cycle, price_ksh_cents, is_pro, is_hidden
     FROM subscription_plans
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY CASE code
       WHEN 'weekly' THEN 1
       WHEN 'monthly' THEN 2
       WHEN 'annual' THEN 3
       WHEN 'admin_weekly' THEN 4
       WHEN 'trial_monthly_1bob' THEN 5
       ELSE 99
     END`,
    values
  );

  return result.rows;
}

export async function findSubscriptionPlanByCode(code: BillingPlanCode) {
  const result = await db.query<SubscriptionPlanRecord>(
    `SELECT id, code, name, billing_cycle, price_ksh_cents, is_pro, is_hidden
     FROM subscription_plans
     WHERE code = $1`,
    [code]
  );

  return result.rows[0] ?? null;
}

export async function getBillingProfile(userId: string) {
  const result = await db.query<BillingProfileRecord>(
    `SELECT user_id, mpesa_phone_number, updated_at
     FROM user_billing_profiles
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

function mapSchoolRows(
  schools: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    location: string;
    principal: string | null;
    phone: string | null;
    email: string | null;
    assigned_plan_id: string;
    assigned_plan_code: BillingPlanCode;
    assigned_plan_name: string;
    assigned_billing_cycle: 'weekly' | 'monthly' | 'annual';
    assigned_plan_price_ksh_cents: string;
    discount_id: string | null;
    discount_name: string | null;
    discount_type: 'percentage' | 'fixed_ksh' | null;
    discount_amount: number | null;
    total_students: number;
  }>,
  gradeRows: Array<{ school_id: string; grade_level: string | null; total: string }>
): SchoolRecord[] {
  const gradeCountsBySchool = new Map<string, Record<string, number>>();

  gradeRows.forEach(row => {
    const gradeKey = row.grade_level || 'Unassigned';
    const current = gradeCountsBySchool.get(row.school_id) ?? {};
    current[gradeKey] = Number(row.total);
    gradeCountsBySchool.set(row.school_id, current);
  });

  return schools.map(school => ({
    ...school,
    grade_counts: gradeCountsBySchool.get(school.id) ?? {}
  }));
}

export async function listSchools() {
  const [schoolsResult, gradeResult] = await Promise.all([
    db.query<{
      id: string;
      name: string;
      slug: string;
      status: string;
      location: string;
      principal: string | null;
      phone: string | null;
      email: string | null;
      assigned_plan_id: string;
      assigned_plan_code: BillingPlanCode;
      assigned_plan_name: string;
      assigned_billing_cycle: 'weekly' | 'monthly' | 'annual';
      assigned_plan_price_ksh_cents: string;
      discount_id: string | null;
      discount_name: string | null;
      discount_type: 'percentage' | 'fixed_ksh' | null;
      discount_amount: number | null;
      total_students: number;
    }>(
      `SELECT
         s.id,
         s.name,
         s.slug,
         s.status,
         s.location,
         s.principal,
         s.phone,
         s.email,
         ap.id AS assigned_plan_id,
         ap.code AS assigned_plan_code,
         ap.name AS assigned_plan_name,
         ap.billing_cycle AS assigned_billing_cycle,
         ap.price_ksh_cents AS assigned_plan_price_ksh_cents,
         d.id AS discount_id,
         d.name AS discount_name,
         d.type AS discount_type,
         d.amount AS discount_amount,
         COUNT(DISTINCT CASE WHEN ur.role = 'student' THEN u.id END)::int AS total_students
       FROM schools s
       JOIN subscription_plans ap ON ap.id = s.assigned_plan_id
       LEFT JOIN school_discounts d ON d.id = s.discount_id
       LEFT JOIN users u ON u.school_id = s.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'student'
       GROUP BY
         s.id,
         ap.id,
         d.id
       ORDER BY s.name ASC`
    ),
    db.query<{ school_id: string; grade_level: string | null; total: string }>(
      `SELECT u.school_id, u.grade_level, COUNT(*)::bigint AS total
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'student'
       WHERE u.school_id IS NOT NULL
       GROUP BY u.school_id, u.grade_level`
    )
  ]);

  return mapSchoolRows(schoolsResult.rows, gradeResult.rows);
}

export async function findSchoolById(schoolId: string) {
  const schools = await listSchools();
  return schools.find(school => school.id === schoolId) ?? null;
}

export async function findSchoolPricingForUser(userId: string) {
  const result = await db.query<{
    id: string;
    name: string;
    slug: string;
    status: string;
    location: string;
    principal: string | null;
    phone: string | null;
    email: string | null;
    assigned_plan_id: string;
    assigned_plan_code: BillingPlanCode;
    assigned_plan_name: string;
    assigned_billing_cycle: 'weekly' | 'monthly' | 'annual';
    assigned_plan_price_ksh_cents: string;
    discount_id: string | null;
    discount_name: string | null;
    discount_type: 'percentage' | 'fixed_ksh' | null;
    discount_amount: number | null;
  }>(
    `SELECT
       s.id,
       s.name,
       s.slug,
       s.status,
       s.location,
       s.principal,
       s.phone,
       s.email,
       ap.id AS assigned_plan_id,
       ap.code AS assigned_plan_code,
       ap.name AS assigned_plan_name,
       ap.billing_cycle AS assigned_billing_cycle,
       ap.price_ksh_cents AS assigned_plan_price_ksh_cents,
       d.id AS discount_id,
       d.name AS discount_name,
       d.type AS discount_type,
       d.amount AS discount_amount
     FROM users u
     JOIN schools s ON s.id = u.school_id
     JOIN subscription_plans ap ON ap.id = s.assigned_plan_id
     LEFT JOIN school_discounts d ON d.id = s.discount_id
     WHERE u.id = $1`,
    [userId]
  );

  const school = result.rows[0];
  if (!school) {
    return null;
  }

  return {
    ...school,
    total_students: 0,
    grade_counts: {}
  } satisfies SchoolRecord;
}

export async function createSchool(
  client: MaybeClient,
  input: {
    name: string;
    slug: string;
    location: string;
    principal?: string | null;
    phone?: string | null;
    email?: string | null;
    assignedPlanId: string;
    discountId?: string | null;
  }
) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO schools (name, slug, location, principal, phone, email, assigned_plan_id, discount_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.name,
      input.slug,
      input.location,
      input.principal ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.assignedPlanId,
      input.discountId ?? null
    ]
  );

  return result.rows[0].id;
}

export async function updateSchool(
  client: MaybeClient,
  schoolId: string,
  input: {
    name: string;
    slug: string;
    location: string;
    principal?: string | null;
    phone?: string | null;
    email?: string | null;
    assignedPlanId: string;
    discountId?: string | null;
    status?: string;
  }
) {
  await q(
    client,
    `UPDATE schools
     SET name = $2,
         slug = $3,
         location = $4,
         principal = $5,
         phone = $6,
         email = $7,
         assigned_plan_id = $8,
         discount_id = $9,
         status = COALESCE($10, status)
     WHERE id = $1`,
    [
      schoolId,
      input.name,
      input.slug,
      input.location,
      input.principal ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.assignedPlanId,
      input.discountId ?? null,
      input.status ?? null
    ]
  );
}

export async function deleteSchool(client: MaybeClient, schoolId: string) {
  await q(client, `DELETE FROM schools WHERE id = $1`, [schoolId]);
}

export async function listSchoolDiscounts() {
  const result = await db.query<SchoolDiscountRecord>(
    `SELECT id, name, type, amount, is_active, created_at, updated_at
     FROM school_discounts
     ORDER BY is_active DESC, name ASC`
  );

  return result.rows;
}

export async function createSchoolDiscount(
  client: MaybeClient,
  input: { name: string; type: 'percentage' | 'fixed_ksh'; amount: number; isActive?: boolean }
) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO school_discounts (name, type, amount, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.name, input.type, input.amount, input.isActive ?? true]
  );

  return result.rows[0].id;
}

export async function updateSchoolDiscount(
  client: MaybeClient,
  discountId: string,
  input: { name: string; type: 'percentage' | 'fixed_ksh'; amount: number; isActive: boolean }
) {
  await q(
    client,
    `UPDATE school_discounts
     SET name = $2,
         type = $3,
         amount = $4,
         is_active = $5,
         updated_at = NOW()
     WHERE id = $1`,
    [discountId, input.name, input.type, input.amount, input.isActive]
  );
}

export async function deleteSchoolDiscount(client: MaybeClient, discountId: string) {
  await q(client, `UPDATE schools SET discount_id = NULL WHERE discount_id = $1`, [discountId]);
  await q(client, `DELETE FROM school_discounts WHERE id = $1`, [discountId]);
}

export async function listBannerAnnouncements() {
  const result = await db.query<BannerAnnouncementRecord>(
    `SELECT id, title, message, cta_label, cta_target, starts_at, ends_at, is_active, created_at, updated_at
     FROM banner_announcements
     ORDER BY starts_at DESC, created_at DESC`
  );

  return result.rows;
}

export async function getActiveBannerAnnouncement() {
  const result = await db.query<BannerAnnouncementRecord>(
    `SELECT id, title, message, cta_label, cta_target, starts_at, ends_at, is_active, created_at, updated_at
     FROM banner_announcements
     WHERE is_active = TRUE
       AND starts_at <= NOW()
       AND (ends_at IS NULL OR ends_at >= NOW())
     ORDER BY starts_at DESC, created_at DESC
     LIMIT 1`
  );

  return result.rows[0] ?? null;
}

export async function createBannerAnnouncement(
  client: MaybeClient,
  input: {
    title: string;
    message: string;
    ctaLabel?: string | null;
    ctaTarget: string;
    startsAt?: Date;
    endsAt?: Date | null;
    isActive?: boolean;
  }
) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO banner_announcements (title, message, cta_label, cta_target, starts_at, ends_at, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.title,
      input.message,
      input.ctaLabel ?? null,
      input.ctaTarget,
      input.startsAt ?? new Date(),
      input.endsAt ?? null,
      input.isActive ?? true
    ]
  );

  return result.rows[0].id;
}

export async function updateBannerAnnouncement(
  client: MaybeClient,
  announcementId: string,
  input: {
    title: string;
    message: string;
    ctaLabel?: string | null;
    ctaTarget: string;
    startsAt: Date;
    endsAt?: Date | null;
    isActive: boolean;
  }
) {
  await q(
    client,
    `UPDATE banner_announcements
     SET title = $2,
         message = $3,
         cta_label = $4,
         cta_target = $5,
         starts_at = $6,
         ends_at = $7,
         is_active = $8,
         updated_at = NOW()
     WHERE id = $1`,
    [
      announcementId,
      input.title,
      input.message,
      input.ctaLabel ?? null,
      input.ctaTarget,
      input.startsAt,
      input.endsAt ?? null,
      input.isActive
    ]
  );
}

export async function deleteBannerAnnouncement(client: MaybeClient, announcementId: string) {
  await q(client, `DELETE FROM banner_announcements WHERE id = $1`, [announcementId]);
}

export async function updateUserOnboarding(
  client: MaybeClient,
  input: {
    userId: string;
    schoolId: string;
    gender: 'male' | 'female' | 'not_specified';
    grade: string;
    mpesaPhoneNumber?: string | null;
  }
) {
  await q(
    client,
    `UPDATE users
     SET school_id = $2,
         gender = $3,
         grade_level = $4,
         onboarding_completed = TRUE
     WHERE id = $1`,
    [input.userId, input.schoolId, input.gender, input.grade]
  );

  if (input.mpesaPhoneNumber) {
    await upsertBillingProfile(client, input.userId, input.mpesaPhoneNumber);
  }
}

export async function hasSuccessfulPayments(userId: string) {
  const result = await db.query<{ total: string }>(
    `SELECT COUNT(*)::bigint AS total
     FROM payment_requests
     WHERE user_id = $1
       AND status = 'paid'`,
    [userId]
  );

  return Number(result.rows[0]?.total ?? 0) > 0;
}

export async function upsertBillingProfile(client: MaybeClient, userId: string, mpesaPhoneNumber: string) {
  await q(
    client,
    `INSERT INTO user_billing_profiles (user_id, mpesa_phone_number, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET mpesa_phone_number = EXCLUDED.mpesa_phone_number, updated_at = NOW()`,
    [userId, mpesaPhoneNumber]
  );
}

export async function createPaymentRequest(
  client: MaybeClient,
  input: {
    userId: string;
    planId: string;
    planCode: BillingPlanCode;
    amountKshCents: number;
    phoneNumber: string;
    returnTo: string;
    expiresAt: Date;
  }
) {
  const result = await q<{ id: string }>(
    client,
    `INSERT INTO payment_requests (
      user_id, plan_id, plan_code, amount_ksh_cents, phone_number, return_to, status, expires_at
     ) VALUES (
      $1, $2, $3, $4, $5, $6, 'pending', $7
     )
     RETURNING id`,
    [
      input.userId,
      input.planId,
      input.planCode,
      input.amountKshCents,
      input.phoneNumber,
      input.returnTo,
      input.expiresAt
    ]
  );

  return result.rows[0].id;
}

export async function markPaymentRequestInitiated(
  client: MaybeClient,
  paymentRequestId: string,
  merchantRequestId: string,
  checkoutRequestId: string
) {
  await q(
    client,
    `UPDATE payment_requests
     SET status = 'initiated',
         merchant_request_id = $2,
         checkout_request_id = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [paymentRequestId, merchantRequestId, checkoutRequestId]
  );
}

export async function findPaymentRequestByIdForUser(paymentRequestId: string, userId: string) {
  const result = await db.query<PaymentRequestRecord>(
    `SELECT id, user_id, plan_id, plan_code, status, amount_ksh_cents, phone_number, return_to,
            merchant_request_id, checkout_request_id, mpesa_receipt_number, result_code, result_desc,
            expires_at, completed_at, created_at
     FROM payment_requests
     WHERE id = $1 AND user_id = $2`,
    [paymentRequestId, userId]
  );

  return result.rows[0] ?? null;
}

export async function findPaymentRequestByCheckoutRequestId(checkoutRequestId: string) {
  const result = await db.query<PaymentRequestRecord>(
    `SELECT id, user_id, plan_id, plan_code, status, amount_ksh_cents, phone_number, return_to,
            merchant_request_id, checkout_request_id, mpesa_receipt_number, result_code, result_desc,
            expires_at, completed_at, created_at
     FROM payment_requests
     WHERE checkout_request_id = $1`,
    [checkoutRequestId]
  );

  return result.rows[0] ?? null;
}

export async function markPaymentRequestSuccessful(
  client: MaybeClient,
  paymentRequestId: string,
  input: {
    receiptNumber: string | null;
    resultCode: number;
    resultDesc: string;
    rawCallback: Record<string, unknown>;
  }
) {
  await q(
    client,
    `UPDATE payment_requests
     SET status = 'paid',
         mpesa_receipt_number = $2,
         result_code = $3,
         result_desc = $4,
         raw_callback = $5::jsonb,
         completed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [paymentRequestId, input.receiptNumber, input.resultCode, input.resultDesc, JSON.stringify(input.rawCallback)]
  );
}

export async function markPaymentRequestFailed(
  client: MaybeClient,
  paymentRequestId: string,
  input: {
    status: 'failed' | 'cancelled' | 'expired';
    resultCode: number | null;
    resultDesc: string;
    rawCallback: Record<string, unknown>;
  }
) {
  await q(
    client,
    `UPDATE payment_requests
     SET status = $2,
         result_code = $3,
         result_desc = $4,
         raw_callback = $5::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [paymentRequestId, input.status, input.resultCode, input.resultDesc, JSON.stringify(input.rawCallback)]
  );
}

export async function expirePendingPaymentRequests(client: MaybeClient) {
  await q(
    client,
    `UPDATE payment_requests
     SET status = 'expired',
         updated_at = NOW()
     WHERE status IN ('pending', 'initiated')
       AND expires_at < NOW()`,
    []
  );
}

export async function replaceActiveSubscription(
  client: MaybeClient,
  input: {
    userId: string;
    planId: string;
    billingCycle: 'weekly' | 'monthly' | 'annual';
    priceKshCents: number;
    periodStart: Date;
    periodEnd: Date;
  }
) {
  await q(
    client,
    `UPDATE subscriptions
     SET status = 'replaced'
     WHERE user_id = $1 AND status = 'active'`,
    [input.userId]
  );

  const result = await q<{ id: string }>(
    client,
    `INSERT INTO subscriptions (user_id, plan_id, billing_cycle, price_ksh_cents, period_start, period_end, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING id`,
    [
      input.userId,
      input.planId,
      input.billingCycle,
      input.priceKshCents,
      input.periodStart,
      input.periodEnd
    ]
  );

  return result.rows[0].id;
}

export async function getSubscriptionAiSpendKshCents(subscriptionId: string): Promise<number> {
  const result = await db.query<{ total_spend: string }>(
    `SELECT COALESCE(SUM(estimated_cost_ksh_cents), 0)::bigint AS total_spend
     FROM ai_usage_events
     WHERE subscription_id = $1 AND status IN ('allowed', 'completed')`,
    [subscriptionId]
  );
  return Number(result.rows[0]?.total_spend ?? 0);
}

export async function createAiUsageEvent(
  client: MaybeClient,
  payload: {
    userId: string;
    schoolId: string | null;
    subscriptionId: string | null;
    feature: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsdMicros: number;
    fxRateKshPerUsd: number;
    estimatedCostKshCents: number;
    status: 'allowed' | 'blocked' | 'failed' | 'completed';
  }
) {
  await q(
    client,
    `INSERT INTO ai_usage_events (
      user_id, school_id, subscription_id, feature, provider, model,
      prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd_micros,
      fx_rate_ksh_per_usd, estimated_cost_ksh_cents, status
     ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13
     )`,
    [
      payload.userId,
      payload.schoolId,
      payload.subscriptionId,
      payload.feature,
      payload.provider,
      payload.model,
      payload.promptTokens,
      payload.completionTokens,
      payload.totalTokens,
      payload.estimatedCostUsdMicros,
      payload.fxRateKshPerUsd,
      payload.estimatedCostKshCents,
      payload.status
    ]
  );
}

export async function getAdminAiAnalytics(user: AuthenticatedUser) {
  const schoolScoped = !user.roles.includes('platform_admin');
  const scopedParams: unknown[] = schoolScoped ? [user.schoolId] : [];
  const scopedWhere = schoolScoped ? 'WHERE school_id = $1' : '';

  const topUsers = await db.query(
    `SELECT u.id, u.full_name, u.email, COALESCE(SUM(a.estimated_cost_ksh_cents), 0)::bigint AS spend_ksh_cents
     FROM ai_usage_events a
     JOIN users u ON u.id = a.user_id
     ${scopedWhere}
     GROUP BY u.id, u.full_name, u.email
     ORDER BY spend_ksh_cents DESC
     LIMIT 10`,
    scopedParams
  );

  const topFeatures = await db.query(
    `SELECT feature, COALESCE(SUM(estimated_cost_ksh_cents), 0)::bigint AS spend_ksh_cents
     FROM ai_usage_events
     ${scopedWhere}
     GROUP BY feature
     ORDER BY spend_ksh_cents DESC
     LIMIT 10`,
    scopedParams
  );

  const blockedEvents = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM ai_usage_events
     ${schoolScoped ? "WHERE school_id = $1 AND status = 'blocked'" : "WHERE status = 'blocked'"}`,
    scopedParams
  );

  const costBySchool = await db.query(
    `SELECT s.id, s.name, COALESCE(SUM(a.estimated_cost_ksh_cents), 0)::bigint AS spend_ksh_cents
     FROM schools s
     LEFT JOIN ai_usage_events a ON a.school_id = s.id
     GROUP BY s.id, s.name
     ORDER BY spend_ksh_cents DESC`
  );

  const marginByUser = await db.query(
    `SELECT
       u.id,
       u.full_name,
       COALESCE(SUM(a.estimated_cost_ksh_cents), 0)::bigint AS spend_ksh_cents,
       COALESCE(MAX(su.price_ksh_cents), 0)::bigint AS subscription_price_ksh_cents
     FROM users u
     LEFT JOIN ai_usage_events a ON a.user_id = u.id
     LEFT JOIN subscriptions su ON su.user_id = u.id AND su.status = 'active' AND NOW() BETWEEN su.period_start AND su.period_end
     ${schoolScoped ? 'WHERE u.school_id = $1' : ''}
     GROUP BY u.id, u.full_name
     ORDER BY spend_ksh_cents DESC
     LIMIT 20`,
    scopedParams
  );

  return {
    topUsers: topUsers.rows,
    topFeatures: topFeatures.rows,
    blockedEvents: Number(blockedEvents.rows[0]?.total ?? 0),
    costBySchool: schoolScoped ? costBySchool.rows.filter(row => row.id === user.schoolId) : costBySchool.rows,
    marginByUser: marginByUser.rows
  };
}

export async function getBillingAnalytics(user: AuthenticatedUser) {
  const schoolScoped = !user.roles.includes('platform_admin');
  const scopedParams: unknown[] = schoolScoped ? [user.schoolId] : [];
  const userScopeClause = schoolScoped ? 'WHERE u.school_id = $1' : '';

  const activeSubscriptions = await db.query<{ total: string }>(
    `SELECT COUNT(*)::bigint AS total
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ${userScopeClause}${schoolScoped ? " AND" : " WHERE"} s.status = 'active'
       AND NOW() BETWEEN s.period_start AND s.period_end`,
    scopedParams
  );

  const recentPayments = await db.query(
    `SELECT pr.id, pr.plan_code, pr.status, pr.amount_ksh_cents, pr.result_desc, pr.created_at, u.email
     FROM payment_requests pr
     JOIN users u ON u.id = pr.user_id
     ${userScopeClause}
     ORDER BY pr.created_at DESC
     LIMIT 15`,
    scopedParams
  );

  const revenueByPlan = await db.query(
    `SELECT pr.plan_code, COUNT(*)::int AS total_payments, COALESCE(SUM(pr.amount_ksh_cents), 0)::bigint AS revenue_ksh_cents
     FROM payment_requests pr
     JOIN users u ON u.id = pr.user_id
     ${userScopeClause}${schoolScoped ? " AND" : " WHERE"} pr.status = 'paid'
     GROUP BY pr.plan_code
     ORDER BY revenue_ksh_cents DESC`,
    scopedParams
  );

  const failedPayments = await db.query<{ total: string }>(
    `SELECT COUNT(*)::bigint AS total
     FROM payment_requests pr
     JOIN users u ON u.id = pr.user_id
     ${userScopeClause}${schoolScoped ? " AND" : " WHERE"} pr.status IN ('failed', 'cancelled', 'expired')`,
    scopedParams
  );

  return {
    activeSubscriptions: Number(activeSubscriptions.rows[0]?.total ?? 0),
    failedPayments: Number(failedPayments.rows[0]?.total ?? 0),
    recentPayments: recentPayments.rows,
    revenueByPlan: revenueByPlan.rows
  };
}

function normalizeCurriculumItems(
  items: Array<{ id?: string; text: string }> | null | undefined,
  prefix: string
) {
  return (items ?? [])
    .map((item, index) => ({
      id: item.id ?? `${prefix}-${index + 1}`,
      text: item.text
    }))
    .filter(item => item.text.trim().length > 0);
}

function buildCurriculumSubjectBundles(args: {
  strands: CurriculumStrandRecord[];
  subStrands: CurriculumSubStrandRecord[];
  completedSubStrandIds: Set<string>;
}) {
  const subStrandsByStrand = new Map<string, CurriculumSubStrandRecord[]>();
  for (const subStrand of args.subStrands) {
    const bucket = subStrandsByStrand.get(subStrand.strand_id) ?? [];
    bucket.push(subStrand);
    subStrandsByStrand.set(subStrand.strand_id, bucket);
  }

  const subjectBundles = new Map<string, CurriculumSubjectBundle>();

  for (const strand of args.strands) {
    const subjectKey = `${strand.grade_level}:${strand.subject_id}`;
    const existingSubject = subjectBundles.get(subjectKey) ?? {
      subjectId: strand.subject_id,
      subjectName: strand.subject_name,
      strands: []
    };

    const strandSubStrands = (subStrandsByStrand.get(strand.id) ?? [])
      .sort((left, right) => left.position - right.position)
      .map((subStrand, index, ordered) => {
        const previous = ordered[index - 1];
        const isCompleted = args.completedSubStrandIds.has(subStrand.id);
        const isLocked =
          index > 0 && previous ? !args.completedSubStrandIds.has(previous.id) : false;

        return {
          id: subStrand.id,
          title: subStrand.title,
          type: subStrand.type,
          description: subStrand.description ?? undefined,
          pages: subStrand.pages ?? [],
          isLocked,
          isCompleted,
          number: subStrand.number ?? undefined,
          outcomes: normalizeCurriculumItems(
            subStrand.outcomes,
            `${subStrand.id}-outcome`
          ),
          inquiryQuestions: normalizeCurriculumItems(
            subStrand.inquiry_questions,
            `${subStrand.id}-question`
          )
        };
      });

    existingSubject.strands.push({
      id: strand.id,
      title: strand.title,
      subTitle: strand.sub_title,
      number: strand.number ?? undefined,
      subStrands: strandSubStrands
    });

    subjectBundles.set(subjectKey, existingSubject);
  }

  return Array.from(subjectBundles.values()).map(subject => ({
    ...subject,
    strands: subject.strands.sort((left, right) => {
      const leftStrand = args.strands.find(strand => strand.id === left.id);
      const rightStrand = args.strands.find(strand => strand.id === right.id);
      return (leftStrand?.position ?? 0) - (rightStrand?.position ?? 0);
    })
  }));
}

export async function replaceCurriculumSubject(
  client: MaybeClient,
  input: {
    actorUserId: string | null;
    grade: string;
    subjectId: string;
    subjectName: string;
    strands: CurriculumStrandInput[];
  }
) {
  await q(
    client,
    `DELETE FROM curriculum_strands
     WHERE grade_level = $1 AND subject_id = $2`,
    [input.grade, input.subjectId]
  );

  for (const [strandIndex, strand] of input.strands.entries()) {
    const strandResult = await q<{ id: string }>(
      client,
      `INSERT INTO curriculum_strands (
        grade_level, subject_id, subject_name, number, title, sub_title, position, created_by_user_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        input.grade,
        input.subjectId,
        input.subjectName,
        strand.number ?? null,
        strand.title,
        strand.subTitle ?? '',
        strandIndex,
        input.actorUserId
      ]
    );

    const strandId = strandResult.rows[0].id;
    for (const [subIndex, subStrand] of strand.subStrands.entries()) {
      await q(
        client,
        `INSERT INTO curriculum_sub_strands (
          strand_id, number, title, type, description, position, outcomes, inquiry_questions, pages, lesson_generated_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, NOW())`,
        [
          strandId,
          subStrand.number ?? null,
          subStrand.title,
          subStrand.type,
          subStrand.description ?? null,
          subIndex,
          JSON.stringify(subStrand.outcomes ?? []),
          JSON.stringify(subStrand.inquiryQuestions ?? []),
          JSON.stringify(subStrand.pages ?? []),
          subStrand.pages && subStrand.pages.length > 0 ? new Date() : null
        ]
      );
    }
  }
}

export async function listCurriculumForGrade(
  grade: string,
  userId?: string | null
): Promise<CurriculumSubjectBundle[]> {
  const strandsResult = await db.query<CurriculumStrandRecord>(
    `SELECT id, grade_level, subject_id, subject_name, number, title, sub_title, position
     FROM curriculum_strands
     WHERE grade_level = $1
     ORDER BY subject_name ASC, position ASC`,
    [grade]
  );

  if (strandsResult.rows.length === 0) {
    return [];
  }

  const strandIds = strandsResult.rows.map(strand => strand.id);
  const subStrandsResult = await db.query<CurriculumSubStrandRecord>(
    `SELECT id, strand_id, number, title, type, description, position, outcomes, inquiry_questions, pages, lesson_generated_at
     FROM curriculum_sub_strands
     WHERE strand_id = ANY($1::uuid[])
     ORDER BY position ASC`,
    [strandIds]
  );

  let completedSubStrandIds = new Set<string>();
  if (userId) {
    const progressResult = await db.query<{ sub_strand_id: string }>(
      `SELECT sub_strand_id
       FROM user_curriculum_progress
       WHERE user_id = $1`,
      [userId]
    );
    completedSubStrandIds = new Set(progressResult.rows.map(row => row.sub_strand_id));
  }

  return buildCurriculumSubjectBundles({
    strands: strandsResult.rows,
    subStrands: subStrandsResult.rows,
    completedSubStrandIds
  });
}

export async function findCurriculumSubStrandContext(subStrandId: string) {
  const result = await db.query<{
    sub_strand_id: string;
    sub_strand_title: string;
    sub_strand_type: 'knowledge' | 'skill' | 'competence';
    sub_strand_description: string | null;
    sub_strand_number: string | null;
    outcomes: Array<{ id?: string; text: string }>;
    inquiry_questions: Array<{ id?: string; text: string }>;
    pages: Array<{ title: string; content: string }>;
    lesson_generated_at: Date | null;
    strand_id: string;
    strand_title: string;
    strand_number: string | null;
    grade_level: string;
    subject_id: string;
    subject_name: string;
  }>(
    `SELECT
       css.id AS sub_strand_id,
       css.title AS sub_strand_title,
       css.type AS sub_strand_type,
       css.description AS sub_strand_description,
       css.number AS sub_strand_number,
       css.outcomes,
       css.inquiry_questions,
       css.pages,
       css.lesson_generated_at,
       cs.id AS strand_id,
       cs.title AS strand_title,
       cs.number AS strand_number,
       cs.grade_level,
       cs.subject_id,
       cs.subject_name
     FROM curriculum_sub_strands css
     JOIN curriculum_strands cs ON cs.id = css.strand_id
     WHERE css.id = $1`,
    [subStrandId]
  );

  return result.rows[0] ?? null;
}

export async function saveCurriculumSubStrandPages(
  client: MaybeClient,
  subStrandId: string,
  pages: Array<{ title: string; content: string }>
) {
  await q(
    client,
    `UPDATE curriculum_sub_strands
     SET pages = $2::jsonb,
         lesson_generated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [subStrandId, JSON.stringify(pages)]
  );
}

export async function markCurriculumSubStrandCompleted(
  client: MaybeClient,
  userId: string,
  subStrandId: string,
  quizScore: number | null
) {
  await q(
    client,
    `INSERT INTO user_curriculum_progress (user_id, sub_strand_id, quiz_score, completed_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id, sub_strand_id)
     DO UPDATE SET quiz_score = EXCLUDED.quiz_score, updated_at = NOW()`,
    [userId, subStrandId, quizScore]
  );
}

function formatActivityLabel(value: Date | null) {
  if (!value) {
    return 'Recently';
  }

  const diffMs = Date.now() - value.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
  if (diffHours < 24) {
    return diffHours === 0 ? 'Today' : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return value.toISOString().slice(0, 10);
}

export async function listLibraryBooksForUser(user: AuthenticatedUser): Promise<LibraryBookRecord[]> {
  const result = await db.query<LibraryBookRecord>(
    `SELECT id, title, author, spine_color, text_color, height, spine_pattern
     FROM library_books
     WHERE is_active = TRUE
       AND (school_id IS NULL OR school_id = $1)
       AND ($2::text IS NULL OR grade_level IS NULL OR grade_level = $2)
     ORDER BY position ASC, title ASC`,
    [user.schoolId, user.grade ?? null]
  );

  return result.rows;
}

export async function listLearningPodcastsForUser(user: AuthenticatedUser): Promise<LearningPodcastRecord[]> {
  const result = await db.query<LearningPodcastRecord>(
    `SELECT id, title, subject, type, duration, views, published_on, author, thumbnail_url, media_url
     FROM learning_podcasts
     WHERE is_active = TRUE
       AND (school_id IS NULL OR school_id = $1)
       AND ($2::text IS NULL OR grade_level IS NULL OR grade_level = $2)
     ORDER BY position ASC, published_on DESC, title ASC`,
    [user.schoolId, user.grade ?? null]
  );

  return result.rows;
}

export async function listTeacherStudents(user: AuthenticatedUser): Promise<TeacherStudentRecord[]> {
  if (!user.schoolId) {
    return [];
  }

  const result = await db.query<{
    id: string;
    name: string;
    grade: string | null;
    assessment_score: string | null;
    homework_completion: string | null;
    last_activity: Date | null;
  }>(
    `SELECT
       u.id,
       u.full_name AS name,
       u.grade_level AS grade,
       ROUND(COALESCE(AVG(sub.score), 0), 0)::text AS assessment_score,
       ROUND(
         COALESCE(
           100.0 * COUNT(*) FILTER (WHERE sub.status = 'Completed')
           / NULLIF(COUNT(sub.id), 0),
           0
         ),
         0
       )::text AS homework_completion,
       GREATEST(MAX(sub.submitted_at), MAX(ucp.updated_at)) AS last_activity
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'student'
     LEFT JOIN submissions sub ON sub.student_id = u.id
     LEFT JOIN assignments a ON a.id = sub.assignment_id AND a.school_id = u.school_id
     LEFT JOIN user_curriculum_progress ucp ON ucp.user_id = u.id
     WHERE u.school_id = $1
     GROUP BY u.id, u.full_name, u.grade_level
     ORDER BY u.full_name ASC`,
    [user.schoolId]
  );

  return result.rows.map(row => {
    const assessmentScore = Number(row.assessment_score || 0);
    return {
      id: row.id,
      name: row.name,
      grade: row.grade || 'Unassigned',
      assessment_score: assessmentScore,
      homework_completion: Number(row.homework_completion || 0),
      last_active: formatActivityLabel(row.last_activity),
      trend: assessmentScore >= 80 ? 'Excellent' : assessmentScore >= 60 ? 'Improving' : 'Stable'
    };
  });
}

export async function listTeacherAssignments(user: AuthenticatedUser): Promise<TeacherAssignmentRecord[]> {
  if (!user.schoolId) {
    return [];
  }

  const result = await db.query<{
    id: string;
    title: string;
    subject: string;
    description: string | null;
    grade_level: string;
    due_at: Date | null;
    created_at: Date;
    questions: Array<{
      id: number;
      type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
      text: string;
      options?: string[];
      correctAnswer?: string | boolean;
      explanation?: string;
    }>;
    submitted_count: number;
    total_students: number;
    average_score: string | null;
  }>(
    `SELECT
       a.id,
       a.title,
       a.subject,
       a.description,
       a.grade_level,
       a.due_at,
       a.created_at,
       a.questions,
       COUNT(sub.id) FILTER (WHERE sub.status = 'Completed')::int AS submitted_count,
       COUNT(sub.id)::int AS total_students,
       ROUND(COALESCE(AVG(sub.score), 0), 0)::text AS average_score
     FROM assignments a
     LEFT JOIN submissions sub ON sub.assignment_id = a.id
     WHERE a.school_id = $1
       AND a.teacher_id = $2
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    [user.schoolId, user.id]
  );

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description ?? '',
    grade_level: row.grade_level,
    due_at: row.due_at,
    created_at: row.created_at,
    questions: row.questions ?? [],
    submitted_count: row.submitted_count,
    total_students: row.total_students,
    average_score: Number(row.average_score || 0)
  }));
}

export async function listAssignmentSubmissionsForTeacher(
  user: AuthenticatedUser
): Promise<SubmissionReviewRecord[]> {
  if (!user.schoolId) {
    return [];
  }

  const result = await db.query<SubmissionReviewRecord>(
    `SELECT
       a.id AS assignment_id,
       u.id AS student_id,
       u.full_name AS student_name,
       COALESCE(sub.score, 0)::int AS score,
       COALESCE(sub.status, 'Pending')::text AS status,
       sub.answers
     FROM assignments a
     JOIN submissions sub ON sub.assignment_id = a.id
     JOIN users u ON u.id = sub.student_id
     WHERE a.school_id = $1
       AND a.teacher_id = $2
     ORDER BY a.created_at DESC, u.full_name ASC`,
    [user.schoolId, user.id]
  );

  return result.rows.map(row => ({
    ...row,
    answers: row.answers ?? []
  }));
}

export async function createTeacherAssignment(
  client: MaybeClient,
  user: AuthenticatedUser,
  input: {
    title: string;
    subject: string;
    description: string;
    gradeLevel: string;
    dueAt?: Date | null;
    questions: Array<{
      id: number;
      type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
      text: string;
      options?: string[];
      correctAnswer?: string | boolean;
      explanation?: string;
    }>;
  }
) {
  if (!user.schoolId) {
    throw new Error('Teacher must belong to a school');
  }

  const assignmentResult = await q<{ id: string }>(
    client,
    `INSERT INTO assignments (
       school_id,
       class_id,
       teacher_id,
       title,
       description,
       due_at,
       grade_level,
       subject,
       questions
     )
     VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING id`,
    [
      user.schoolId,
      user.id,
      input.title,
      input.description,
      input.dueAt ?? null,
      input.gradeLevel,
      input.subject,
      JSON.stringify(input.questions)
    ]
  );

  const assignmentId = assignmentResult.rows[0].id;

  const studentRows = await q<{ id: string }>(
    client,
    `SELECT u.id
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'student'
     WHERE u.school_id = $1
       AND ($2::text IS NULL OR u.grade_level = $2)`,
    [user.schoolId, input.gradeLevel || null]
  );

  for (const student of studentRows.rows) {
    await q(
      client,
      `INSERT INTO submissions (assignment_id, student_id, status, answers)
       VALUES ($1, $2, 'Pending', '[]'::jsonb)
       ON CONFLICT DO NOTHING`,
      [assignmentId, student.id]
    );
  }

  return assignmentId;
}

export async function listStudentAssignments(user: AuthenticatedUser): Promise<StudentAssignmentRecord[]> {
  if (!user.schoolId) {
    return [];
  }

  const result = await db.query<{
    id: string;
    title: string;
    subject: string;
    description: string | null;
    grade_level: string;
    due_at: Date | null;
    questions: Array<{
      id: number;
      type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
      text: string;
      options?: string[];
      correctAnswer?: string | boolean;
      explanation?: string;
    }>;
    submission_status: string | null;
    score: string | null;
    submitted_at: Date | null;
  }>(
    `SELECT
       a.id,
       a.title,
       a.subject,
       a.description,
       a.grade_level,
       a.due_at,
       a.questions,
       sub.status AS submission_status,
       sub.score::text AS score,
       sub.submitted_at
     FROM assignments a
     LEFT JOIN submissions sub
       ON sub.assignment_id = a.id
      AND sub.student_id = $2
     WHERE a.school_id = $1
       AND ($3::text IS NULL OR a.grade_level = $3)
     ORDER BY a.created_at DESC`,
    [user.schoolId, user.id, user.grade ?? null]
  );

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description ?? '',
    grade_level: row.grade_level,
    due_at: row.due_at,
    questions: row.questions ?? [],
    status: row.submission_status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
    score: row.score ? Number(row.score) : null,
    submitted_at: row.submitted_at
  }));
}

export async function submitStudentAssignment(
  client: MaybeClient,
  user: AuthenticatedUser,
  assignmentId: string,
  input: {
    score: number;
    answers: Array<{
      questionId: number;
      question: string;
      answer: string;
      isCorrect: boolean;
    }>;
  }
) {
  const assignmentResult = await q<{
    id: string;
    due_at: Date | null;
    school_id: string;
  }>(
    client,
    `SELECT id, due_at, school_id
     FROM assignments
     WHERE id = $1`,
    [assignmentId]
  );

  const assignment = assignmentResult.rows[0];
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.school_id !== user.schoolId) {
    throw new Error('Assignment does not belong to the current school');
  }

  const status =
    assignment.due_at && assignment.due_at.getTime() < Date.now() ? 'Late' : 'Completed';

  await q(
    client,
    `INSERT INTO submissions (assignment_id, student_id, score, submitted_at, status, answers)
     VALUES ($1, $2, $3, NOW(), $4, $5::jsonb)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET
       score = EXCLUDED.score,
       submitted_at = EXCLUDED.submitted_at,
       status = EXCLUDED.status,
       answers = EXCLUDED.answers`,
    [assignmentId, user.id, input.score, status, JSON.stringify(input.answers)]
  );
}

export async function listAdminUsers(user: AuthenticatedUser): Promise<AdminUserRecord[]> {
  const schoolScoped = !user.roles.includes('platform_admin');
  const result = await db.query<{
    id: string;
    full_name: string;
    grade_level: string | null;
    school_name: string | null;
    email: string;
    email_verified: boolean;
  }>(
    `SELECT
       u.id,
       u.full_name,
       u.grade_level,
       s.name AS school_name,
       u.email,
       u.email_verified
     FROM users u
     LEFT JOIN schools s ON s.id = u.school_id
     WHERE ($1::boolean = FALSE OR u.school_id = $2)
     ORDER BY u.full_name ASC`,
    [schoolScoped, user.schoolId]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.full_name,
    grade: row.grade_level || 'N/A',
    school: row.school_name || 'No School',
    email: row.email,
    status: row.email_verified ? 'Active' : 'Offline',
    color: row.email_verified ? 'green' : 'gray'
  }));
}
