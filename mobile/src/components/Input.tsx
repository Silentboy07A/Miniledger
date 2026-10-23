import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  prefix,
  suffix,
  helperText,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          !editable && styles.wrapperDisabled,
          isFocused && styles.wrapperFocused,
          !!error && styles.wrapperError,
        ]}
      >
        {prefix && <View style={styles.prefixContainer}>{prefix}</View>}
        <TextInput
          placeholderTextColor={COLORS.textMuted}
          style={[
            styles.input,
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
            style,
          ]}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {suffix && <View style={styles.suffixContainer}>{suffix}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md + 2,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  wrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  wrapperError: {
    borderColor: COLORS.overdue,
    backgroundColor: COLORS.overdueBg,
  },
  wrapperDisabled: {
    backgroundColor: COLORS.inputDisabled,
    borderColor: COLORS.border,
  },
  prefixContainer: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suffixContainer: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.overdue,
    marginTop: 5,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
    lineHeight: 16,
  },
});
