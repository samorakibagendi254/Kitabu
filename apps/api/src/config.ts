import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
loadEnv({
  path: path.resolve(currentDir, '../.env')
});

const booleanish = z.preprocess(value => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return value;
}, z.boolean());

const configSchema = z.object({
  KITABU_NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  KITABU_HOST: z.string().default('0.0.0.0'),
  KITABU_PORT: z.coerce.number().int().positive().default(4000),
  KITABU_TRUST_PROXY: booleanish.default(false),
  KITABU_ENABLE_API_DOCS: booleanish.default(false),
  KITABU_BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1024 * 1024),
  KITABU_DATABASE_URL: z.string().min(1),
  KITABU_REDIS_URL: z.string().min(1),
  KITABU_JWT_ISSUER: z.string().min(1),
  KITABU_JWT_AUDIENCE: z.string().min(1),
  KITABU_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  KITABU_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  KITABU_STEP_UP_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  KITABU_JWT_PRIVATE_KEY: z.string().min(1),
  KITABU_JWT_PUBLIC_KEY: z.string().min(1),
  KITABU_OPENAI_API_KEY: z.string().optional(),
  KITABU_OPENAI_STUDENT_MODEL: z.string().default('gpt-5-mini-2025-08-07'),
  KITABU_OPENAI_REASONING_MODEL: z.string().default('gpt-5.1'),
  KITABU_OPENAI_REASONING_EFFORT: z.enum(['minimal', 'low', 'medium', 'high']).default('medium'),
  KITABU_GEMINI_API_KEY: z.string().optional(),
  KITABU_GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  KITABU_KSH_PER_USD: z.coerce.number().positive().default(129.5),
  KITABU_ADMIN_WEB_ORIGIN: z.string().default('https://admin.kitabu.ai'),
  KITABU_NATIVE_APP_ORIGIN: z.string().default('kitabu-native-app'),
  KITABU_ADMIN_WEB_BASE_URL: z.string().default('https://admin.kitabu.ai'),
  KITABU_LANDING_WEB_BASE_URL: z.string().default('https://kitabu.ai'),
  KITABU_PASSWORD_RESET_URL: z.string().default('https://admin.kitabu.ai/reset-password'),
  KITABU_PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  KITABU_EMAIL_VERIFICATION_URL: z.string().default('https://admin.kitabu.ai/verify-email'),
  KITABU_EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(60 * 24),
  KITABU_APP_DEEP_LINK_BASE: z.string().default('kitabu://auth'),
  KITABU_ANDROID_PACKAGE_NAME: z.string().default('com.kitabunativeapp'),
  KITABU_ANDROID_SHA256_CERT_FINGERPRINTS: z.string().default(''),
  KITABU_MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  KITABU_MPESA_CONSUMER_KEY: z.string().optional(),
  KITABU_MPESA_CONSUMER_SECRET: z.string().optional(),
  KITABU_MPESA_SHORTCODE: z.string().optional(),
  KITABU_MPESA_PASSKEY: z.string().optional(),
  KITABU_MPESA_CALLBACK_URL: z.string().default('https://app.kitabu.ai/billing/mpesa/callback'),
  KITABU_MPESA_ACCOUNT_REFERENCE: z.string().default('Kitabu AI'),
  KITABU_MPESA_TRANSACTION_DESC: z.string().default('Kitabu Subscription'),
  KITABU_MPESA_STK_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(10),
  KITABU_SMTP_HOST: z.string().optional(),
  KITABU_SMTP_PORT: z.coerce.number().int().positive().default(587),
  KITABU_SMTP_SECURE: booleanish.default(false),
  KITABU_SMTP_USER: z.string().optional(),
  KITABU_SMTP_PASS: z.string().optional(),
  KITABU_MAIL_FROM: z.string().default('Kitabu AI <noreply@kitabu.ai>'),
  KITABU_ADMIN_ANALYTICS_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  KITABU_ADMIN_ANALYTICS_RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  KITABU_AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  KITABU_AI_RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  KITABU_REFRESH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  KITABU_REFRESH_RATE_LIMIT_WINDOW: z.string().default('1 minute')
});

export const appConfig = configSchema.parse(process.env);

appConfig.KITABU_JWT_PRIVATE_KEY = appConfig.KITABU_JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
appConfig.KITABU_JWT_PUBLIC_KEY = appConfig.KITABU_JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
