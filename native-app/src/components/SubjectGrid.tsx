import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Atom,
  BookOpen,
  Calculator,
  Gamepad2,
  Globe,
  Languages,
} from 'lucide-react-native';

import { Subject } from '../types/app';

const SUBJECT_ORDER = ['science', 'english', 'math', 'kiswahili', 'social'];

const SUBJECT_ICONS: Record<
  string,
  React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>
> = {
  science: Atom,
  english: BookOpen,
  math: Calculator,
  kiswahili: Languages,
  social: Globe,
};

interface SubjectGridProps {
  subjects: Subject[];
  onOpenSubject: (subject: Subject) => void;
  onOpenGameZone: () => void;
}

export function SubjectGrid({
  subjects,
  onOpenSubject,
  onOpenGameZone,
}: SubjectGridProps) {
  const orderedSubjects = useMemo(() => {
    const orderMap = new Map(SUBJECT_ORDER.map((id, index) => [id, index]));

    return [...subjects].sort((left, right) => {
      const leftOrder = orderMap.get(left.id) ?? 99;
      const rightOrder = orderMap.get(right.id) ?? 99;
      return leftOrder - rightOrder;
    });
  }, [subjects]);

  return (
    <View style={styles.subjectSection}>
      <View style={styles.subjectGrid}>
        {orderedSubjects.map(subject => {
          const Icon = SUBJECT_ICONS[subject.id] || BookOpen;

          return (
            <Pressable
              key={subject.id}
              onPress={() => onOpenSubject(subject)}
              style={({ pressed }) => [
                styles.subjectCardWrap,
                pressed && styles.subjectCardPressed,
              ]}>
              <LinearGradient
                colors={[subject.colorFrom, subject.colorTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subjectCard}>
                <View style={styles.subjectTexture} />
                <View style={styles.subjectGlow} />

                <View style={styles.subjectInner}>
                  <Icon color="#FFFFFF" size={26} strokeWidth={2.15} />
                  <Text style={styles.subjectName}>{subject.name}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onOpenGameZone}
          style={({ pressed }) => [
            styles.subjectCardWrap,
            pressed && styles.subjectCardPressed,
          ]}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subjectCard}>
            <View style={styles.gameZoneTexture} />
            <View style={styles.gameZoneGlow} />

            <View style={styles.subjectInner}>
              <Gamepad2 color="#60A5FA" size={26} strokeWidth={2.2} />
              <Text style={styles.subjectName}>Game Zone</Text>
              <View style={styles.gameZoneChip}>
                <View style={styles.subjectChipDot} />
                <Text style={styles.gameZoneChipText}>Live</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subjectSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCardWrap: {
    width: '48.4%',
  },
  subjectCard: {
    borderRadius: 18,
    height: 96,
    overflow: 'hidden',
    position: 'relative',
  },
  subjectCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  subjectTexture: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  subjectGlow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    height: 64,
    position: 'absolute',
    right: -18,
    top: -10,
    width: 64,
  },
  subjectInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  gameZoneTexture: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gameZoneGlow: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 40,
    bottom: -18,
    height: 72,
    position: 'absolute',
    right: -14,
    width: 72,
  },
  gameZoneChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subjectChipDot: {
    backgroundColor: '#4ADE80',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  gameZoneChipText: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
