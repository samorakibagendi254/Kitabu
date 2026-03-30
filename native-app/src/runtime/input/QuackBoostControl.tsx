import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuackInputAdapter } from './QuackInputAdapter';

interface QuackBoostControlProps {
  adapter: QuackInputAdapter;
  visible: boolean;
}

export function QuackBoostControl({
  adapter,
  visible,
}: QuackBoostControlProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.actionBar}>
      <Pressable onPress={adapter.triggerBoost} style={styles.boostButton}>
        <Text style={styles.boostButtonText}>Quack Boost</Text>
      </Pressable>
      <Text style={styles.inputMeta}>
        {adapter.state.source === 'button_fallback'
          ? 'Button Input Active'
          : 'Microphone Input Active'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    gap: 8,
  },
  boostButton: {
    backgroundColor: '#F97316',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
  },
  boostButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  inputMeta: {
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
