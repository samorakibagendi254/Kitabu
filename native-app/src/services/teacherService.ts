import {
  Assignment,
  StudentPerformance,
  StudentSubmission,
  SubmittedAssignment,
} from '../types/app';
import { apiRequest } from './apiClient';

export async function getTeacherStudents() {
  const payload = await apiRequest<{ students: StudentPerformance[] }>('/teacher/students', {
    method: 'GET',
  });
  return payload.students;
}

export async function getTeacherAssignments() {
  return apiRequest<{
    assignments: SubmittedAssignment[];
    submissionsByAssignment: Record<string, StudentSubmission[]>;
  }>('/teacher/assignments', {
    method: 'GET',
  });
}

export async function createTeacherAssignment(input: Omit<Assignment, 'id' | 'status'>) {
  return apiRequest<{ assignmentId: string }>('/teacher/assignments', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      subject: input.subject,
      description: input.description,
      gradeLevel: input.gradeLevel,
      dueDate: input.dueDate,
      questions: input.questions,
    }),
  });
}

export async function getStudentAssignments() {
  const payload = await apiRequest<{ assignments: Assignment[] }>('/homework/assignments', {
    method: 'GET',
  });
  return payload.assignments.map(item => ({
    ...item,
    dueDate: item.dueDate || '',
  }));
}

export async function submitStudentAssignment(
  assignmentId: string,
  input: {
    score: number;
    answers: Array<{
      questionId: number;
      question: string;
      answer: string;
      isCorrect: boolean;
    }>;
  },
) {
  return apiRequest<{ success: boolean }>(`/homework/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
