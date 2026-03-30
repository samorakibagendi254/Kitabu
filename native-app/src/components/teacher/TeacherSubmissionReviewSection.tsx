import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react-native';

import { StudentSubmission } from '../../types/app';
import { TeacherAvatarBadge } from './TeacherAvatarBadge';

interface TeacherSubmissionReviewSectionProps {
  styles: Record<string, any>;
  submission: StudentSubmission;
  getAnswerKey: (questionId: number) => string;
  onBack: () => void;
}

export function TeacherSubmissionReviewSection({
  styles,
  submission,
  getAnswerKey,
  onBack,
}: TeacherSubmissionReviewSectionProps) {
  return (
    <View style={styles.detailRoot}>
      <View style={styles.detailHead}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={24} color="#6B7280" />
        </Pressable>
        <View style={styles.reviewHeaderMain}>
          <TeacherAvatarBadge styles={styles} name={submission.studentName} avatar={submission.avatar} size={32} />
          <View style={styles.reviewHeaderText}>
            <Text style={styles.reviewStudentName}>{submission.studentName}</Text>
            <Text style={styles.reviewLabel}>Review</Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>{submission.score}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {submission.answers.map((answer, index) => (
          <View key={answer.questionId} style={styles.reviewCard}>
            <View style={styles.reviewQuestionRow}>
              <Text style={styles.questionNumber}>{`Q${index + 1}`}</Text>
              <Text style={styles.reviewQuestionText}>{answer.question}</Text>
            </View>

            <View
              style={[
                styles.answerBlock,
                answer.isCorrect ? styles.answerBlockCorrect : styles.answerBlockIncorrect,
              ]}>
              <Text
                style={[
                  styles.answerBlockLabel,
                  answer.isCorrect ? styles.answerLabelGood : styles.answerLabelBad,
                ]}>
                Student Answer
              </Text>
              <Text
                style={[
                  styles.answerBlockValue,
                  answer.isCorrect ? styles.answerValueGood : styles.answerValueBad,
                ]}>
                {answer.answer}
              </Text>
            </View>

            {!answer.isCorrect ? (
              <View style={styles.correctAnswerBlock}>
                <Text style={styles.correctAnswerLabel}>Correct Answer</Text>
                <Text style={styles.correctAnswerValue}>{getAnswerKey(answer.questionId)}</Text>
              </View>
            ) : null}

            <View style={styles.reviewFooter}>
              <View style={styles.reviewStatusRow}>
                {answer.isCorrect ? (
                  <CheckCircle2 size={16} color="#15803D" />
                ) : (
                  <AlertCircle size={16} color="#DC2626" />
                )}
                <Text style={[styles.reviewStatusText, answer.isCorrect ? styles.goodText : styles.badText]}>
                  {answer.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
