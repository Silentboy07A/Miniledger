import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  User,
  AlertTriangle,
  Receipt,
  FileText,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Loan, RootStackParamList } from '../types';
import { api } from '../services/api';
import { formatDate, formatINR, isLoanOverdue } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetails'>;

export const LoanDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialLoan = route.params.loan;
  const [loan, setLoan] = useState<Loan>(initialLoan);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
  const isRepaid = loan.status === 'REPAID';

  const handleMarkAsRepaid = () => {
    Alert.alert(
      'Confirm Repayment',
      `Are you sure you want to mark the loan of ${formatINR(loan.amount)} to ${loan.friendName} as fully repaid?`,
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

      // Successfully confirmed by backend
      setLoan((prev) => ({
        ...prev,
        status: 'REPAID',
        repaidAt: updated.repaidAt || new Date().toISOString(),
      }));

      Alert.alert(
        'Repayment Recorded',
        `The loan of ${formatINR(loan.amount)} from ${loan.friendName} has been settled.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      setRepaying(false);
      // Retain existing state and show error
      setError(
        err.message || 'Failed to update repayment status. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={COLORS.navy} />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Hero Card */}
        <Card elevated style={[styles.heroCard, isOverdue ? styles.heroCardOverdue : null]}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.avatarCircle,
                isOverdue && styles.avatarOverdue,
                isRepaid && styles.avatarRepaid,
              ]}
            >
              <User
                size={28}
                color={
                  isOverdue
                    ? COLORS.overdue
                    : isRepaid
                    ? COLORS.repaid
                    : COLORS.primary
                }
              />
            </View>
            <View style={styles.heroFriendInfo}>
              <Text style={styles.friendName}>{loan.friendName}</Text>
              <Text style={styles.loanIdText}>ID: #{loan.id.slice(-6)}</Text>
            </View>
            <Badge status={loan.status} isOverdue={isOverdue} />
          </View>

          <View style={styles.amountSection}>
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
            <View style={styles.overdueNotice}>
              <AlertTriangle size={16} color={COLORS.overdue} style={styles.overdueNoticeIcon} />
              <Text style={styles.overdueNoticeText}>
                This loan is past its due date ({formatDate(loan.dueDate)}).
              </Text>
            </View>
          )}

          {isRepaid && (
            <View style={styles.repaidNotice}>
              <CheckCircle size={16} color={COLORS.repaid} style={styles.overdueNoticeIcon} />
              <Text style={styles.repaidNoticeText}>
                Loan settled in full on {formatDate(loan.repaidAt || new Date().toISOString())}.
              </Text>
            </View>
          )}
        </Card>

        {/* Breakdown Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details & Timeline</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Calendar size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Repayment Due Date</Text>
              <Text style={styles.detailValue}>{formatDate(loan.dueDate)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Clock size={18} color={COLORS.primary} />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>
                {isRepaid
                  ? 'Repaid / Closed'
                  : isOverdue
                  ? 'Overdue — Payment Required'
                  : 'Active — Within Due Date'}
              </Text>
            </View>
          </View>

          {loan.createdAt && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrapper}>
                  <Receipt size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <Text style={styles.detailLabel}>Recorded On</Text>
                  <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
                </View>
              </View>
            </>
          )}

          {loan.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrapper}>
                  <FileText size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailTextWrapper}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{loan.notes}</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Repay Action Button */}
        {!isRepaid && (
          <View style={styles.actionsContainer}>
            <Button
              title="Mark as Repaid"
              variant="primary"
              size="lg"
              loading={repaying}
              leftIcon={<CheckCircle size={20} color={COLORS.white} />}
              onPress={handleMarkAsRepaid}
              style={styles.repayButton}
            />
            <Text style={styles.actionHint}>
              Pressing this will confirm that the full amount was received from {loan.friendName}.
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  headerRightPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: SPACING.lg,
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
  heroCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  heroCardOverdue: {
    borderColor: COLORS.overdueBorder,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarOverdue: {
    backgroundColor: COLORS.overdueBg,
  },
  avatarRepaid: {
    backgroundColor: COLORS.repaidBg,
  },
  heroFriendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  loanIdText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amountSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  amountRepaid: {
    color: COLORS.repaid,
  },
  amountOverdue: {
    color: COLORS.overdue,
  },
  overdueNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overdueBg,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.overdueBorder,
  },
  overdueNoticeIcon: {
    marginRight: SPACING.sm,
  },
  overdueNoticeText: {
    fontSize: 12,
    color: COLORS.overdue,
    fontWeight: '600',
    flex: 1,
  },
  repaidNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.repaidBg,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.repaidBorder,
  },
  repaidNoticeText: {
    fontSize: 12,
    color: COLORS.repaid,
    fontWeight: '600',
    flex: 1,
  },
  detailsCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  actionsContainer: {
    marginTop: SPACING.xs,
  },
  repayButton: {
    ...SHADOWS.raised,
  },
  actionHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
});
