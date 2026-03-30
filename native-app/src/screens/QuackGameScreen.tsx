import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Search,
  Settings,
  Trophy,
  UserPlus,
  X,
} from 'lucide-react-native';

import { useQuackRuntime } from '../hooks/useQuackRuntime';
import { QuackRenderer } from '../renderers/quack/QuackRenderer';
import { mapQuackRenderState } from '../renderers/quack/mapQuackRenderState';
import { useQuackEffects } from '../runtime/effects/QuackEffectsController';
import { QuackBoostControl } from '../runtime/input/QuackBoostControl';
import { useQuackInputAdapter } from '../runtime/input/QuackInputAdapter';

const ONLINE_PLAYERS: Array<{ id: string; name: string; avatar: string; rank: number }> = [];

type GameView = 'menu' | 'lobby' | 'playing' | 'quiz' | 'gameover' | 'multi_result';

interface QuackGameScreenProps {
  onBack: () => void;
  onAddPoints: (points: number) => void;
}

function isSvgAvatar(uri: string) {
  return /\.svg(\?|$)/i.test(uri);
}

export function QuackGameScreen({ onAddPoints, onBack }: QuackGameScreenProps) {
  const runtime = useQuackRuntime();
  const [searchQuery, setSearchQuery] = useState('');
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentAvatar, setOpponentAvatar] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const awardedStatusRef = useRef<string | null>(null);
  const view = runtime.state.status as GameView;
  const playMode = runtime.state.mode;
  const opponentScore = runtime.state.opponentScore;
  const opponentAlive = runtime.state.opponentAlive;
  const score = runtime.state.score;
  const highScore = runtime.state.highScore;
  const livesUsed = runtime.state.livesUsed;
  const sensitivity = runtime.state.sensitivity;
  const quizState = runtime.state.quizQuestion
    ? {
        q: runtime.state.quizQuestion.prompt,
        options: runtime.state.quizQuestion.options,
        a: runtime.state.quizQuestion.answer,
        timeLeft: runtime.state.quizTimeLeftSec,
        totalTime: runtime.state.quizTotalTimeSec,
      }
    : null;
  const matchResult = runtime.state.matchResult || 'win';
  const renderState = useMemo(() => mapQuackRenderState(runtime.state), [runtime.state]);
  const effect = useQuackEffects(runtime.events);
  const inputAdapter = useQuackInputAdapter({
    onBoost: runtime.boost,
    inputLevel: runtime.state.volume,
  });

  const filteredPlayers = useMemo(
    () =>
      ONLINE_PLAYERS.filter(player =>
        player.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [searchQuery],
  );

  function startSingle() {
    setOpponentName(null);
    setOpponentAvatar(null);
    awardedStatusRef.current = null;
    runtime.startSingle();
  }

  function startMulti(name: string, avatar?: string) {
    setOpponentName(name);
    setOpponentAvatar(avatar || null);
    awardedStatusRef.current = null;
    runtime.startMulti();
  }

  function answerQuiz(answer: string) {
    runtime.answerQuiz(answer);
  }

  useEffect(() => {
    if (playMode !== 'multi' || (view !== 'playing' && view !== 'quiz') || !opponentAlive) {
      return;
    }

    const timer = setInterval(() => {
      runtime.addOpponentScore(15);
      if (Math.random() < 0.01) {
        runtime.setOpponentAlive(false);
        setTimeout(() => runtime.finish('win'), 300);
      }
    }, 800);

    return () => clearInterval(timer);
  }, [opponentAlive, playMode, runtime, view]);

  useEffect(() => {
    const statusKey = `${runtime.state.status}:${runtime.state.matchResult}:${runtime.state.score}:${runtime.state.opponentScore}`;
    if (
      (runtime.state.status === 'gameover' || runtime.state.status === 'match_result') &&
      awardedStatusRef.current !== statusKey
    ) {
      const awardedPoints =
        runtime.state.matchResult === 'win'
          ? runtime.state.score + 100
          : runtime.state.score;
      onAddPoints(awardedPoints);
      awardedStatusRef.current = statusKey;
    }
  }, [onAddPoints, runtime.state.matchResult, runtime.state.opponentScore, runtime.state.score, runtime.state.status]);

  return (
    <View style={styles.root}>
      <View style={styles.topHud}>
        <View style={styles.leftHud}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          {livesUsed > 0 && (view === 'playing' || view === 'quiz') ? (
            <View style={styles.lifeRow}>
              <View style={[styles.lifeDot, styles.lifeAvailable, livesUsed >= 1 && styles.lifeUsed]} />
              <View style={[styles.lifeDot, livesUsed >= 2 && styles.lifeUsed]} />
            </View>
          ) : null}
        </View>

        {view !== 'menu' && view !== 'lobby' ? (
          <View style={styles.rightHud}>
            <View style={styles.scoreChip}>
              <Trophy size={14} color="#EAB308" />
              <Text style={styles.scoreChipText}>{Math.max(score, highScore)}</Text>
            </View>

            {playMode === 'multi' && opponentName ? (
              <View style={[styles.opponentChip, opponentAlive ? styles.aliveChip : styles.deadChip]}>
                <View style={styles.opponentAvatarWrap}>
                  {opponentAvatar ? (
                    isSvgAvatar(opponentAvatar) ? (
                      <SvgUri uri={opponentAvatar} width="100%" height="100%" />
                    ) : (
                      <Image source={{ uri: opponentAvatar }} style={styles.opponentAvatarImage} />
                    )
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {opponentName
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.statusDot, opponentAlive ? styles.statusAlive : styles.statusDead]} />
                </View>
                <View>
                  <Text style={styles.opponentStatusText}>{opponentAlive ? 'Alive' : 'Dead'}</Text>
                  <Text style={styles.opponentScoreText}>{opponentScore}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <QuackRenderer renderState={renderState} />

      {effect ? (
        <View
          pointerEvents="none"
          style={[
            styles.effectOverlay,
            effect === 'quiz_flash' && styles.effectQuiz,
            effect === 'victory_flash' && styles.effectVictory,
            effect === 'defeat_flash' && styles.effectDefeat,
            effect === 'score_pulse' && styles.effectScore,
          ]}
        />
      ) : null}

      {view === 'menu' ? (
        <View style={styles.overlay}>
          <View style={styles.menuCard}>
            <Text style={styles.menuIcon}>🐔</Text>
            <View style={styles.menuIconBubble}>
              <Text style={styles.menuIconEmoji}>🐔</Text>
              <Text style={styles.menuIconLabel}>🐔</Text>
            </View>
            <Text style={styles.menuTitle}>Quack!</Text>
            <Text style={styles.menuBody}>Scream to jump! Dodge hazards and survive rescue quizzes.</Text>
            <Pressable onPress={startSingle} style={[styles.primaryButton, styles.menuActionButton]}>
              <View>
                <Text style={styles.primaryButtonText}>Play Alone</Text>
                <Text style={styles.menuActionMeta}>Classic Mode</Text>
              </View>
              <View style={styles.menuActionIcon}>
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                setOpponentName(null);
                setOpponentAvatar(null);
                awardedStatusRef.current = null;
                runtime.openLobby();
              }}
              style={[styles.secondaryButton, styles.menuActionButton, styles.inviteButton]}>
              <View>
                <Text style={styles.primaryButtonText}>Invite Friend</Text>
                <Text style={styles.menuActionMeta}>Multiplayer VS</Text>
              </View>
              <View style={styles.menuActionIcon}>
                <UserPlus size={20} color="#FFFFFF" />
              </View>
            </Pressable>
            <Pressable
              onPress={() => setShowSettings(value => !value)}
              style={styles.settingsToggle}>
              <Settings size={14} color="#FFFFFF" />
              <Text style={styles.settingsToggleText}>Mic Settings</Text>
            </Pressable>
            {showSettings ? (
              <View style={styles.settingsCard}>
                <View style={styles.settingsHeaderRow}>
                  <Text style={styles.settingsMiniLabel}>Sensitivity</Text>
                  <Text style={styles.settingsMiniValue}>{sensitivity}</Text>
                </View>
                <View style={styles.sliderRow}>
                  <Pressable
                    onPress={() => runtime.setSensitivity(Math.max(5, sensitivity - 5))}
                    style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(sensitivity / 50) * 100}%` }]} />
                  </View>
                  <Pressable
                    onPress={() => runtime.setSensitivity(Math.min(50, sensitivity + 5))}
                    style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {view === 'lobby' ? (
        <View style={styles.overlay}>
          <View style={styles.lobbyCard}>
            <View style={styles.lobbyHeader}>
              <Text style={styles.sectionTitle}>Select Opponent</Text>
              <Pressable onPress={() => runtime.returnMenu()} style={styles.lobbyCloseButton}>
                <X size={16} color="#334155" />
              </Pressable>
            </View>
            <View style={styles.searchWrap}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
            </View>
            <ScrollView contentContainerStyle={styles.lobbyList}>
              <Text style={styles.onlineLabel}>Online - Grade 8</Text>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map(player => (
                  <Pressable
                    key={player.id}
                    onPress={() => startMulti(player.name, player.avatar)}
                    style={styles.lobbyRow}>
                    <View style={styles.avatarStub}>
                      {isSvgAvatar(player.avatar) ? (
                        <SvgUri uri={player.avatar} width="100%" height="100%" />
                      ) : (
                        <Image source={{ uri: player.avatar }} style={styles.avatarImage} />
                      )}
                      <View style={styles.avatarOnlineDot} />
                    </View>
                    <View style={styles.lobbyMain}>
                      <Text style={styles.lobbyTitle}>{player.name}</Text>
                      <Text style={styles.lobbyMeta}>{player.rank} pts</Text>
                    </View>
                    <Text style={styles.challengeText}>Challenge</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyLobbyState}>
                  <Text style={styles.emptyLobbyTitle}>No live opponents</Text>
                  <Text style={styles.emptyLobbyBody}>
                    Multiplayer opponents will appear here when live matchmaking is connected.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}

      <QuackBoostControl
        adapter={inputAdapter}
        visible={view === 'playing' || view === 'quiz'}
      />

      {view === 'quiz' && quizState ? (
        <View style={styles.overlay}>
          <View style={styles.quizCard}>
            <View style={styles.quizMeter}>
              <View
                style={[
                  styles.quizMeterFill,
                  { width: `${(quizState.timeLeft / quizState.totalTime) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.quizTag}>
              {livesUsed === 0 ? 'Second Chance' : 'Last Chance'}
            </Text>
            <Text style={styles.quizQuestion}>{quizState.q}</Text>
            <View style={styles.quizOptions}>
              {quizState.options.map(option => (
                <Pressable
                  key={option}
                  onPress={() => answerQuiz(option)}
                  style={styles.quizOption}>
                  <Text style={styles.quizOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.quizTimer}>{quizState.timeLeft.toFixed(1)}s remaining</Text>
            {playMode === 'multi' && opponentName ? (
              <Text style={styles.quizPressureText}>
                Hurry! {opponentName} is still running!
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {view === 'gameover' ? (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultIconEmoji}>🍗</Text>
            <Text style={styles.resultIcon}>🍗</Text>
            <Text style={styles.resultIconAlt}>🍗</Text>
            <Text style={styles.resultTitle}>You got roasted!</Text>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultDetail}>You survived {Math.round(score / 5)} obstacles</Text>
            <Pressable onPress={startSingle} style={styles.primaryButton}>
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {view === 'multi_result' ? (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultIconEmoji}>{matchResult === 'win' ? '🏆' : '💀'}</Text>
            <Text style={styles.resultIcon}>{matchResult === 'win' ? '🏆' : '💀'}</Text>
            <Text style={styles.resultIconAlt}>{matchResult === 'win' ? '🏆' : '💀'}</Text>
            <Text style={styles.resultTitle}>
              {matchResult === 'win' ? 'You Won!' : 'You Lost'}
            </Text>
            <Text style={styles.resultDetail}>
              {matchResult === 'win' ? `${opponentName} hit a fire!` : 'You got roasted!'}
            </Text>
            <Text style={styles.resultSubtle}>
              You {score} - {opponentScore} {opponentName}
            </Text>
            <Pressable
              onPress={() =>
                opponentName ? startMulti(opponentName, opponentAvatar || undefined) : runtime.returnMenu()
              }
              style={styles.primaryButton}>
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Rematch</Text>
            </Pressable>
            <Pressable onPress={() => runtime.returnMenu()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Main Menu</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  topHud: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftHud: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rightHud: { alignItems: 'flex-end', gap: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreChipText: { color: '#0F172A', fontWeight: '800' },
  opponentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  aliveChip: { backgroundColor: 'rgba(220,252,231,0.9)' },
  deadChip: { backgroundColor: 'rgba(254,226,226,0.92)' },
  lifeRow: { flexDirection: 'row', gap: 6 },
  lifeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(226,232,240,0.45)',
  },
  lifeAvailable: { backgroundColor: '#22C55E' },
  lifeUsed: { backgroundColor: '#EF4444' },
  opponentAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  opponentAvatarImage: { width: '100%', height: '100%' },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusAlive: { backgroundColor: '#22C55E' },
  statusDead: { backgroundColor: '#EF4444' },
  opponentStatusText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  opponentScoreText: { color: '#0F172A', fontSize: 14, fontWeight: '900' },
  effectOverlay: {
    ...StyleSheet.absoluteFillObject,
    marginTop: 72,
    marginHorizontal: 18,
    marginBottom: 98,
    borderRadius: 30,
  },
  effectQuiz: { backgroundColor: 'rgba(249,115,22,0.12)' },
  effectVictory: { backgroundColor: 'rgba(34,197,94,0.12)' },
  effectDefeat: { backgroundColor: 'rgba(127,29,29,0.16)' },
  effectScore: { backgroundColor: 'rgba(250,204,21,0.08)' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menuCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 32,
    padding: 24,
    gap: 14,
  },
  menuIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  menuIcon: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  menuIconEmoji: { fontSize: 34 },
  menuIconLabel: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  menuBody: { color: '#CBD5E1', textAlign: 'center', lineHeight: 21 },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  menuActionButton: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    minHeight: 92,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
  menuActionMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  menuActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButtonText: { color: '#0F172A', fontWeight: '800', fontSize: 16 },
  inviteButton: {
    backgroundColor: '#A855F7',
  },
  settingsToggle: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  settingsToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  settingsCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 14,
    gap: 12,
  },
  settingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsMiniLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  settingsMiniValue: { color: '#2563EB', fontSize: 12, fontWeight: '900' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  sliderTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  sliderFill: { height: 10, borderRadius: 999, backgroundColor: '#60A5FA' },
  lobbyCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    gap: 12,
  },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  lobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lobbyCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  lobbyList: { gap: 10, paddingBottom: 8 },
  emptyLobbyState: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyLobbyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyLobbyBody: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  onlineLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  lobbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
  },
  avatarStub: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#DBEAFE',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarOnlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  avatarFallbackText: { color: '#1D4ED8', fontWeight: '800', fontSize: 11 },
  lobbyMain: { flex: 1 },
  lobbyTitle: { color: '#0F172A', fontWeight: '800' },
  lobbyMeta: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  challengeText: { color: '#7C3AED', fontWeight: '800' },
  quizCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    gap: 14,
  },
  quizMeter: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  quizMeterFill: { height: 8, borderRadius: 999, backgroundColor: '#22C55E' },
  quizTag: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quizQuestion: { color: '#0F172A', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  quizOptions: { gap: 10 },
  quizOption: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  quizOptionText: { color: '#0F172A', fontWeight: '800', textAlign: 'center' },
  quizTimer: { color: '#64748B', textAlign: 'center', fontWeight: '700' },
  quizPressureText: {
    color: '#F87171',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  resultIcon: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  resultIconAlt: { fontSize: 1, lineHeight: 1, opacity: 0, color: 'transparent' },
  resultIconEmoji: { fontSize: 58 },
  resultTitle: { color: '#0F172A', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  resultScore: { color: '#F97316', fontSize: 50, fontWeight: '900' },
  resultDetail: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  resultSubtle: { color: '#64748B', fontWeight: '700', textAlign: 'center' },
});
