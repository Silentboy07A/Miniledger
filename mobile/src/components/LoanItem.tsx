import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Calendar, AlertTriangle } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Loan } from '../types';
import {
  formatDate,
  formatINR,
  getFriendInitials,
  getRelativeDueString,
  isLoanOverdue,
} from '../utils/formatters';
import { Badge } from './Badge';

export interface LoanItemProps {
  loan: Loan;
  onPress: () => void;
}

export const LoanItem: React.FC<LoanItemProps> = ({ loan, onPress }) => {
  const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
  const isRepaid = loan.status === 'REPAID';
  const relative = getRelativeDueString(loan.dueDate, loan.status);
  const initials = getFriendInitials(loan.friendName);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        SHADOWS.card,
        isOverdue && styles.overdueContainer,
        isRepaid && styles.repaidContainer,
      ]}
    >
      {/* Left accent bar */}
      <View
        style={[
          styles.statusAccentBar,
          isOverdue && styles.overdueAccentBar,
          isRepaid && styles.repaidAccentBar,
        ]}
      />

      <View style={styles.content}>
        <View style={styles.mainRow}>
          {/* Friend info & avatar */}
          <View style={styles.friendInfo}>
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

            <View style={styles.nameBlock}>
              <Text style={styles.friendName} numberOfLines={1}>
                {loan.friendName}
              </Text>
              <View style={styles.dateRow}>
                <Calendar size={12} color={COLORS.textSecondary} style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {isRepaid ? 'Settled: ' : 'Due: '}
                  {formatDate(loan.dueDate)}
                </Text>
                <Text style={styles.dateDot}>•</Text>
                <Text
                  style={[
                    styles.relativeText,
                    relative.isOverdue && styles.relativeTextOverdue,
                    isRepaid && styles.relativeTextRepaid,
                  ]}
                >
                  {relative.text}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount & Status Badge */}
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
            <Badge status={loan.status} isOverdue={isOverdue} size="sm" />
          </View>
        </View>

        {isOverdue && (
          <View style={styles.overdueCallout}>
            <AlertTriangle size={12} color={COLORS.overdue} style={styles.calloutIcon} />
            <Text style={styles.overdueCalloutText}>
              Payment overdue — was expected on {formatDate(loan.dueDate)}
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
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overdueContainer: {
    borderColor: COLORS.overdueBorder,
    backgroundColor: '#FFFAFA',
  },
  repaidContainer: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    opacity: 0.92,
  },
  statusAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: COLORS.primary,
  },
  overdueAccentBar: {
    backgroundColor: COLORS.overdue,
  },
  repaidAccentBar: {
    backgroundColor: COLORS.repaid,
  },
  content: {
    flex: 1,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.xs,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  avatarInitialsOverdue: {
    color: COLORS.overdue,
  },
  avatarInitialsRepaid: {
    color: COLORS.repaid,
  },
  nameBlock: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dateDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  relativeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  relativeTextOverdue: {
    color: COLORS.overdue,
    fontWeight: '700',
  },
  relativeTextRepaid: {
    color: COLORS.repaid,
  },
  amountContainer: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  repaidAmountText: {
    color: COLORS.repaid,
  },
  overdueAmountText: {
    color: COLORS.overdue,
  },
  overdueCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overdueBg,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.xs + 2,
    alignSelf: 'flex-start',
  },
  calloutIcon: {
    marginRight: 4,
  },
  overdueCalloutText: {
    fontSize: 11,
    color: COLORS.overdue,
    fontWeight: '600',
  },
  chevronWrapper: {
    marginLeft: SPACING.xs,
    justifyContent: 'center',
  },
});
