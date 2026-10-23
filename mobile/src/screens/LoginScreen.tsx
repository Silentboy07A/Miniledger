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
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Settings,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6-9'),
});

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getApiBaseUrl());

  const handleSendOtp = async () => {
    setError(null);
    setServerError(null);

    const validation = phoneSchema.safeParse({ phone });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid phone number');
      return;
    }

    setLoading(true);

    const fullPhone = `+91${phone.trim()}`;

    try {
      await api.sendOtp(fullPhone);
      navigation.navigate('OtpVerify', { phone: fullPhone });
    } catch (err: any) {
      setServerError(
        err?.message ||
          'Failed to connect to backend server. Make sure the backend is running at http://localhost:3000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = () => {
    const url = customApiUrl.trim().replace(/\/+$/, '');

    if (!/^https?:\/\/.+/i.test(url)) {
      setServerError('Enter a valid API URL starting with http:// or https://');
      return;
    }

    setApiBaseUrl(url);
    setCustomApiUrl(url);
    setShowConfig(false);
    setServerError(null);
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
          <View
            style={[
              styles.container,
              isDesktop && styles.desktopContainer,
            ]}
          >
            {/* Left Hero / Brand Introduction */}
            <View
              style={[
                styles.brandSection,
                isDesktop && styles.desktopBrandSection,
              ]}
            >
              <View style={styles.logoBadge}>
                <Wallet size={28} color={COLORS.white} strokeWidth={2.2} />
              </View>

              <Text style={styles.brandTitle}>MiniLedger</Text>
              <Text style={styles.tagline}>
                Personal lending, simplified and clear.
              </Text>
              <Text style={styles.subtext}>
                Track loans lent to friends, manage repayment due dates, and monitor overdue
                balances with confidence.
              </Text>

              {isDesktop && (
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIconBox}>
                      <Users size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Track Friends & Balances</Text>
                      <Text style={styles.featureDesc}>
                        Keep an organized record of who borrowed how much and when.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconBox}>
                      <Clock size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Due Date Vigilance</Text>
                      <Text style={styles.featureDesc}>
                        Automatic overdue detection keeps timelines accountable.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconBox}>
                      <CheckCircle2 size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>One-Tap Settlement</Text>
                      <Text style={styles.featureDesc}>
                        Mark loans as settled and watch your repaid metrics update instantly.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Right Login Card */}
            <View
              style={[
                styles.formSection,
                isDesktop && styles.desktopFormSection,
              ]}
            >
              <Card elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.eyebrowContainer}>
                    <View style={styles.eyebrowDot} />
                    <Text style={styles.eyebrowText}>MINILEDGER SECURE LOGIN</Text>
                  </View>
                  <Text style={styles.cardTitle}>Sign in to your ledger</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your 10-digit mobile number. We'll send a 6-digit verification code.
                  </Text>
                </View>

                {serverError && (
                  <View style={styles.serverErrorBox}>
                    <AlertCircle size={16} color={COLORS.overdue} style={styles.alertIcon} />
                    <Text style={styles.serverErrorText}>{serverError}</Text>
                  </View>
                )}

                <Input
                  label="Mobile Number"
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
                    if (error) setError(null);
                    if (serverError) setServerError(null);
                  }}
                  prefix={
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryFlag}>IN</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                  }
                  error={error || undefined}
                  helperText="Enter 10-digit Indian phone number"
                />

                <Button
                  title="Send Verification Code"
                  size="lg"
                  loading={loading}
                  onPress={handleSendOtp}
                  rightIcon={<ArrowRight size={18} color={COLORS.white} />}
                  style={styles.sendButton}
                />

                <View style={styles.devNoticeCard}>
                  <View style={styles.devNoticeHeader}>
                    <ShieldCheck size={16} color={COLORS.primary} />
                    <Text style={styles.devNoticeTitle}>Development Demonstration</Text>
                  </View>
                  <Text style={styles.devNoticeText}>
                    Mock OTP verification enabled. After clicking Send, check your backend
                    terminal/console for the 6-digit code.
                  </Text>
                </View>
              </Card>

              {/* Server settings toggle for development flexibility */}
              <TouchableOpacity
                onPress={() => setShowConfig((curr) => !curr)}
                style={styles.configToggle}
                activeOpacity={0.7}
              >
                <Settings size={13} color={COLORS.textSecondary} />
                <Text style={styles.configToggleText}>
                  {showConfig ? 'Hide API settings' : 'Configure API endpoint'}
                </Text>
              </TouchableOpacity>

              {showConfig && (
                <Card style={styles.configCard}>
                  <Input
                    label="Backend API Base URL"
                    value={customApiUrl}
                    onChangeText={setCustomApiUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    helperText="Default: http://localhost:3000 (or 10.0.2.2 for Android emulator)"
                  />
                  <Button
                    title="Apply Endpoint"
                    variant="outline"
                    size="sm"
                    onPress={handleSaveApiUrl}
                  />
                </Card>
              )}

              <Text style={styles.footerNote}>
                MiniLedger • Secure personal loan tracking
              </Text>
            </View>
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
  desktopContainer: {
    maxWidth: 960,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 56,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  desktopBrandSection: {
    flex: 1,
    alignItems: 'flex-start',
    marginBottom: 0,
    paddingRight: SPACING.xl,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.raised,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 380,
  },
  featureList: {
    marginTop: SPACING.xxl,
    gap: SPACING.lg,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  formSection: {
    width: '100%',
  },
  desktopFormSection: {
    width: 440,
    flexShrink: 0,
  },
  card: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.xxl,
  },
  cardHeader: {
    marginBottom: SPACING.lg,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.primary,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  serverErrorText: {
    flex: 1,
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  countryFlag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sendButton: {
    marginTop: 6,
    marginBottom: SPACING.lg,
  },
  devNoticeCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  devNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  devNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  devNoticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  configToggleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  configCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    paddingTop: 4,
  },
});
