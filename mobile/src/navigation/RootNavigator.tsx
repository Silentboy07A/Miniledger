import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AddLoanScreen } from '../screens/AddLoanScreen';
import { LoanDetailsScreen } from '../screens/LoanDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Wallet size={32} color={COLORS.white} strokeWidth={2.2} />
        </View>
        <Text style={styles.splashTitle}>MiniLedger</Text>
        <Text style={styles.splashSubtitle}>Loading your ledger...</Text>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.spinner}
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!isAuthenticated ? (
        // Unauthenticated Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OtpVerify" component={OtpScreen} />
        </>
      ) : (
        // Authenticated Stack
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddLoan" component={AddLoanScreen} />
          <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.raised,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.6,
  },
  splashSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  spinner: {
    marginTop: 24,
  },
});
