import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QuackRenderState } from './mapQuackRenderState';

interface QuackRendererProps {
  renderState: QuackRenderState;
}

export function QuackRenderer({ renderState }: QuackRendererProps) {
  return (
    <View style={styles.sky}>
      <View style={styles.gameBoard}>
        <View style={styles.scoreBanner}>
          <Text style={styles.scoreValue}>{renderState.score}</Text>
        </View>
        <View style={styles.ground} />

        <View style={[styles.playerWrap, { bottom: renderState.playerBottom }]}>
          <Text style={styles.playerEmojiAlt}>🐔</Text>
          <Text style={styles.playerEmoji}>🐔</Text>
        </View>

        {renderState.obstacles.map(obstacle => (
          <View
            key={obstacle.id}
            style={[
              styles.obstacle,
              obstacle.type === 'fire' ? styles.fireObstacle : styles.arrowObstacle,
              obstacle.lane === 'ground' ? styles.groundObstacle : styles.airObstacle,
              { left: `${obstacle.xPct}%` },
            ]}>
            <Text style={styles.obstacleEmojiAlt}>
              {obstacle.type === 'fire' ? '🔥' : '🏹'}
            </Text>
            <Text style={styles.obstacleEmoji}>
              {obstacle.type === 'fire' ? '🔥' : '🏹'}
            </Text>
          </View>
        ))}

        <View style={styles.volumePanel}>
          <Text style={styles.volumeLabel}>Voice Force</Text>
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeFill, { width: `${renderState.volumeWidthPct}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
    backgroundColor: '#7DD3FC',
    justifyContent: 'flex-end',
  },
  gameBoard: {
    flex: 1,
    marginTop: 72,
    marginHorizontal: 18,
    marginBottom: 98,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#38BDF8',
  },
  scoreBanner: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    textShadowColor: 'rgba(15,23,42,0.24)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 16,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: '#22C55E',
  },
  playerWrap: {
    position: 'absolute',
    left: 42,
    zIndex: 2,
  },
  playerEmoji: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  playerEmojiAlt: { fontSize: 44 },
  obstacle: {
    position: 'absolute',
    zIndex: 2,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundObstacle: { bottom: 24 },
  airObstacle: { bottom: 108 },
  fireObstacle: {},
  arrowObstacle: {},
  obstacleEmoji: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  obstacleEmojiAlt: { fontSize: 34 },
  volumePanel: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 88,
    gap: 8,
  },
  volumeLabel: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  volumeTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  volumeFill: { height: 10, borderRadius: 999, backgroundColor: '#FEF08A' },
});
