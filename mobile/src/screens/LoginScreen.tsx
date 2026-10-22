import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import { ArrowRight, ShieldCheck, Wallet, Settings } from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Phone number validation schema with Zod
const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getApiBaseUrl());

  const handleSendOtp = async () => {
    setError(null);
    setServerError(null);

    // Validate using Zod
    const validation = phoneSchema.safeParse({ phone });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid phone number');
      return;
    }

    setLoading(true);
    const fullPhone = `+91${phone.trim()}`;

    try {
      const response = await api.sendOtp(fullPhone);
      setLoading(false);

      // Successfully initiated OTP flow
      navigation.navigate('OtpVerify', { phone: fullPhone });
    } catch (err: any) {
      setLoading(false);
      setServerError(
        err.message || 'Failed to send OTP. Please ensure the backend is running.'
      );
    }
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(customApiUrl);
    setShowConfig(false);
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
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Wallet size={32} color={COLORS.white} />
            </View>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.tagline}>Your money, clearly tracked.</Text>
            <Text style={styles.subtext}>
              Keep seamless tabs on money lent to friends, track timely repayments,
              and avoid overdue balances.
            </Text>
          </View>

          {/* Form Card */}
          <Card elevated style={styles.card}>
            <Text style={styles.cardTitle}>Sign in to your ledger</Text>
            <Text style={styles.cardSubtitle}>
              We will send a 6-digit verification code to your phone number.
            </Text>

            {serverError && (
              <View style={styles.serverErrorBox}>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <Input
              label="Phone Number"
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setPhone(cleaned);
                if (error) setError(null);
                if (serverError) setServerError(null);
              }}
              prefix={
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
              }
              error={error || undefined}
              helperText="Indian mobile numbers (+91)"
            />

            <Button
              title="Send Verification Code"
              size="lg"
              loading={loading}
              onPress={handleSendOtp}
              rightIcon={<ArrowRight size={18} color={COLORS.white} />}
              style={styles.sendButton}
            />

            {/* Mock OTP Explanation Banner */}
            <View style={styles.mockOtpNotice}>
              <View style={styles.mockOtpHeader}>
                <ShieldCheck size={16} color={COLORS.primary} style={styles.noticeIcon} />
                <Text style={styles.mockOtpTitle}>Mock OTP Verification</Text>
              </View>
              <Text style={styles.mockOtpDescription}>
                MiniLedger runs in assignment development mode. When you press Send, the
                OTP is generated and printed in your backend server logs.
              </Text>
            </View>
          </Card>

          {/* Server Settings Toggle */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              onPress={() => setShowConfig(!showConfig)}
              style={styles.settingsToggle}
            >
              <Settings size={14} color={COLORS.textSecondary} />
              <Text style={styles.settingsToggleText}>
                {showConfig ? 'Hide Server Configuration' : 'Server Configuration'}
              </Text>
            </TouchableOpacity>

            {showConfig && (
              <View style={styles.configBox}>
                <Input
                  label="API Server URL"
                  value={customApiUrl}
                  onChangeText={setCustomApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  helperText="Default: 10.0.2.2:3000 (Android) or localhost:3000 (iOS)"
                />
                <Button
                  title="Apply API URL"
                  variant="outline"
                  size="sm"
                  onPress={handleSaveApiUrl}
                />
              </View>
            )}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },
  card: {
    padding: SPACING.xl,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  countryCode: {
    paddingRight: SPACING.sm,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sendButton: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  serverErrorBox: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  serverErrorText: {
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  mockOtpNotice: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  mockOtpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeIcon: {
    marginRight: 6,
  },
  mockOtpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  mockOtpDescription: {
    fontSize: 12,
    color: COLORS.navy,
    lineHeight: 17,
  },
  settingsSection: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  settingsToggleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  configBox: {
    width: '100%',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
});
