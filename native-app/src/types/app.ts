import React from 'react';

export type BaseViewState =
  | 'dashboard'
  | 'subject'
  | 'homework_list'
  | 'homework_quiz'
  | 'podcasts_view'
  | 'bookshelf_view'
  | 'reading_mode'
  | 'lets_learn_list'
  | 'lets_learn_content'
  | 'brain_tease'
  | 'take_quiz'
  | 'quiz_me_config'
  | 'game_zone'
  | 'quack_game'
  | 'crazy_balloon'
  | 'admin_portal'
  | 'teachers_portal';

export type ViewState = BaseViewState | 'live_audio';
export type AuthRole =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'platform_admin'
  | 'parent';
export type PublicSignupRole = 'student' | 'teacher';
export type GenderOption = 'male' | 'female' | 'not_specified';

export interface AuthUser {
  id: string;
  schoolId: string | null;
  sessionId?: string | null;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: AuthRole[];
  gender?: GenderOption;
  grade?: string | null;
  onboardingCompleted?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type BillingPlanCode =
  | 'weekly'
  | 'monthly'
  | 'annual'
  | 'admin_weekly'
  | 'trial_monthly_1bob';

export interface BillingPlan {
  code: BillingPlanCode;
  name: string;
  billingCycle: 'weekly' | 'monthly' | 'annual';
  priceKsh: number;
  priceKshCents: number;
  originalPriceKsh?: number | null;
  originalPriceKshCents?: number | null;
  isPopular: boolean;
  isSchoolManaged?: boolean;
  discountLabel?: string | null;
}

export interface BillingSubscription {
  id: string;
  code: BillingPlanCode;
  name: string;
  billingCycle: 'weekly' | 'monthly' | 'annual';
  priceKsh: number;
  periodStart?: string;
  periodEnd: string;
  status?: string;
}

export interface BillingStatus {
  subscription: BillingSubscription | null;
  savedMpesaPhoneNumber: string | null;
  maskedMpesaPhoneNumber: string | null;
  hasPaidBefore?: boolean;
  school?: SchoolData | null;
}

export interface BillingPlansResponse {
  plans: BillingPlan[];
  school: SchoolData | null;
  trialOffer: BillingPlan | null;
}

export interface MpesaCheckoutResponse {
  paymentRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
  expiresAt: string;
  maskedMpesaPhoneNumber: string | null;
  alreadySubscribed?: boolean;
  subscription?: {
    id: string;
    code: BillingPlanCode;
    periodEnd: string;
  };
}

export interface MpesaCheckoutStatus {
  paymentRequestId: string;
  status: 'pending' | 'initiated' | 'paid' | 'failed' | 'cancelled' | 'expired';
  returnTo: string;
  phoneNumber: string;
  maskedPhoneNumber: string | null;
  resultCode: number | null;
  resultDescription: string | null;
  receiptNumber: string | null;
  expiresAt: string;
  subscription: {
    code: BillingPlanCode;
    name: string;
    periodEnd: string;
  } | null;
}

export interface AuthState {
  mustRotatePassword: boolean;
  requiresPlatformTotp: boolean;
  isBreakGlass: boolean;
}

export interface Attachment {
  mimeType: string;
  data: string;
  name?: string;
  type: 'image' | 'file';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachment?: Attachment;
}

export interface Subject {
  id: string;
  name: string;
  colorFrom: string;
  colorTo: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string | boolean;
  explanation?: string;
  userAnswer?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  gradeLevel: string;
  dueDate: string;
  status: 'pending' | 'completed';
  questions: Question[];
  score?: number;
  submittedDate?: string;
}

export interface Podcast {
  id: string;
  title: string;
  subject: string;
  type: 'audio' | 'video';
  duration: string;
  views: string;
  date: string;
  author: string;
  thumbnail?: string;
  url: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  spineColor: string;
  textColor: string;
  height: string;
  spinePattern?: 'plain' | 'striped' | 'banded';
}

export interface UserProfile {
  name: string;
  role?: string;
  grade?: string;
  email?: string;
  gender: 'male' | 'female' | 'Not Specified';
  avatar?: string;
  school?: string;
  phone?: string;
  dateJoined?: string;
  lastSeen?: string;
  status?: string;
  points?: number;
}

export interface ContentPage {
  title: string;
  content: string;
}

export interface CurriculumItem {
  id: string;
  text: string;
}

export interface SubStrand {
  id: string;
  title: string;
  type: 'knowledge' | 'skill' | 'competence';
  description?: string;
  pages: ContentPage[];
  isLocked: boolean;
  isCompleted: boolean;
  number?: string;
  outcomes?: CurriculumItem[];
  inquiryQuestions?: CurriculumItem[];
}

export interface LearningStrand {
  id: string;
  title: string;
  subTitle: string;
  subStrands: SubStrand[];
  number?: string;
}

export interface CurriculumSubjectBundle {
  subjectId: string;
  subjectName: string;
  strands: LearningStrand[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface QuizConfig {
  subject: string;
  strand: string;
  subStrand: string;
  questionCount: number;
  format: 'flashcards' | 'quiz' | 'audio';
}

export interface StudentPerformance {
  id: string;
  name: string;
  grade: string;
  assessmentScore: number;
  homeworkCompletion: number;
  lastActive: string;
  trend: 'Improving' | 'Stable' | 'Excellent';
  avatar?: string;
}

export interface SubmittedAssignment extends Assignment {
  submittedCount: number;
  totalStudents: number;
  averageScore: number;
  dateSent: string;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  avatar?: string;
  score: number;
  status: 'Completed' | 'Late' | 'Pending';
  answers: {
    questionId: number;
    question: string;
    answer: string;
    isCorrect: boolean;
  }[];
}

export interface AdminPortalUser {
  id: string;
  name: string;
  grade: string;
  school: string;
  email: string;
  status: 'Online' | 'Offline' | 'Active';
  color: 'green' | 'gray';
}

export interface SchoolData {
  id: string;
  name: string;
  status?: string;
  location: string;
  totalStudents: number;
  email?: string;
  phone?: string;
  principal?: string;
  gradeCounts: Record<string, number>;
  pricing?: {
    assignedPlanCode: BillingPlanCode;
    assignedPlanName: string;
    billingCycle: 'weekly' | 'monthly' | 'annual';
    basePriceKsh: number;
    basePriceKshCents: number;
    effectivePriceKsh: number;
    effectivePriceKshCents: number;
    discount: SchoolDiscount | null;
  };
}

export interface SchoolDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_ksh';
  amount: number;
  isActive: boolean;
}

export interface BannerAnnouncement {
  id: string;
  title: string;
  message: string;
  ctaLabel?: string | null;
  ctaTarget: 'ask_tutor' | 'manage_subscription' | 'homework_list' | 'bookshelf_view';
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
}

export interface DashboardBanner {
  kind: 'announcement' | 'quote';
  greeting: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  message: string;
  ctaLabel: string;
  ctaTarget: 'ask_tutor' | 'manage_subscription' | 'homework_list' | 'bookshelf_view';
}
