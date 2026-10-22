import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatINR } from '../utils/formatters';

export interface SummaryCardProps {
  title: string;
  amount: number;
  variant?: 'primary' | 'success' | 'danger';
  icon?: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  variant = 'primary',
  icon,
}) => {
  const getTheme = () => {
    switch (variant) {
      case 'success':
        return {
          textColor: COLORS.repaid,
          accentColor: COLORS.repaid,
          bgColor: COLORS.repaidBg,
        };
      case 'danger':
        return {
          textColor: COLORS.overdue,
          accentColor: COLORS.overdue,
          bgColor: COLORS.overdueBg,
        };
      case 'primary':
      default:
        return {
          textColor: COLORS.navy,
          accentColor: COLORS.primary,
          bgColor: COLORS.primaryLight,
        };
    }
  };

  const theme = getTheme();

  return (
    <View style={[styles.card, SHADOWS.card]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: theme.bgColor }]}>
            {icon}
          </View>
        )}
      </View>
      <Text
        style={[styles.amount, { color: theme.textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatINR(amount)}
      </Text>
      <View style={[styles.indicator, { backgroundColor: theme.accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 104,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: SPACING.xs,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
