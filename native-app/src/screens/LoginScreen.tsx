import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';

import { requestPasswordReset } from '../services/authService';
import { PRIVACY_POLICY_SECTIONS, TERMS_OF_USE_SECTIONS } from '../content/legal';

interface LoginScreenProps {
  mode: 'login' | 'signup';
  email: string;
  password: string;
  fullName: string;
  signupRole: 'student' | 'teacher';
  error?: string | null;
  isSubmitting: boolean;
  onModeChange: (mode: 'login' | 'signup') => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onSignupRoleChange: (role: 'student' | 'teacher') => void;
  onSubmit: () => void;
}

type LegalSheet = 'terms' | 'privacy' | null;

const logoAsset = require('../assets/logo.png');

export function LoginScreen({
  mode,
  email,
  password,
  fullName,
  signupRole,
  error,
  isSubmitting,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onSignupRoleChange,
  onSubmit,
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeSheet, setActiveSheet] = useState<LegalSheet>(null);
  const [forgotEmail, setForgotEmail] = useState(email);
  const [forgotState, setForgotState] = useState<{
    open: boolean;
    isSubmitting: boolean;
    message: string | null;
    error: string | null;
  }>({
    open: false,
    isSubmitting: false,
    message: null,
    error: null,
  });

  const title = mode === 'login' ? 'Welcome back' : 'Create account';
  const submitLabel = mode === 'login' ? 'Sign in' : 'Create account';
  const roleOptions = ['student', 'teacher'] as const;
  const legalContent = useMemo(
    () =>
      activeSheet === 'terms'
        ? {
            title: 'Terms of Service',
            icon: <FileText color="#FFFFFF" size={18} strokeWidth={2.3} />,
            sections: TERMS_OF_USE_SECTIONS,
          }
        : activeSheet === 'privacy'
          ? {
              title: 'Privacy Policy',
              icon: <ShieldCheck color="#FFFFFF" size={18} strokeWidth={2.3} />,
              sections: PRIVACY_POLICY_SECTIONS,
            }
          : null,
    [activeSheet],
  );

  async function handleForgotPassword() {
    const normalizedEmail = forgotEmail.trim();
    if (!normalizedEmail) {
      setForgotState(current => ({
        ...current,
        error: 'Enter your email first.',
        message: null,
      }));
      return;
    }

    setForgotState(current => ({
      ...current,
      isSubmitting: true,
      error: null,
      message: null,
    }));

    try {
      const response = await requestPasswordReset(normalizedEmail);
      setForgotState(current => ({
        ...current,
        isSubmitting: false,
        message: response.message,
        error: null,
      }));
    } catch (forgotError) {
      setForgotState(current => ({
        ...current,
        isSubmitting: false,
        error:
          forgotError instanceof Error
            ? forgotError.message
            : 'Could not submit reset request.',
        message: null,
      }));
    }
  }

  function openForgotPassword() {
    setForgotEmail(email);
    setForgotState({
      open: true,
      isSubmitting: false,
      message: null,
      error: null,
    });
  }

  return (
    <LinearGradient
      colors={['#0b1c32', '#15385f', '#2b557f', '#6b3fd8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardWrap}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(59,130,246,0.34)', 'rgba(139,92,246,0.24)']}
            style={styles.heroStrip}>
            <View style={styles.brandPill}>
              <Image source={logoAsset} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandPillText}>KITABU AI</Text>
            </View>

            {mode === 'signup' ? (
              <View>
                <Text style={styles.fieldLabelCentered}>Role</Text>
                <View style={styles.roleRow}>
                  {roleOptions.map(role => {
                    const isActive = signupRole === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => onSignupRoleChange(role)}
                        style={[styles.roleChip, isActive && styles.roleChipActive]}>
                        <Text
                          style={[
                            styles.roleChipText,
                            isActive && styles.roleChipTextActive,
                          ]}>
                          {role === 'student' ? 'Student' : 'Teacher'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Text style={styles.title}>{title}</Text>
          </LinearGradient>

          <View style={styles.form}>
            {mode === 'signup' ? (
              <FieldShell label="Full Name" icon={<User color="#8B5CF6" size={16} />}>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={onFullNameChange}
                  placeholder="Full name"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={fullName}
                />
              </FieldShell>
            ) : null}

            <FieldShell label="Email" icon={<Mail color="#0F766E" size={16} />}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={onEmailChange}
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={email}
              />
            </FieldShell>

            <FieldShell label="Password" icon={<Lock color="#1D4ED8" size={16} />}>
              <View style={styles.passwordRow}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={onPasswordChange}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  onPress={() => setShowPassword(value => !value)}
                  style={styles.visibilityButton}>
                  {showPassword ? (
                    <EyeOff color="#64748B" size={18} strokeWidth={2.2} />
                  ) : (
                    <Eye color="#64748B" size={18} strokeWidth={2.2} />
                  )}
                </Pressable>
              </View>
            </FieldShell>

            {mode === 'login' ? (
              <Pressable onPress={openForgotPassword} style={styles.textLinkWrap}>
                <Text style={styles.textLink}>Forgot password?</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isSubmitting && styles.submitButtonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.modePromptRow}>
              <Text style={styles.modePromptText}>
                {mode === 'login' ? "Don't Have an Account yet? " : 'Already have an account? '}
              </Text>
              <Pressable onPress={() => onModeChange(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.modePromptLink}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.legalRow}>
              <Pressable onPress={() => setActiveSheet('terms')}>
                <Text style={styles.footerLink}>Terms</Text>
              </Pressable>
              <Text style={styles.footerDivider}>•</Text>
              <Pressable onPress={() => setActiveSheet('privacy')}>
                <Text style={styles.footerLink}>Privacy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <GlassSheet
        open={activeSheet !== null}
        title={legalContent?.title || ''}
        icon={legalContent?.icon || null}
        onClose={() => setActiveSheet(null)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {(legalContent?.sections || []).map(section => (
            <View key={section.heading} style={styles.sheetSection}>
              <Text style={styles.sheetHeading}>{section.heading}</Text>
              {section.paragraphs.map(paragraph => (
                <Text key={paragraph} style={styles.sheetCopy}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </GlassSheet>

      <GlassSheet
        open={forgotState.open}
        title="Forgot Password"
        icon={<Lock color="#FFFFFF" size={18} strokeWidth={2.3} />}
        onClose={() =>
          setForgotState({
            open: false,
            isSubmitting: false,
            message: null,
            error: null,
          })
        }>
        <View style={styles.sheetForm}>
          <Text style={styles.sheetLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setForgotEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            style={styles.sheetInput}
            value={forgotEmail}
          />

          {forgotState.error ? <Text style={styles.errorText}>{forgotState.error}</Text> : null}
          {forgotState.message ? (
            <Text style={styles.successText}>{forgotState.message}</Text>
          ) : null}

          <Pressable
            disabled={forgotState.isSubmitting}
            onPress={handleForgotPassword}
            style={({ pressed }) => [
              styles.sheetPrimaryButton,
              pressed && styles.submitButtonPressed,
              forgotState.isSubmitting && styles.submitButtonDisabled,
            ]}>
            {forgotState.isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sheetPrimaryButtonText}>Request reset</Text>
            )}
          </Pressable>
        </View>
      </GlassSheet>
    </LinearGradient>
  );
}

function FieldShell({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldShell}>
        <View style={styles.fieldIcon}>{icon}</View>
        <View style={styles.fieldBody}>{children}</View>
      </View>
    </View>
  );
}

function GlassSheet({
  open,
  title,
  icon,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={open} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <LinearGradient
            colors={['rgba(59,130,246,0.34)', 'rgba(139,92,246,0.28)']}
            style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalBadge}>{icon}</View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} style={styles.modalCloseButton}>
                <X color="#FFFFFF" size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
          </LinearGradient>
          <View style={styles.modalBody}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgOrbTop: {
    position: 'absolute',
    top: 70,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: 40,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  heroStrip: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 16,
  },
  brandPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  brandPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  fieldLabelCentered: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
  },
  fieldLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    minHeight: 58,
    paddingHorizontal: 14,
    gap: 12,
  },
  fieldIcon: {
    width: 24,
    alignItems: 'center',
  },
  fieldBody: {
    flex: 1,
  },
  input: {
    color: '#0F172A',
    fontSize: 16,
    paddingVertical: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    paddingVertical: 14,
  },
  visibilityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  roleChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    paddingVertical: 12,
  },
  roleChipActive: {
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  roleChipText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#0F172A',
  },
  textLinkWrap: {
    alignSelf: 'flex-end',
  },
  textLink: {
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  successText: {
    color: '#BBF7D0',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 10,
  },
  modePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  modePromptText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  modePromptLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footerLink: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  footerDivider: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  modalBody: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 18,
    gap: 14,
  },
  sheetSection: {
    marginBottom: 18,
    gap: 8,
  },
  sheetHeading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  sheetCopy: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  sheetForm: {
    gap: 14,
  },
  sheetLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sheetInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sheetPrimaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
