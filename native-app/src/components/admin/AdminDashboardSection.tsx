import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { Activity, ChevronDown, DollarSign, Users } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { SchoolData, UserProfile } from '../../types/app';

const DASHBOARD_LINE_PATH = 'M0 35 Q 20 32 40 25 T 100 10';
const DASHBOARD_FILL_PATH = 'M0 40 L0 35 Q 20 32 40 25 T 100 10 V 40 Z';

interface AdminDashboardSectionProps {
  styles: Record<string, any>;
  dashboardGrade: string;
  timeRange: string;
  gradeMenuOpen: boolean;
  timeMenuOpen: boolean;
  userProfile: UserProfile;
  schoolsList: SchoolData[];
  totalStudents: number;
  onToggleGradeMenu: () => void;
  onToggleTimeMenu: () => void;
  onSelectGrade: (grade: string) => void;
  onSelectTimeRange: (range: string) => void;
}

export function AdminDashboardSection({
  styles,
  dashboardGrade,
  timeRange,
  gradeMenuOpen,
  timeMenuOpen,
  userProfile,
  schoolsList,
  totalStudents,
  onToggleGradeMenu,
  onToggleTimeMenu,
  onSelectGrade,
  onSelectTimeRange,
}: AdminDashboardSectionProps) {
  const totalSchools = schoolsList.length;
  const averageStudentsPerSchool =
    totalSchools > 0 ? Math.round(totalStudents / totalSchools) : 0;

  return (
    <>
      <View style={styles.pageHeadRow}>
        <View style={styles.pageHead}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSub}>Overview & Performance</Text>
        </View>
        <View style={styles.filterCluster}>
          <View style={styles.menuWrap}>
            <Pressable onPress={onToggleGradeMenu} style={styles.chip}>
              <Text style={styles.chipText}>{dashboardGrade}</Text>
              <ChevronDown size={14} color="#94A3B8" />
            </Pressable>
            {gradeMenuOpen ? (
              <View style={styles.menu}>
                {['All Grades', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map(
                  option => (
                    <Pressable
                      key={option}
                      onPress={() => onSelectGrade(option)}
                      style={[styles.menuItem, dashboardGrade === option && styles.menuItemActive]}>
                      <Text style={[styles.menuText, dashboardGrade === option && styles.menuTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            ) : null}
          </View>
          <View style={styles.menuWrap}>
            <Pressable onPress={onToggleTimeMenu} style={styles.chip}>
              <Text style={styles.chipText}>{timeRange}</Text>
              <ChevronDown size={14} color="#94A3B8" />
            </Pressable>
            {timeMenuOpen ? (
              <View style={styles.menu}>
                {['This Year', 'Last Year', 'Last 30 Days', 'Last 7 Days'].map(option => (
                  <Pressable
                    key={option}
                    onPress={() => onSelectTimeRange(option)}
                    style={[styles.menuItem, timeRange === option && styles.menuItemActive]}>
                    <Text style={[styles.menuText, timeRange === option && styles.menuTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dashboardRail}>
        <View style={[styles.railCard, styles.blue]}>
          <View style={styles.railGlow} />
          <Text style={styles.heroLabel}>Total Schools</Text>
          <Text style={styles.heroValue}>{totalSchools}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Registered schools</Text>
          </View>
          <Users size={30} color="rgba(191,219,254,0.5)" style={styles.railIcon} />
        </View>

        <View style={[styles.railCard, styles.green]}>
          <View style={styles.railGlow} />
          <Text style={styles.heroLabel}>Total Students</Text>
          <Text style={styles.heroValue}>{totalStudents}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Tracked enrollments</Text>
          </View>
          <Activity size={30} color="rgba(209,250,229,0.5)" style={styles.railIcon} />
        </View>

        <View style={[styles.railCard, styles.purple]}>
          <View style={styles.railGlow} />
          <Text style={styles.heroLabel}>Avg / School</Text>
          <Text style={styles.heroValue}>{averageStudentsPerSchool}</Text>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Students per school</Text>
          </View>
          <DollarSign size={30} color="rgba(233,213,255,0.5)" style={styles.railIcon} />
        </View>
      </ScrollView>

      <View style={styles.chartPanel}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.panelTitle}>Enrollment Overview</Text>
            <Text style={styles.pageSub}>Live data only</Text>
          </View>
          <View style={styles.chartBadge}>
            <Users size={18} color="#2563EB" />
          </View>
        </View>
        {totalSchools > 0 ? (
          <>
            <View style={styles.chartSvgWrap}>
              <Svg viewBox="0 0 100 40" width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#818CF8" stopOpacity="0.5" />
                    <Stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                  </SvgLinearGradient>
                </Defs>
                <Path d={DASHBOARD_FILL_PATH} fill="url(#chartGradient)" />
                <Path d={DASHBOARD_LINE_PATH} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.chartLabels}>
              {['Schools', 'Students', 'Average'].map(label => (
                <Text key={label} style={styles.chartLabel}>
                  {label}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.panelText}>No school analytics available yet.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Administrator</Text>
        <Text style={styles.panelText}>{userProfile.name}</Text>
        <Text style={styles.panelText}>
          {schoolsList.length} schools • {totalStudents} students
        </Text>
      </View>
    </>
  );
}
