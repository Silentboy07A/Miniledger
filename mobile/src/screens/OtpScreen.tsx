import React, { useEffect, useState, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Smartphone,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { maskPhoneNumber } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

const RESEND_COOLDOWN_SECONDS = 30;

export const OtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<any>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus input automatically
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleVerify = async () => {
    setError(null);
    setResendSuccess(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.verifyOtp(phone, trimmedOtp);
      setLoading(false);

      if (response && response.token) {
        await login(response.token, phone);
      } else {
        setError(response?.message || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(
        err.message || 'Invalid or expired code. Check the backend terminal.'
      );
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setError(null);
    setResendSuccess(null);
    setResending(true);

    try {
      await api.sendOtp(phone);
      setResending(false);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      setResendSuccess('New verification code sent! Check backend terminal.');
      inputRef.current?.focus();
    } catch (err: any) {
      setResending(false);
      setError(err.message || 'Failed to resend verification code');
    }
  };

  // Render individual digit boxes
  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const digit = otp[i] || '';
      const isFocused = otp.length === i;
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            digit ? styles.otpBoxFilled : null,
            isFocused ? styles.otpBoxFocused : null,
            error ? styles.otpBoxError : null,
          ]}
        >
          <Text style={styles.otpDigit}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Centered Compact Wrapper */}
          <View style={styles.container}>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color={COLORS.navy} />
              <Text style={styles.backButtonText}>Change mobile number</Text>
            </TouchableOpacity>

            <Card elevated style={styles.card}>
              <View style={styles.headerIconContainer}>
                <View style={styles.iconCircle}>
                  <Smartphone size={24} color={COLORS.primary} />
                </View>
              </View>

              <Text style={styles.title}>Verification Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{' '}
                <Text style={styles.phoneHighlight}>{maskPhoneNumber(phone)}</Text>
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={COLORS.overdue} style={styles.alertIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {resendSuccess && (
                <View style={styles.successBox}>
                  <CheckCircle2 size={16} color={COLORS.repaid} style={styles.alertIcon} />
                  <Text style={styles.successText}>{resendSuccess}</Text>
                </View>
              )}

              {/* Visual OTP Boxes */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.otpBoxesContainer}
              >
                {renderOtpBoxes()}
              </TouchableOpacity>

              {/* Hidden native TextInput for robust cross-platform input & paste */}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtp(numeric);
                  if (error) setError(null);
                  if (resendSuccess) setResendSuccess(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenInput}
                autoFocus
                caretHidden
              />

              <Button
                title="Verify & Continue"
                size="lg"
                loading={loading}
                disabled={otp.length !== 6}
                onPress={handleVerify}
                rightIcon={<CheckCircle2 size={18} color={COLORS.white} />}
                style={styles.verifyButton}
              />

              {/* Resend Actions */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendQuestion}>Didn't receive code?</Text>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Request new code in{' '}
                    <Text style={styles.countdownNumber}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    style={styles.resendButton}
                    activeOpacity={0.7}
                  >
                    <RefreshCw
                      size={13}
                      color={COLORS.primary}
                      style={styles.resendIcon}
                    />
                    <Text style={styles.resendButtonText}>
                      {resending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Dev notice */}
              <View style={styles.devNotice}>
                <ShieldCheck size={14} color={COLORS.primary} style={styles.devIcon} />
                <Text style={styles.devText}>
                  Mock OTP: Check the terminal where backend is running to view the generated 6-digit code.
                </Text>
              </View>
            </Card>

            <Text style={styles.footerNote}>
              MiniLedger • Secure OTP verification
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  desktopScrollContent: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.huge,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 440,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: SPACING.xs,
  },
  card: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.xxl,
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: COLORS.navy,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.repaidBg,
    borderColor: COLORS.repaidBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  successText: {
    flex: 1,
    color: COLORS.repaid,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.backgroundSecondary,
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  otpBoxError: {
    borderColor: COLORS.overdue,
    backgroundColor: COLORS.overdueBg,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  verifyButton: {
    marginBottom: SPACING.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  resendQuestion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  countdownNumber: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  resendIcon: {
    marginRight: 4,
  },
  resendButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  devIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  devText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    paddingTop: SPACING.lg,
  },
});
