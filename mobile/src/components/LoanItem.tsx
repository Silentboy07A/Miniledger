import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Calendar, User as UserIcon } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Loan } from '../types';
import { formatDate, formatINR, isLoanOverdue } from '../utils/formatters';
import { Badge } from './Badge';

export interface LoanItemProps {
  loan: Loan;
  onPress: () => void;
  onQuickRepay?: () => void;
}

export const LoanItem: React.FC<LoanItemProps> = ({
  loan,
  onPress,
}) => {
  const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
  const isRepaid = loan.status === 'REPAID';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        SHADOWS.card,
        isOverdue && styles.overdueContainer,
      ]}
    >
      {/* Left accent bar for overdue loans */}
      {isOverdue && <View style={styles.overdueBar} />}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.friendInfo}>
            <View
              style={[
                styles.avatarCircle,
                isOverdue && styles.avatarOverdue,
                isRepaid && styles.avatarRepaid,
              ]}
            >
              <UserIcon
                size={16}
                color={
                  isOverdue
                    ? COLORS.overdue
                    : isRepaid
                    ? COLORS.repaid
                    : COLORS.primary
                }
              />
            </View>
            <View>
              <Text style={styles.friendName} numberOfLines={1}>
                {loan.friendName}
              </Text>
              <View style={styles.dateRow}>
                <Calendar size={12} color={COLORS.textSecondary} style={styles.dateIcon} />
                <Text style={styles.dueDateText}>
                  {isRepaid ? 'Settled' : 'Due'}: {formatDate(loan.dueDate)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amountText,
                isRepaid && styles.repaidAmountText,
                isOverdue && styles.overdueAmountText,
              ]}
            >
              {formatINR(loan.amount)}
            </Text>
            <Badge status={loan.status} isOverdue={isOverdue} />
          </View>
        </View>

        {isOverdue && (
          <View style={styles.overdueNoticeBox}>
            <Text style={styles.overdueNoticeText}>
              Payment overdue — due on {formatDate(loan.dueDate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chevronWrapper}>
        <ChevronRight size={18} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overdueContainer: {
    borderColor: COLORS.overdueBorder,
    backgroundColor: '#FFFBFB',
  },
  overdueBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.overdue,
  },
  content: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  avatarOverdue: {
    backgroundColor: COLORS.overdueBg,
  },
  avatarRepaid: {
    backgroundColor: COLORS.repaidBg,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 4,
  },
  repaidAmountText: {
    color: COLORS.repaid,
  },
  overdueAmountText: {
    color: COLORS.overdue,
  },
  overdueNoticeBox: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.overdueBg,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  overdueNoticeText: {
    fontSize: 11,
    color: COLORS.overdue,
    fontWeight: '600',
  },
  chevronWrapper: {
    marginLeft: SPACING.xs,
    justifyContent: 'center',
  },
});
