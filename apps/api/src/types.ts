export type AppRole = 'student' | 'teacher' | 'school_admin' | 'platform_admin' | 'parent';

export interface AuthenticatedUser {
  id: string;
  schoolId: string | null;
  sessionId: string | null;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: AppRole[];
  gender?: 'male' | 'female' | 'not_specified';
  grade?: string | null;
  onboardingCompleted?: boolean;
  stepUp: boolean;
  mustRotatePassword?: boolean;
  isBreakGlass?: boolean;
}

export interface PasswordResetTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
}

export interface EmailVerificationTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
}
