import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CrazyBalloonRenderState } from './mapCrazyBalloonRenderState';

interface CrazyBalloonRendererProps {
  renderState: CrazyBalloonRenderState;
  onPopBalloon: (id: number) => void;
}

export function CrazyBalloonRenderer({
  renderState,
  onPopBalloon,
}: CrazyBalloonRendererProps) {
  return (
    <View style={styles.playfield}>
      <View style={styles.cloud} />
      <View style={[styles.cloud, styles.cloudTwo]} />
      <View style={[styles.hill, styles.backHill]} />
      <View style={styles.hill} />

      {renderState.balloons.map(balloon => (
        <Pressable
          key={balloon.id}
          onPress={() => onPopBalloon(balloon.id)}
          style={[
            styles.balloon,
            {
              left: `${balloon.leftPct}%`,
              bottom: `${balloon.bottomPct}%`,
              backgroundColor: balloon.color,
            },
          ]}>
          <Text style={styles.balloonEmoji}>
            {balloon.label === 'monster' ? '👹' : '🎈'}
          </Text>
          <Text style={styles.balloonTextAlt}>
            {balloon.label === 'monster' ? '👹' : '🎈'}
          </Text>
          <Text style={styles.balloonText}>
            {balloon.label === 'monster' ? '👹' : '🎈'}
          </Text>
        </Pressable>
      ))}

      {renderState.showHint ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Pop to Score!</Text>
          <Text style={styles.hintBody}>
            Beware! 2 in 5 balloons hide a hungry monster.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  playfield: {
    flex: 1,
    marginTop: 56,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#7DD3FC',
  },
  cloud: {
    position: 'absolute',
    top: 58,
    left: 36,
    width: 92,
    height: 42,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cloudTwo: { top: 112, left: 220, width: 110 },
  hill: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -18,
    height: 150,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    backgroundColor: '#22C55E',
  },
  backHill: {
    bottom: 42,
    left: 80,
    right: -80,
    height: 118,
    backgroundColor: '#4ADE80',
  },
  balloon: {
    position: 'absolute',
    width: 62,
    height: 78,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  balloonText: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  balloonTextAlt: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  balloonEmoji: { fontSize: 28 },
  hintCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  hintTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  hintBody: { color: '#E2E8F0', lineHeight: 21 },
});
