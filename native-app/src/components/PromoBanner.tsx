import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { DashboardBanner } from '../types/app';

interface PromoBannerProps {
  banner: DashboardBanner | null;
  onPressCta: (target: DashboardBanner['ctaTarget']) => void;
}

const gradientByTime = {
  morning: ['#f97316', '#fb923c'],
  afternoon: ['#0f766e', '#14b8a6'],
  evening: ['#1d4ed8', '#4338ca'],
  night: ['#0f172a', '#312e81'],
} as const;

const emojiByTime = {
  morning: '🌞',
  afternoon: '📘',
  evening: '✨',
  night: '🌙',
} as const;

export function PromoBanner({ banner, onPressCta }: PromoBannerProps) {
  if (!banner) {
    return null;
  }

  const colors = gradientByTime[banner.timeOfDay];
  const emoji = banner.kind === 'announcement' ? '📣' : emojiByTime[banner.timeOfDay];

  return (
    <View style={styles.bannerWrap}>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.row}>
          <View style={styles.illustrationWrap}>
            <Text style={styles.illustrationEmoji}>{emoji}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.greeting}>{banner.greeting}</Text>
            <Text style={styles.title}>{banner.title}</Text>
            <Text style={styles.message}>{banner.message}</Text>

            <Pressable
              onPress={() => onPressCta(banner.ctaTarget)}
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
              <Text style={styles.ctaText}>{banner.ctaLabel}</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  banner: {
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  glowTop: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 80,
    height: 140,
    position: 'absolute',
    right: -42,
    top: -42,
    width: 140,
  },
  glowBottom: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 80,
    bottom: -50,
    height: 120,
    left: -40,
    position: 'absolute',
    width: 120,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 84,
  },
  illustrationEmoji: {
    fontSize: 42,
  },
  body: {
    flex: 1,
    paddingLeft: 12,
  },
  greeting: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
});
