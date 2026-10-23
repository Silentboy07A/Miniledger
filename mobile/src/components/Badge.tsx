import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { LoanStatus } from '../types';

export interface BadgeProps {
  status: LoanStatus | 'PENDING' | 'ACTIVE';
  isOverdue?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  isOverdue = false,
  size = 'md',
  style,
}) => {
  const isActuallyOverdue = status === 'OVERDUE' || (status === 'UNPAID' && isOverdue);
  const isRepaid = status === 'REPAID';

  const isSmall = size === 'sm';

  if (isActuallyOverdue) {
    return (
      <View
        style={[
          styles.badge,
          styles.badgeOverdue,
          isSmall && styles.badgeSm,
          style,
        ]}
      >
        <AlertCircle size={isSmall ? 10 : 12} color={COLORS.overdue} style={styles.icon} />
        <Text style={[styles.text, styles.textOverdue, isSmall && styles.textSm]}>Overdue</Text>
      </View>
    );
  }

  if (isRepaid) {
    return (
      <View
        style={[
          styles.badge,
          styles.badgeRepaid,
          isSmall && styles.badgeSm,
          style,
        ]}
      >
        <CheckCircle2 size={isSmall ? 10 : 12} color={COLORS.repaid} style={styles.icon} />
        <Text style={[styles.text, styles.textRepaid, isSmall && styles.textSm]}>Repaid</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        styles.badgeActive,
        isSmall && styles.badgeSm,
        style,
      ]}
    >
      <Clock size={isSmall ? 10 : 12} color={COLORS.primary} style={styles.icon} />
      <Text style={[styles.text, styles.textActive, isSmall && styles.textSm]}>Active</Text>
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
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
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
  badgeActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  textActive: {
    color: COLORS.primary,
  },
});
