import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Wallet } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';

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
          <Wallet size={36} color={COLORS.white} />
        </View>
        <Text style={styles.splashTitle}>MiniLedger</Text>
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
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 24,
  },
});
