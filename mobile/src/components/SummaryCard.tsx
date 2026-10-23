import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatINR } from '../utils/formatters';

export interface SummaryCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  variant?: 'primary' | 'success' | 'danger';
  icon?: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  subtitle,
  variant = 'primary',
  icon,
}) => {
  const getTheme = () => {
    switch (variant) {
      case 'success':
        return {
          textColor: COLORS.navy,
          amountColor: COLORS.repaid,
          accentColor: COLORS.repaid,
          bgColor: COLORS.repaidBg,
          borderColor: COLORS.repaidBorder,
        };
      case 'danger':
        return {
          textColor: COLORS.navy,
          amountColor: COLORS.overdue,
          accentColor: COLORS.overdue,
          bgColor: COLORS.overdueBg,
          borderColor: COLORS.overdueBorder,
        };
      case 'primary':
      default:
        return {
          textColor: COLORS.navy,
          amountColor: COLORS.navy,
          accentColor: COLORS.primary,
          bgColor: COLORS.primaryLight,
          borderColor: COLORS.primaryBorder,
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
        style={[styles.amount, { color: theme.amountColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatINR(amount)}
      </Text>

      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}

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
    minHeight: 110,
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
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginVertical: SPACING.xs,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
});
