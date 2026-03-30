import { Attachment, ChatMessage, Question } from '../types/app';
import { getKitabuApiBaseUrl } from './runtimeConfig';
import { loadSecureJson, saveSecureJson } from './storage';

interface GeneratedAssignment {
  title: string;
  description: string;
  questions: Question[];
}

interface GeneratedQuizPayload {
  flashcards?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  questions?: Question[];
}

interface AiProxyRequest {
  prompt: string;
  systemInstruction?: string;
  attachment?: Attachment;
  history?: ChatMessage[];
  responseMimeType?: 'application/json';
  feature: string;
}

interface AuthSession {
  accessToken?: string;
}

const AUTH_SESSION_STORAGE_KEY = 'auth_session';
const DEVICE_ID_STORAGE_KEY = 'kitabu_device_id';

function sanitizeJsonPayload(text: string) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function generateText({
  prompt,
  systemInstruction,
  attachment,
  history = [],
  responseMimeType,
  feature,
}: {
  prompt: string;
  systemInstruction?: string;
  attachment?: Attachment;
  history?: ChatMessage[];
  responseMimeType?: 'application/json';
  feature: string;
}) {
  const baseUrl = getKitabuApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const session = await loadSecureJson<AuthSession>(AUTH_SESSION_STORAGE_KEY, {});
  let deviceId = await loadSecureJson<string | null>(DEVICE_ID_STORAGE_KEY, null);
  if (!deviceId) {
    deviceId = `kitabu-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await saveSecureJson(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-kitabu-device-id': deviceId,
      'x-kitabu-device-label': 'Kitabu Native App',
      ...(session.accessToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      attachment,
      history,
      responseMimeType,
      feature,
    } satisfies AiProxyRequest),
  });

  if (!response.ok) {
    let message = 'AI assistance is currently unavailable. Please try again later.';

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to the default message.
    }

    throw new Error(message);
  }

  const payload = (await response.json()) as {
    text?: string;
  };

  return payload.text ?? null;
}

export async function askHomeworkHelper(
  prompt: string,
  history: ChatMessage[] = [],
  mode: 'chat' | 'explanation' = 'chat',
  attachment?: Attachment,
): Promise<string> {
  const systemInstruction =
    mode === 'chat'
      ? `You are KITABU AI, a concise and direct tutor.

Protocol:
1. Remove disclaimers, long introductions, or excessive praise.
2. When a student asks a new question, briefly acknowledge it and ask a probing question to gauge knowledge.
3. Ask at most two probing questions total. After the second question, give the full answer.
4. Keep the final answer clear and direct.
5. End the final answer with: "Is there anything else you'd like to know about this topic?"

If an image is provided, analyze it to help answer the student's question.`
      : `You are KITABU AI, an expert tutor. Provide a clear, step-by-step explanation of the concept.

Methodology:
1. Be direct and concise.
2. Break the concept down into logical steps.
3. Explain why the correct answer is right.
4. Use simple, friendly language.
5. Do not repeat the question.
6. Do not use markdown bolding.`;

  try {
    const response = await generateText({
      prompt,
      systemInstruction,
      attachment,
      history,
      feature: mode === 'chat' ? 'homework_helper_chat' : 'homework_helper_explanation',
    });

    return response || 'AI assistance is currently unavailable. Please try again later.';
  } catch (error) {
    console.error('Error calling AI proxy:', error);
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong. Please check your connection or try again later.';
  }
}

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string,
): Promise<string> {
  try {
    const response = await generateText({
      prompt:
        'Transcribe this audio exactly as it is spoken. Do not add any introductory or concluding remarks. Ignore silence or background noise. Return only the transcribed text.',
      attachment: {
        mimeType,
        data: base64Audio,
        type: 'file',
      },
      feature: 'audio_transcription',
    });

    return response || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio.');
  }
}

export async function generateQuizData(
  subject: string,
  topic: string,
  subTopic: string,
  count: number,
  type: 'flashcards' | 'quiz',
): Promise<GeneratedQuizPayload | null> {
  const prompt =
    type === 'flashcards'
      ? `Generate ${count} flashcards for a Grade 8 student about Subject: ${subject}, Topic: ${topic}, Sub-topic: ${subTopic}.

Return JSON with this shape:
{
  "flashcards": [
    { "id": "string", "question": "string", "answer": "string" }
  ]
}`
      : `Generate ${count} quiz questions for a Grade 8 student about Subject: ${subject}, Topic: ${topic}, Sub-topic: ${subTopic}.
Mix question types between MCQ, TRUE_FALSE, SHORT_ANSWER, and ESSAY when appropriate.

Return JSON with this shape:
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
}`;

  try {
    const response = await generateText({
      prompt,
      responseMimeType: 'application/json',
      feature: type === 'flashcards' ? 'flashcard_generation' : 'quiz_generation',
    });

    if (!response) {
      return null;
    }

    return JSON.parse(sanitizeJsonPayload(response)) as GeneratedQuizPayload;
  } catch (error) {
    console.error('Error generating quiz data:', error);
    return null;
  }
}

export async function generateAssignmentJson(
  grade: string,
  subject: string,
  strand: string,
  subStrand: string,
  topic: string,
): Promise<GeneratedAssignment | null> {
  const prompt = `Create a homework assignment for ${grade} ${subject}.
Strand: ${strand || 'General'}
Sub-strand: ${subStrand || 'General'}
Additional Topic/Details: ${topic || 'Comprehensive Review'}

The assignment must include:
1. A creative title.
2. A short description.
3. Questions mixed between MCQ (Multiple Choice), TRUE_FALSE, and SHORT_ANSWER types.
   IMPORTANT: If the 'Additional Topic/Details' text specifies a number of questions (e.g. "5 questions", "10 qs"), YOU MUST GENERATE EXACTLY THAT MANY.
   If no number is specified, generate default 8 questions.

Return pure JSON data matching this shape:
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": 1,
      "type": "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER",
      "text": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}`;

  try {
    const response = await generateText({
      prompt,
      responseMimeType: 'application/json',
      feature: 'assignment_generation',
    });

    if (!response) {
      return null;
    }

    const parsed = JSON.parse(sanitizeJsonPayload(response)) as GeneratedAssignment;

    if (!parsed.title || !parsed.description || !Array.isArray(parsed.questions)) {
      return null;
    }

    return {
      ...parsed,
      questions: parsed.questions.map((question, index) => ({
        ...question,
        id: question.id ?? index + 1,
      })),
    };
  } catch (error) {
    console.error('Error generating assignment:', error);
    return null;
  }
}

export async function extractCurriculumFromPdfData(
  base64Data: string,
  mimeType: string,
): Promise<
  Array<{
    number?: string;
    title: string;
    subStrands: Array<{
      number?: string;
      title: string;
      outcomes?: Array<{ id?: string; text: string } | string>;
      inquiryQuestions?: Array<{ id?: string; text: string } | string>;
    }>;
  }> | null
> {
  const prompt = `Analyze the attached curriculum PDF and extract strands and sub-strands.

Return JSON with this shape:
[
  {
    "number": "1.0",
    "title": "STRAND",
    "subStrands": [
      {
        "number": "1.1",
        "title": "Sub-strand",
        "outcomes": ["Outcome"],
        "inquiryQuestions": ["Question"]
      }
    ]
  }
]`;

  try {
    const response = await generateText({
      prompt,
      attachment: {
        mimeType,
        data: base64Data,
        type: 'file',
      },
      responseMimeType: 'application/json',
      feature: 'curriculum_extraction',
    });

    if (!response) {
      return null;
    }

    return JSON.parse(sanitizeJsonPayload(response));
  } catch (error) {
    console.error('Error extracting curriculum from PDF:', error);
    return null;
  }
}
