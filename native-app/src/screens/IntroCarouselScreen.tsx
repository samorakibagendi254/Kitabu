import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const portraitDesk = require('../assets/intro-study-desk.jpg');
const portraitSisters = require('../assets/intro-sisters-study.jpg');
const portraitLaptop = require('../assets/intro-laptop-study.jpg');
const portraitWriting = require('../assets/intro-girl-writing.jpg');

const SLIDES = [
  {
    image: portraitDesk,
    eyebrow: 'Ask anytime',
    title: 'Your tutor shows up when homework gets quiet.',
    body: 'Open Kitabu, ask the question, and keep the evening moving.',
  },
  {
    image: portraitSisters,
    eyebrow: 'Learn together',
    title: 'Revision feels lighter when progress is shared.',
    body: 'Homework, quizzes, and guided help in one place for school and home.',
  },
  {
    image: portraitLaptop,
    eyebrow: 'Built for focus',
    title: 'From curriculum reading to quick quiz checks, without app sprawl.',
    body: 'Lessons, books, and practice stay connected to the same learning path.',
  },
  {
    image: portraitWriting,
    eyebrow: 'Made for momentum',
    title: 'Rewards, games, and steady wins keep learners coming back.',
    body: 'Study first, play a little, and build a habit that sticks.',
  },
] as const;

interface IntroCarouselScreenProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export function IntroCarouselScreen({
  onSignIn,
  onCreateAccount,
}: IntroCarouselScreenProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;
  const ctaLabel = isLast ? 'Create account' : 'Next';

  const progress = useMemo(
    () => SLIDES.map((_, index) => index <= activeIndex),
    [activeIndex],
  );

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(SLIDES.length - 1, nextIndex)));
  }

  function handlePrimaryAction() {
    if (isLast) {
      onCreateAccount();
      return;
    }

    const nextIndex = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setActiveIndex(nextIndex);
  }

  return (
    <LinearGradient
      colors={['#04192d', '#10375f', '#1d5c4b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.brandPill}>
          <Text style={styles.brandText}>KITABU AI</Text>
        </View>
        <Pressable onPress={onSignIn} style={styles.signInButton}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.carousel}>
        {SLIDES.map(slide => (
          <View key={slide.title} style={styles.slide}>
            <View style={styles.card}>
              <View style={styles.imageWrap}>
                <View style={styles.imageHalo} />
                <Image source={slide.image} style={styles.image} resizeMode="contain" />
              </View>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressRow}>
          {progress.map((isActive, index) => (
            <View
              key={SLIDES[index].title}
              style={[styles.progressDot, isActive && styles.progressDotActive]}
            />
          ))}
        </View>

        <Pressable onPress={handlePrimaryAction} style={styles.primaryButton}>
          <Text style={styles.primaryText}>{ctaLabel}</Text>
        </Pressable>

        <Text style={styles.helperText}>
          Short lessons. Quick wins. A little fun every day.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 18,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signInText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    width,
  },
  card: {
    backgroundColor: 'rgba(4, 12, 24, 0.22)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 34,
    borderWidth: 1,
    minHeight: 560,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 30,
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    marginBottom: 22,
    position: 'relative',
  },
  imageHalo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  eyebrow: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 37,
  },
  body: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  footer: {
    gap: 14,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  progressDot: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    height: 8,
    width: 18,
  },
  progressDotActive: {
    backgroundColor: '#fde68a',
    width: 34,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 58,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  helperText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    textAlign: 'center',
  },
});
