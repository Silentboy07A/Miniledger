import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { LoanStatus } from '../types';

export interface BadgeProps {
  status: LoanStatus | 'PENDING';
  isOverdue?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  isOverdue = false,
  style,
}) => {
  const isActuallyOverdue = status === 'OVERDUE' || (status === 'UNPAID' && isOverdue);
  const isRepaid = status === 'REPAID';

  if (isActuallyOverdue) {
    return (
      <View style={[styles.badge, styles.badgeOverdue, style]}>
        <AlertCircle size={12} color={COLORS.overdue} style={styles.icon} />
        <Text style={[styles.text, styles.textOverdue]}>Overdue</Text>
      </View>
    );
  }

  if (isRepaid) {
    return (
      <View style={[styles.badge, styles.badgeRepaid, style]}>
        <CheckCircle2 size={12} color={COLORS.repaid} style={styles.icon} />
        <Text style={[styles.text, styles.textRepaid]}>Repaid</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.badgePending, style]}>
      <Clock size={12} color={COLORS.pending} style={styles.icon} />
      <Text style={[styles.text, styles.textPending]}>Active</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeOverdue: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
  },
  textOverdue: {
    color: COLORS.overdue,
  },
  badgeRepaid: {
    backgroundColor: COLORS.repaidBg,
    borderColor: COLORS.repaidBorder,
  },
  textRepaid: {
    color: COLORS.repaid,
  },
  badgePending: {
    backgroundColor: COLORS.pendingBg,
    borderColor: COLORS.pendingBorder,
  },
  textPending: {
    color: COLORS.pending,
  },
});
