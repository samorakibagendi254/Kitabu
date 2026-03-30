import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { StudentSubmission, SubmittedAssignment } from '../../types/app';
import { TeacherAvatarBadge } from './TeacherAvatarBadge';

interface TeacherAssignmentDetailSectionProps {
  styles: Record<string, any>;
  assignment: SubmittedAssignment;
  activeSubmissionList: StudentSubmission[];
  onBack: () => void;
  onSelectSubmission: (submission: StudentSubmission) => void;
}

export function TeacherAssignmentDetailSection({
  styles,
  assignment,
  activeSubmissionList,
  onBack,
  onSelectSubmission,
}: TeacherAssignmentDetailSectionProps) {
  return (
    <View style={styles.detailRoot}>
      <View style={styles.detailHead}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={24} color="#6B7280" />
        </Pressable>
        <Text style={styles.detailTitle} numberOfLines={1}>
          {assignment.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.detailMetric}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text style={[styles.detailMetricValue, styles.averageMetric]}>
              {assignment.averageScore}%
            </Text>
          </View>
          <View style={styles.detailMetric}>
            <Text style={styles.metricLabel}>Highest</Text>
            <Text style={[styles.detailMetricValue, styles.goodText]}>98%</Text>
          </View>
          <View style={styles.detailMetric}>
            <Text style={styles.metricLabel}>Lowest</Text>
            <Text style={[styles.detailMetricValue, styles.warnText]}>45%</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Submissions</Text>
            <Text style={styles.cardHeaderMeta}>
              {assignment.submittedCount} / {assignment.totalStudents}
            </Text>
          </View>

          {activeSubmissionList.map(item => (
            <Pressable
              key={item.studentId}
              onPress={() => onSelectSubmission(item)}
              style={styles.row}>
              <View style={styles.rowLead}>
                <TeacherAvatarBadge styles={styles} name={item.studentName} avatar={item.avatar} size={40} />
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{item.studentName}</Text>
                  <Text style={[styles.rowMetaTiny, item.status === 'Late' && styles.warnText]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.rowEndTight}>
                <Text style={[styles.score, item.score >= 80 ? styles.goodText : styles.scoreNeutral]}>
                  {item.score}%
                </Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </Pressable>
          ))}

          <View style={[styles.row, styles.pendingRow]}>
            <View style={styles.rowLead}>
              <View style={[styles.avatar, styles.pendingAvatar]}>
                <Text style={styles.pendingAvatarText}>JD</Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>John Doe</Text>
                <Text style={styles.rowMetaTiny}>Pending</Text>
              </View>
            </View>
            <Text style={styles.pendingText}>No submission</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
