import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  ...rest
}) => {
  const isInteractive = !loading && !disabled;

  const containerStyles = [
    styles.button,
    styles[`size_${size}`],
    variant === 'primary' && styles.btnPrimary,
    variant === 'secondary' && styles.btnSecondary,
    variant === 'outline' && styles.btnOutline,
    variant === 'danger' && styles.btnDanger,
    variant === 'ghost' && styles.btnGhost,
    disabled && styles.btnDisabled,
    style,
  ] as StyleProp<ViewStyle>;

  const textStyles = [
    styles.text,
    styles[`textSize_${size}`],
    (variant === 'primary' || variant === 'secondary' || variant === 'danger') && styles.textLight,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
    disabled && styles.textDisabled,
  ] as StyleProp<TextStyle>;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={!isInteractive}
      style={containerStyles}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
    borderRadius: RADIUS.sm,
  },
  size_md: {
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 46,
    borderRadius: RADIUS.md,
  },
  size_lg: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    borderRadius: RADIUS.lg,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnSecondary: {
    backgroundColor: COLORS.navy,
  },
  btnOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
  },
  btnDanger: {
    backgroundColor: COLORS.overdue,
  },
  btnGhost: {
    backgroundColor: COLORS.transparent,
  },
  btnDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 15,
  },
  textLight: {
    color: COLORS.white,
  },
  textOutline: {
    color: COLORS.navy,
  },
  textGhost: {
    color: COLORS.primary,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});
