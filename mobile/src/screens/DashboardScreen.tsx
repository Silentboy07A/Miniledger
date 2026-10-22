import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  LogOut,
  Plus,
  RefreshCw,
  Wallet,
  Users,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { FinancialSummary, Loan, RootStackParamList } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/SummaryCard';
import { LoanItem } from '../components/LoanItem';
import { Button } from '../components/Button';
import { sortLoans } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { logout, phone } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalLent: 0,
    totalRepaid: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Parallel fetch for summary and loans from backend APIs
      const [summaryRes, loansRes] = await Promise.all([
        api.getSummary(),
        api.getLoans(),
      ]);

      setSummary(summaryRes);
      setLoans(sortLoans(loansRes));
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to load ledger data. Check backend connectivity and retry.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload data whenever screen regains focus (e.g. returning from Add Loan or Details)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of MiniLedger?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      {/* Financial Summary 3-Card Grid */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionHeading}>Financial Overview</Text>
        <View style={styles.summaryCardsGrid}>
          <View style={styles.summaryCardWrapper}>
            <SummaryCard
              title="Total Lent"
              amount={summary.totalLent}
              variant="primary"
              icon={<ArrowUpRight size={16} color={COLORS.primary} />}
            />
          </View>
          <View style={styles.summaryCardWrapper}>
            <SummaryCard
              title="Total Repaid"
              amount={summary.totalRepaid}
              variant="success"
              icon={<CheckCircle2 size={16} color={COLORS.repaid} />}
            />
          </View>
        </View>

        <View style={styles.overdueCardWrapper}>
          <SummaryCard
            title="Overdue Amount"
            amount={summary.overdueAmount}
            variant="danger"
            icon={<AlertTriangle size={16} color={COLORS.overdue} />}
          />
        </View>
      </View>

      {/* Loan List Header */}
      <View style={styles.listHeaderRow}>
        <View>
          <Text style={styles.sectionHeading}>Tracked Loans</Text>
          <Text style={styles.listSubheading}>
            {loans.length} {loans.length === 1 ? 'record' : 'records'} sorted by priority
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('AddLoan')}
          style={styles.inlineAddBtn}
          activeOpacity={0.8}
        >
          <Plus size={16} color={COLORS.white} />
          <Text style={styles.inlineAddBtnText}>Add Loan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.errorIconCircle}>
            <AlertTriangle size={36} color={COLORS.overdue} />
          </View>
          <Text style={styles.emptyTitle}>Failed to load ledger</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button
            title="Retry Connection"
            size="md"
            variant="outline"
            leftIcon={<RefreshCw size={16} color={COLORS.primary} />}
            onPress={() => loadData()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Users size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No loans recorded yet</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking loans to your friends. Keep records of amounts, due dates,
          and repayments in one safe place.
        </Text>
        <Button
          title="Record Your First Loan"
          size="md"
          variant="primary"
          leftIcon={<Plus size={18} color={COLORS.white} />}
          onPress={() => navigation.navigate('AddLoan')}
          style={styles.firstLoanButton}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          <View style={styles.navLogoBadge}>
            <Wallet size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.navBrandText}>MiniLedger</Text>
            {phone && (
              <Text style={styles.navUserPhone}>{phone}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
          accessibilityLabel="Logout"
        >
          <LogOut size={18} color={COLORS.textSecondary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Syncing ledger with server...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LoanItem
              loan={item}
              onPress={() => navigation.navigate('LoanDetails', { loan: item })}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  navBrandText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  navUserPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  headerComponent: {
    paddingTop: SPACING.lg,
  },
  summarySection: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
    letterSpacing: -0.2,
  },
  summaryCardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  summaryCardWrapper: {
    width: '48%',
  },
  overdueCardWrapper: {
    width: '100%',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  listSubheading: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.card,
  },
  inlineAddBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.overdueBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    minWidth: 160,
  },
  firstLoanButton: {
    minWidth: 200,
  },
});
