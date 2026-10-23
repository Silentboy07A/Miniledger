import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  bordered = true,
  style,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        bordered && styles.cardBordered,
        elevated ? SHADOWS.raised : SHADOWS.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  cardBordered: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
