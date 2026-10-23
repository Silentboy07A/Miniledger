import React, { useState } from 'react';
import {
  Alert,
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
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  User,
  AlertTriangle,
  Receipt,
  FileText,
  AlertCircle,
  Hash,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Loan, RootStackParamList } from '../types';
import { api } from '../services/api';
import {
  formatDate,
  formatINR,
  getFriendInitials,
  getRelativeDueString,
  isLoanOverdue,
} from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetails'>;

export const LoanDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialLoan = route.params.loan;
  const [loan, setLoan] = useState<Loan>(initialLoan);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
  const isRepaid = loan.status === 'REPAID';
  const relative = getRelativeDueString(loan.dueDate, loan.status);
  const initials = getFriendInitials(loan.friendName);

  const handleMarkAsRepaid = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `Confirm that the loan of ${formatINR(loan.amount)} to ${loan.friendName} has been fully repaid?`
        )
      ) {
        executeRepayment();
      }
      return;
    }

    Alert.alert(
      'Confirm Repayment',
      `Are you sure you want to mark the loan of ${formatINR(loan.amount)} to ${loan.friendName} as fully settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Repaid',
          style: 'default',
          onPress: executeRepayment,
        },
      ]
    );
  };

  const executeRepayment = async () => {
    if (repaying) return;

    setError(null);
    setRepaying(true);

    try {
      const updated = await api.repayLoan(loan.id);
      setRepaying(false);

      setLoan((prev) => ({
        ...prev,
        status: 'REPAID',
        repaidAt: updated.repaidAt || new Date().toISOString(),
      }));

      if (Platform.OS === 'web') {
        window.alert(`Loan of ${formatINR(loan.amount)} has been marked as settled!`);
        navigation.goBack();
        return;
      }

      Alert.alert(
        'Repayment Recorded',
        `The loan of ${formatINR(loan.amount)} from ${loan.friendName} has been settled.`,
        [
          {
            text: 'Back to Dashboard',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      setRepaying(false);
      setError(
        err.message || 'Failed to update repayment status. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={COLORS.navy} />
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
      >
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={COLORS.overdue} style={styles.alertIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Hero Card */}
          <Card
            elevated
            style={[
              styles.heroCard,
              isOverdue && styles.heroCardOverdue,
              isRepaid && styles.heroCardRepaid,
            ]}
          >
            <View style={styles.heroTop}>
              <View
                style={[
                  styles.avatarCircle,
                  isOverdue && styles.avatarOverdue,
                  isRepaid && styles.avatarRepaid,
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    isOverdue && styles.avatarInitialsOverdue,
                    isRepaid && styles.avatarInitialsRepaid,
                  ]}
                >
                  {initials}
                </Text>
              </View>

              <View style={styles.heroFriendInfo}>
                <Text style={styles.friendName}>{loan.friendName}</Text>
                <View style={styles.loanIdRow}>
                  <Hash size={12} color={COLORS.textMuted} />
                  <Text style={styles.loanIdText}>ID: {loan.id.slice(0, 8)}</Text>
                </View>
              </View>

              <Badge status={loan.status} isOverdue={isOverdue} size="md" />
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Loan Amount</Text>
              <Text
                style={[
                  styles.amountValue,
                  isRepaid && styles.amountRepaid,
                  isOverdue && styles.amountOverdue,
                ]}
              >
                {formatINR(loan.amount)}
              </Text>
            </View>

            {isOverdue && (
              <View style={styles.overdueCallout}>
                <AlertTriangle
                  size={15}
                  color={COLORS.overdue}
                  style={styles.calloutIcon}
                />
                <Text style={styles.overdueCalloutText}>
                  This loan is {relative.text} (was due on {formatDate(loan.dueDate)}).
                </Text>
              </View>
            )}

            {isRepaid && (
              <View style={styles.repaidCallout}>
                <CheckCircle2
                  size={15}
                  color={COLORS.repaid}
                  style={styles.calloutIcon}
                />
                <Text style={styles.repaidCalloutText}>
                  Loan settled in full
                  {loan.repaidAt ? ` on ${formatDate(loan.repaidAt)}` : ''}.
                </Text>
              </View>
            )}

            {!isRepaid && !isOverdue && (
              <View style={styles.activeCallout}>
                <Clock
                  size={15}
                  color={COLORS.primary}
                  style={styles.calloutIcon}
                />
                <Text style={styles.activeCalloutText}>
                  Active loan — {relative.text} ({formatDate(loan.dueDate)}).
                </Text>
              </View>
            )}
          </Card>

          {/* Breakdown & Timeline Card */}
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Loan Information</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <User size={16} color={COLORS.primary} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Borrower</Text>
                <Text style={styles.detailValue}>{loan.friendName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Calendar size={16} color={COLORS.primary} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Repayment Due Date</Text>
                <Text style={styles.detailValue}>{formatDate(loan.dueDate)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Clock size={16} color={COLORS.primary} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Current Status</Text>
                <Text style={styles.detailValue}>
                  {isRepaid
                    ? 'Settled & Closed'
                    : isOverdue
                    ? 'Overdue — Payment Required'
                    : 'Active — Pending Repayment'}
                </Text>
              </View>
            </View>

            {loan.createdAt && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Receipt size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailTextWrapper}>
                    <Text style={styles.detailLabel}>Date Recorded</Text>
                    <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
                  </View>
                </View>
              </>
            )}

            {loan.repaidAt && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <CheckCircle2 size={16} color={COLORS.repaid} />
                  </View>
                  <View style={styles.detailTextWrapper}>
                    <Text style={styles.detailLabel}>Repayment Timestamp</Text>
                    <Text style={styles.detailValue}>{formatDate(loan.repaidAt)}</Text>
                  </View>
                </View>
              </>
            )}

            {loan.notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <FileText size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailTextWrapper}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailValue}>{loan.notes}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </Card>

          {/* Repay Action Button */}
          {!isRepaid ? (
            <View style={styles.actionContainer}>
              <Button
                title="Mark as Repaid"
                variant="primary"
                size="lg"
                loading={repaying}
                leftIcon={<CheckCircle2 size={18} color={COLORS.white} />}
                onPress={handleMarkAsRepaid}
                style={styles.repayButton}
              />
              <Text style={styles.actionHint}>
                Confirms that {loan.friendName} has settled this balance in full.
              </Text>
            </View>
          ) : (
            <View style={styles.settledContainer}>
              <CheckCircle2 size={20} color={COLORS.repaid} />
              <Text style={styles.settledText}>
                This loan has been fully settled and closed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  desktopHeaderInner: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '700',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  desktopScrollContent: {
    padding: SPACING.xxxl,
    paddingBottom: SPACING.xxxl * 2,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 600,
  },
  desktopContainer: {
    maxWidth: 600,
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
  heroCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.lg,
  },
  heroCardOverdue: {
    borderColor: COLORS.overdueBorder,
  },
  heroCardRepaid: {
    borderColor: COLORS.repaidBorder,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarOverdue: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
  },
  avatarRepaid: {
    backgroundColor: COLORS.repaidBg,
    borderColor: COLORS.repaidBorder,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  avatarInitialsOverdue: {
    color: COLORS.overdue,
  },
  avatarInitialsRepaid: {
    color: COLORS.repaid,
  },
  heroFriendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },
  loanIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  loanIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginLeft: 2,
  },
  amountBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 4,
    letterSpacing: -0.8,
  },
  amountRepaid: {
    color: COLORS.repaid,
  },
  amountOverdue: {
    color: COLORS.overdue,
  },
  overdueCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overdueBg,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.overdueBorder,
  },
  repaidCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.repaidBg,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.repaidBorder,
  },
  activeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  calloutIcon: {
    marginRight: SPACING.sm,
  },
  overdueCalloutText: {
    fontSize: 12,
    color: COLORS.overdue,
    fontWeight: '600',
    flex: 1,
  },
  repaidCalloutText: {
    fontSize: 12,
    color: COLORS.repaid,
    fontWeight: '600',
    flex: 1,
  },
  activeCalloutText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  detailsCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.md,
    letterSpacing: -0.2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  actionContainer: {
    marginBottom: SPACING.xl,
  },
  repayButton: {
    ...SHADOWS.raised,
  },
  actionHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  settledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.repaidBg,
    borderWidth: 1,
    borderColor: COLORS.repaidBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 8,
  },
  settledText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.repaid,
  },
});
