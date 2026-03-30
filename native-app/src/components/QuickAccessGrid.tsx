import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ClipboardList,
  FilePen,
  LayoutGrid,
  Library,
  Podcast,
} from 'lucide-react-native';

type DashboardActionTarget =
  | 'bookshelf_view'
  | 'podcasts_view'
  | 'quiz_me_config'
  | 'homework_list';

const DASHBOARD_ACTIONS: Array<{
  id: 'dashboard' | DashboardActionTarget;
  label: string;
  icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'bookshelf_view', label: 'Book Shelf', icon: Library },
  { id: 'podcasts_view', label: 'Podcasts', icon: Podcast },
  { id: 'quiz_me_config', label: 'QuizMe', icon: FilePen },
  { id: 'homework_list', label: 'Homework', icon: ClipboardList },
];

interface QuickAccessGridProps {
  pendingAssignments: number;
  onOpenFeature: (view: DashboardActionTarget) => void;
}

export function QuickAccessGrid({
  pendingAssignments,
  onOpenFeature,
}: QuickAccessGridProps) {
  return (
    <View style={styles.quickRailOuter}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRail}>
        {DASHBOARD_ACTIONS.map(action => {
          const isActive = action.id === 'dashboard';
          const isHomework = action.id === 'homework_list';
          const Icon = action.icon;

          return (
            <Pressable
              key={action.id}
              onPress={() => {
                if (!isActive) {
                  onOpenFeature(action.id as DashboardActionTarget);
                }
              }}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && !isActive && styles.quickActionPressed,
              ]}>
              <View style={styles.quickIconWrap}>
                <Icon
                  color={isActive ? '#6D28D9' : '#4B5563'}
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2.25}
                />
                {isHomework && pendingAssignments > 0 ? (
                  <View style={styles.homeworkBadge}>
                    <Text style={styles.homeworkBadgeText}>{pendingAssignments}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.quickLabel, isActive && styles.quickLabelActive]}>
                {action.label}
              </Text>

              {isActive ? <View style={styles.quickActionUnderline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  quickRailOuter: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(229,231,235,0.8)',
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  quickRail: {
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  quickAction: {
    alignItems: 'center',
    minWidth: 68,
    position: 'relative',
  },
  quickActionPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  quickIconWrap: {
    marginBottom: 6,
    position: 'relative',
  },
  homeworkBadge: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -10,
    top: -8,
  },
  homeworkBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  quickLabel: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '700',
  },
  quickLabelActive: {
    color: '#6B21A8',
    fontWeight: '800',
  },
  quickActionUnderline: {
    backgroundColor: '#9333EA',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    bottom: -14,
    height: 3,
    position: 'absolute',
    width: '100%',
  },
});
