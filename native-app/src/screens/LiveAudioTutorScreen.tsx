import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Mic, MicOff, X } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { LiveAudioSnapshot, liveAudioBridge } from '../services/nativeBridges';

interface LiveAudioTutorScreenProps {
  onClose: () => void;
}

const initialSnapshot: LiveAudioSnapshot = {
  status: 'connecting',
  isMicOn: true,
  volumeLevel: 0,
  prompt: '',
};

export function LiveAudioTutorScreen({ onClose }: LiveAudioTutorScreenProps) {
  const [snapshot, setSnapshot] = useState<LiveAudioSnapshot>(initialSnapshot);
  const sessionRef = useRef<ReturnType<typeof liveAudioBridge.createSession> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const outerGlow = useRef(new Animated.Value(1)).current;
  const innerGlow = useRef(new Animated.Value(1)).current;
  const statusOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const session = liveAudioBridge.createSession();
    sessionRef.current = session;
    const unsubscribe = session.subscribe(setSnapshot);

    return () => {
      unsubscribe();
      session.close();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1 + snapshot.volumeLevel * 0.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(outerGlow, {
        toValue: 1 + snapshot.volumeLevel * 1.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(innerGlow, {
        toValue: 1 + snapshot.volumeLevel * 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [innerGlow, outerGlow, scale, snapshot.volumeLevel]);

  useEffect(() => {
    if (snapshot.status === 'connected' || snapshot.status === 'error') {
      statusOpacity.stopAnimation();
      statusOpacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [snapshot.status, statusOpacity]);

  const statusLabel =
    snapshot.status === 'connected' ? 'Listening' : snapshot.status;

  const statusStyle =
    snapshot.status === 'connected'
      ? styles.statusConnected
      : snapshot.status === 'error'
        ? styles.statusError
        : styles.statusNeutral;

  return (
    <View style={styles.backdrop}>
      <View style={styles.orbContainer}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={20} color="rgba(255,255,255,0.88)" />
        </Pressable>

        <Animated.View style={[styles.statusWrap, { opacity: statusOpacity }]}>
          <Text style={[styles.statusText, statusStyle]}>{statusLabel}</Text>
        </Animated.View>

        <View style={styles.orbWrap}>
          <Animated.View style={[styles.outerGlowWrap, { transform: [{ scale: outerGlow }] }]}>
            <LinearGradient
              colors={['rgba(59,130,246,0.55)', 'rgba(139,92,246,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.outerGlow}
            />
          </Animated.View>
          <Animated.View style={[styles.innerGlowWrap, { transform: [{ scale: innerGlow }] }]}>
            <LinearGradient
              colors={['rgba(34,211,238,0.42)', 'rgba(56,189,248,0.18)']}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 0.8, y: 0.8 }}
              style={styles.innerGlow}
            />
          </Animated.View>
          <Animated.View style={[styles.coreOrbWrap, { transform: [{ scale }] }]}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coreOrb}
            />
            <View style={styles.shine} />
            {snapshot.isMicOn ? (
              <Mic size={34} color="#FFFFFF" />
            ) : (
              <MicOff size={34} color="rgba(255,255,255,0.55)" />
            )}
          </Animated.View>
        </View>

        <LiveAudioControls
          snapshot={snapshot}
          onToggleMic={() => sessionRef.current?.toggleMic()}
        />
      </View>
    </View>
  );
}

function LiveAudioControls({
  snapshot,
  onToggleMic,
}: {
  snapshot: LiveAudioSnapshot;
  onToggleMic: () => void;
}) {
  return (
    <View style={styles.controlsWrap}>
      <Pressable
        onPress={onToggleMic}
        style={[
          styles.micToggle,
          snapshot.isMicOn ? styles.micToggleOn : styles.micToggleOff,
        ]}>
        {snapshot.isMicOn ? (
          <Mic size={24} color="#FFFFFF" />
        ) : (
          <MicOff size={24} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  orbContainer: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -48,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusWrap: {
    position: 'absolute',
    top: 18,
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusConnected: { color: '#34D399' },
  statusError: { color: '#F87171' },
  statusNeutral: { color: '#93C5FD' },
  orbWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowWrap: {
    position: 'absolute',
    inset: 0,
    borderRadius: 999,
  },
  outerGlow: {
    flex: 1,
    borderRadius: 999,
    opacity: 0.32,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  innerGlowWrap: {
    position: 'absolute',
    inset: 16,
    borderRadius: 999,
  },
  innerGlow: {
    flex: 1,
    borderRadius: 999,
    opacity: 0.28,
  },
  coreOrbWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  coreOrb: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  },
  controlsWrap: {
    position: 'absolute',
    bottom: -62,
  },
  micToggle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micToggleOn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  micToggleOff: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
});
