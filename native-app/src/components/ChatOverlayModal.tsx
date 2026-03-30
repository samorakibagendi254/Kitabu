import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  FileText,
  Mic,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react-native';

import { Attachment, ChatMessage } from '../types/app';
import { LiveAudioTutorScreen } from '../screens/LiveAudioTutorScreen';

const logoAsset = require('../assets/logo.png');

interface ChatOverlayModalProps {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  startLiveAudio?: boolean;
  onClose: () => void;
  onSendMessage: (message: string, attachment?: Attachment) => void;
  onStartLiveAudio?: () => void;
  onCloseLiveAudio?: () => void;
  onOpenLiveScreen?: () => void;
}

const WELCOME_SUBJECTS = [
  {
    label: 'Social Studies',
    color: '#F97316',
    query: 'I need help with Social Studies',
  },
  {
    label: 'English',
    color: '#22C55E',
    query: 'I need help with English',
  },
  {
    label: 'Mathematics',
    color: '#2563EB',
    query: 'I need help with Mathematics',
  },
  {
    label: 'Science',
    color: '#7C3AED',
    query: 'I need help with Science',
  },
];

export function ChatOverlayModal({
  isOpen,
  isLoading,
  messages,
  startLiveAudio,
  onClose,
  onSendMessage,
  onStartLiveAudio,
  onCloseLiveAudio,
  onOpenLiveScreen,
}: ChatOverlayModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const isWelcomeView = messages.length === 0;

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [isLoading, isOpen, messages]);

  function handleSubmit() {
    if (!input.trim() || isLoading) {
      return;
    }

    onSendMessage(input.trim());
    setInput('');
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isOpen}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {startLiveAudio ? (
            <View style={styles.liveAudioLayer}>
              <LiveAudioTutorScreen onClose={onCloseLiveAudio || onClose} />
            </View>
          ) : null}

          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <View style={styles.headerIconWrap}>
                <Image source={logoAsset} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.headerTitle}>KITABU AI TUTOR</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <X color="rgba(255,255,255,0.8)" size={22} strokeWidth={2.3} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isWelcomeView ? (
              <View style={styles.welcomeWrap}>
                <View style={styles.welcomeCopy}>
                  <Text style={styles.welcomeTitle}>Hi Student! 👋</Text>
                  <Text style={styles.welcomeBody}>
                    I&apos;m Kitabu, your AI learning companion.
                  </Text>
                  <Text style={styles.welcomeBody}>
                    What subject would you like to explore today?
                  </Text>
                </View>

                <View style={styles.subjectPromptGrid}>
                  {WELCOME_SUBJECTS.map(item => (
                    <Pressable
                      key={item.label}
                      onPress={() => onSendMessage(item.query)}
                      style={[styles.subjectPromptButton, { backgroundColor: item.color }]}>
                      <Text style={styles.subjectPromptText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.poweredWrap}>
                  <Sparkles color="rgba(255,255,255,0.4)" size={14} strokeWidth={2.4} />
                  <Text style={styles.poweredText}>AI-Powered Learning</Text>
                </View>
              </View>
            ) : (
              <View style={styles.messageList}>
                {messages.map((message, index) => (
                  <View
                    key={`${message.role}-${index}-${message.text}`}
                    style={[
                      styles.messageRow,
                      message.role === 'user'
                        ? styles.messageRowUser
                        : styles.messageRowModel,
                    ]}>
                    {message.attachment ? (
                      <View
                        style={[
                          styles.attachmentCard,
                          message.role === 'user'
                            ? styles.attachmentCardUser
                            : styles.attachmentCardModel,
                        ]}>
                        <FileText color="#FFFFFF" size={18} strokeWidth={2.2} />
                        <Text style={styles.attachmentLabel}>
                          {message.attachment.name || 'File'}
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.messageBubble,
                        message.role === 'user'
                          ? styles.messageBubbleUser
                          : styles.messageBubbleModel,
                      ]}>
                      <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                  </View>
                ))}

                {isLoading ? (
                  <View style={styles.messageRowModel}>
                    <View style={styles.loadingBubble}>
                      <View style={[styles.loadingDot, styles.loadingDotOne]} />
                      <View style={[styles.loadingDot, styles.loadingDotTwo]} />
                      <View style={[styles.loadingDot, styles.loadingDotThree]} />
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <View style={styles.inputShell}>
              <Pressable style={styles.inputPlusButton}>
                <Plus color="rgba(255,255,255,0.9)" size={18} strokeWidth={2.4} />
              </Pressable>

              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                placeholder={isWelcomeView ? 'Ask me anything...' : 'Type your question...'}
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="send"
                style={styles.input}
              />
            </View>

            {input.trim() ? (
              <Pressable onPress={handleSubmit} style={styles.primaryActionButton}>
                <Send color="#FFFFFF" size={20} strokeWidth={2.4} />
              </Pressable>
            ) : (
              <Pressable
                onPress={onStartLiveAudio || onOpenLiveScreen}
                style={styles.liveActionButton}>
                <Mic color="#FFFFFF" size={20} strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  liveAudioLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerLogo: {
    height: 24,
    width: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  onlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    backgroundColor: '#22C55E',
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  onlineText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  closeButton: {
    borderRadius: 999,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  welcomeWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  welcomeCopy: {
    marginBottom: 24,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  welcomeBody: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
  },
  subjectPromptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  subjectPromptButton: {
    borderRadius: 18,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '48%',
  },
  subjectPromptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  poweredWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 16,
  },
  poweredText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  messageList: {
    gap: 14,
    padding: 16,
  },
  messageRow: {
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowModel: {
    alignSelf: 'flex-start',
  },
  attachmentCard: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentCardUser: {
    backgroundColor: 'rgba(37,99,235,0.52)',
  },
  attachmentCardModel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  attachmentLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageBubbleUser: {
    backgroundColor: '#2563EB',
    borderTopRightRadius: 6,
  },
  messageBubbleModel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 6,
    borderWidth: 1,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
  },
  loadingBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  loadingDot: {
    backgroundColor: '#60A5FA',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  loadingDotOne: {
    opacity: 0.5,
  },
  loadingDotTwo: {
    opacity: 0.7,
  },
  loadingDotThree: {
    opacity: 1,
  },
  inputBar: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
  },
  inputPlusButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  input: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    paddingRight: 16,
    paddingVertical: 14,
  },
  primaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  liveActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.9)',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});
