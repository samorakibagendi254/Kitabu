import { CurriculumSubjectBundle, LearningStrand, Question } from '../types/app';
import { getKitabuApiBaseUrl } from './runtimeConfig';
import { loadSecureJson, saveSecureJson } from './storage';

const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const DEVICE_ID_STORAGE_KEY = 'kitabu_device_id';

interface AuthSession {
  accessToken?: string;
}

function randomDeviceId() {
  return `kitabu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

async function getDeviceId() {
  let deviceId = await loadSecureJson<string | null>(DEVICE_ID_STORAGE_KEY, null);

  if (!deviceId) {
    deviceId = randomDeviceId();
    await saveSecureJson(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getKitabuApiBaseUrl();
  if (!baseUrl) {
    throw new Error('KITABU_API_BASE_URL is not configured');
  }

  const [session, deviceId] = await Promise.all([
    loadSecureJson<AuthSession>(AUTH_SESSION_STORAGE_KEY, {}),
    getDeviceId(),
  ]);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-kitabu-device-id': deviceId,
      'x-kitabu-device-label': 'Kitabu Native App',
      ...(session.accessToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export async function getCurriculumForGrade(grade: string, subjectId?: string) {
  const query = new URLSearchParams({ grade });
  if (subjectId) {
    query.set('subjectId', subjectId);
  }

  return apiRequest<{ grade: string; subjects: CurriculumSubjectBundle[] }>(
    `/curriculum?${query.toString()}`,
    { method: 'GET' },
  );
}

export async function saveCurriculumSubject(input: {
  grade: string;
  subjectId: string;
  subjectName: string;
  strands: LearningStrand[];
}) {
  return apiRequest<{ grade: string; subjects: CurriculumSubjectBundle[] }>(
    `/curriculum/subjects/${encodeURIComponent(input.subjectId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        grade: input.grade,
        subjectName: input.subjectName,
        strands: input.strands.map(strand => ({
          number: strand.number,
          title: strand.title,
          subTitle: strand.subTitle,
          subStrands: strand.subStrands.map(subStrand => ({
            number: subStrand.number,
            title: subStrand.title,
            type: subStrand.type,
            description: subStrand.description,
            pages: subStrand.pages,
            outcomes: subStrand.outcomes ?? [],
            inquiryQuestions: subStrand.inquiryQuestions ?? [],
          })),
        })),
      }),
    },
  );
}

export async function importCurriculumPdf(input: {
  grade: string;
  subjectId: string;
  subjectName: string;
  fileName?: string;
  mimeType?: string;
  base64Data: string;
}) {
  return apiRequest<{ grade: string; subjects: CurriculumSubjectBundle[] }>(
    '/curriculum/import/pdf',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function getSubStrandLesson(subStrandId: string) {
  return apiRequest<{
    subStrandId: string;
    pages: Array<{ title: string; content: string }>;
  }>(`/curriculum/sub-strands/${subStrandId}/lesson`, {
    method: 'POST',
  });
}

export async function generateSubStrandQuiz(subStrandId: string, questionCount = 10) {
  return apiRequest<{
    subStrandId: string;
    questions: Question[];
  }>(`/curriculum/sub-strands/${subStrandId}/quiz`, {
    method: 'POST',
    body: JSON.stringify({ questionCount }),
  });
}

export async function completeSubStrandLearning(subStrandId: string, quizScore?: number) {
  return apiRequest<{
    completed: boolean;
    subStrandId: string;
    grade: string;
    subjectId: string;
  }>(`/curriculum/sub-strands/${subStrandId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ quizScore }),
  });
}
