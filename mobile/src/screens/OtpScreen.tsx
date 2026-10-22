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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { maskPhoneNumber } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

const RESEND_COOLDOWN_SECONDS = 30;

export const OtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    }, 400);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleVerify = async () => {
    setError(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.verifyOtp(phone, trimmedOtp);
      setLoading(false);

      if (response && response.token) {
        // Securely store token and update context
        await login(response.token, phone);
        // AuthProvider state change will seamlessly switch to Dashboard
      } else {
        setError(response?.message || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(
        err.message || 'Verification failed. Please ensure the code is correct.'
      );
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setError(null);
    setResending(true);

    try {
      await api.sendOtp(phone);
      setResending(false);
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Navigation Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={COLORS.navy} />
            <Text style={styles.backButtonText}>Change number</Text>
          </TouchableOpacity>

          <Card elevated style={styles.card}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}
              <Text style={styles.phoneHighlight}>{maskPhoneNumber(phone)}</Text>
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
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

            {/* Hidden native TextInput for robust keyboard integration */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(numeric);
                if (error) setError(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              caretHidden
            />

            <Button
              title="Verify & Continue"
              size="lg"
              loading={loading}
              disabled={otp.length !== 6}
              onPress={handleVerify}
              rightIcon={<CheckCircle size={18} color={COLORS.white} />}
              style={styles.verifyButton}
            />

            {/* Resend actions */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendQuestion}>Didn&apos;t receive code?</Text>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend code in <Text style={styles.countdownNumber}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  style={styles.resendButton}
                >
                  <RefreshCw size={14} color={COLORS.primary} style={styles.resendIcon} />
                  <Text style={styles.resendButtonText}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginLeft: SPACING.xs,
  },
  card: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorBox: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '500',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.background,
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  otpBoxError: {
    borderColor: COLORS.overdue,
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '700',
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
    marginTop: SPACING.xs,
  },
  resendQuestion: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
