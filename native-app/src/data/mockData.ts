import {
  Assignment,
  Book,
  Flashcard,
  LearningStrand,
  Podcast,
  Question,
  SchoolData,
  StudentPerformance,
  StudentSubmission,
  Subject,
  SubmittedAssignment,
  UserProfile,
} from '../types/app';

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    colorFrom: '#9333EA',
    colorTo: '#6D28D9',
  },
  {
    id: 'english',
    name: 'English',
    colorFrom: '#2563EB',
    colorTo: '#4338CA',
  },
  {
    id: 'science',
    name: 'Science',
    colorFrom: '#059669',
    colorTo: '#0F766E',
  },
  {
    id: 'kiswahili',
    name: 'Kiswahili',
    colorFrom: '#D97706',
    colorTo: '#C2410C',
  },
  {
    id: 'social',
    name: 'Social Studies',
    colorFrom: '#DC2626',
    colorTo: '#BE123C',
  },
];

export const INITIAL_CURRICULUM_DATA: Record<string, LearningStrand[]> = {};
export const FALLBACK_STRAND: LearningStrand = {
  id: 'strand-empty',
  title: 'No Curriculum Available',
  subTitle: 'Curriculum content has not been published yet.',
  subStrands: [],
};
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_SCHOOLS: SchoolData[] = [];
export const INITIAL_BOOKS: Book[] = [];
export const INITIAL_FLASHCARDS: Flashcard[] = [];
export const INITIAL_QUIZ_QUESTIONS: Question[] = [];
export const INITIAL_PODCASTS: Podcast[] = [];
export const INITIAL_TEACHER_STUDENTS: StudentPerformance[] = [];
export const INITIAL_SUBMITTED_ASSIGNMENTS: SubmittedAssignment[] = [];
export const INITIAL_SUBMISSIONS_BY_ASSIGNMENT: Record<string, StudentSubmission[]> = {};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Kitabu User',
  role: 'Student Account',
  grade: 'Grade 8',
  gender: 'Not Specified',
  email: '',
  avatar: 'avatar-afro-boy',
  school: '',
  phone: '',
  dateJoined: '',
  points: 0,
};
