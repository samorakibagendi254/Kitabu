import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SectionCardProps {
  title: string;
  subtitle: string;
  accent: string;
  onPress?: () => void;
  rightLabel?: string;
}

export function SectionCard({
  title,
  subtitle,
  accent,
  onPress,
  rightLabel,
}: SectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.cardPressed : undefined,
      ]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  accent: {
    width: 12,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  body: {
    flex: 1,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
  },
  rightLabel: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
});
