import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { FinancialSummary, Loan, RootStackParamList } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/SummaryCard';
import { LoanItem } from '../components/LoanItem';
import { Button } from '../components/Button';
import { isLoanOverdue, maskPhoneNumber, sortLoans } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
type FilterTab = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'REPAID';

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { logout, phone } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalLent: 0,
    totalRepaid: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [summaryRes, loansRes] = await Promise.all([
        api.getSummary(),
        api.getLoans(),
      ]);

      setSummary(summaryRes);
      setLoans(sortLoans(loansRes));
    } catch (err: any) {
      setError(
        err.message || 'Failed to load ledger data. Check backend connectivity and retry.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out of MiniLedger?')) {
        logout();
      }
      return;
    }

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

  // Filter & Search computation
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.friendName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
      const isRepaid = loan.status === 'REPAID';

      if (activeFilter === 'OVERDUE') {
        return isOverdue && !isRepaid;
      }
      if (activeFilter === 'REPAID') {
        return isRepaid;
      }
      if (activeFilter === 'ACTIVE') {
        return !isRepaid && !isOverdue;
      }
      return true;
    });
  }, [loans, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    let overdueCount = 0;
    let repaidCount = 0;
    let activeCount = 0;

    loans.forEach((loan) => {
      const isOverdue = isLoanOverdue(loan.dueDate, loan.status);
      const isRepaid = loan.status === 'REPAID';
      if (isRepaid) repaidCount++;
      else if (isOverdue) overdueCount++;
      else activeCount++;
    });

    return {
      all: loans.length,
      active: activeCount,
      overdue: overdueCount,
      repaid: repaidCount,
    };
  }, [loans]);

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      {/* Welcome Banner */}
      <View style={[styles.welcomeBanner, isDesktop && styles.desktopWelcomeBanner]}>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.welcomeTitle}>Ledger Overview</Text>
          <Text style={styles.welcomeSubtitle}>
            {counts.all === 0
              ? 'No loans recorded yet. Create your first record below.'
              : `${counts.active} active loan${counts.active === 1 ? '' : 's'} • ${counts.overdue} overdue`}
          </Text>
        </View>

        <Button
          title="Record New Loan"
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} color={COLORS.white} />}
          onPress={() => navigation.navigate('AddLoan')}
          style={styles.bannerAddButton}
        />
      </View>

      {/* Summary Cards Grid */}
      <View style={[styles.summaryCardsGrid, isDesktop && styles.desktopSummaryCardsGrid]}>
        <View style={[styles.summaryCardCol, isDesktop && styles.desktopSummaryCardCol]}>
          <SummaryCard
            title="Total Lent"
            amount={summary.totalLent}
            subtitle={`${counts.all} total record${counts.all === 1 ? '' : 's'}`}
            variant="primary"
            icon={<ArrowUpRight size={17} color={COLORS.primary} />}
          />
        </View>
        <View style={[styles.summaryCardCol, isDesktop && styles.desktopSummaryCardCol]}>
          <SummaryCard
            title="Total Repaid"
            amount={summary.totalRepaid}
            subtitle={`${counts.repaid} settled in full`}
            variant="success"
            icon={<CheckCircle2 size={17} color={COLORS.repaid} />}
          />
        </View>
        <View style={[styles.summaryCardCol, isDesktop && styles.desktopSummaryCardCol]}>
          <SummaryCard
            title="Overdue Amount"
            amount={summary.overdueAmount}
            subtitle={`${counts.overdue} require attention`}
            variant="danger"
            icon={<AlertTriangle size={17} color={COLORS.overdue} />}
          />
        </View>
      </View>

      {/* Tracked Loans Section Header & Controls */}
      <View style={styles.listControlSection}>
        <View style={styles.listHeadingRow}>
          <View>
            <Text style={styles.listTitle}>Tracked Loans</Text>
            <Text style={styles.listSubtitle}>
              Showing {filteredLoans.length} of {loans.length} loan{loans.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* Search & Filter Controls */}
        <View style={[styles.filterBar, isDesktop && styles.desktopFilterBar]}>
          {/* Search Input */}
          <View style={[styles.searchInputWrapper, isDesktop && styles.desktopSearchInputWrapper]}>
            <Search size={15} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder="Search by friend name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.searchInput,
                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              ]}
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearSearchBtn}
              >
                <X size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              onPress={() => setActiveFilter('ALL')}
              style={[
                styles.filterTab,
                activeFilter === 'ALL' && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'ALL' && styles.filterTabTextActive,
                ]}
              >
                All ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('ACTIVE')}
              style={[
                styles.filterTab,
                activeFilter === 'ACTIVE' && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'ACTIVE' && styles.filterTabTextActive,
                ]}
              >
                Active ({counts.active})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('OVERDUE')}
              style={[
                styles.filterTab,
                activeFilter === 'OVERDUE' && styles.filterTabActiveOverdue,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'OVERDUE' && styles.filterTabTextActiveOverdue,
                ]}
              >
                Overdue ({counts.overdue})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('REPAID')}
              style={[
                styles.filterTab,
                activeFilter === 'REPAID' && styles.filterTabActiveRepaid,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'REPAID' && styles.filterTabTextActiveRepaid,
                ]}
              >
                Repaid ({counts.repaid})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.errorIconCircle}>
            <AlertTriangle size={32} color={COLORS.overdue} />
          </View>
          <Text style={styles.emptyTitle}>Unable to connect to ledger</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button
            title="Retry Connection"
            size="md"
            variant="outline"
            leftIcon={<RefreshCw size={15} color={COLORS.navy} />}
            onPress={() => loadData()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (searchQuery.trim() || activeFilter !== 'ALL') {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <SlidersHorizontal size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No matching loans found</Text>
          <Text style={styles.emptySubtitle}>
            No records matched your search query or selected filter.
          </Text>
          <Button
            title="Clear Filters"
            size="sm"
            variant="outline"
            onPress={() => {
              setSearchQuery('');
              setActiveFilter('ALL');
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Users size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No loans recorded yet</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking loans to your friends. Keep records of amounts, due dates,
          and repayments in one safe, organized place.
        </Text>
        <Button
          title="Record Your First Loan"
          size="md"
          variant="primary"
          leftIcon={<Plus size={17} color={COLORS.white} />}
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
        <View style={[styles.navInner, isDesktop && styles.desktopNavInner]}>
          <View style={styles.brandGroup}>
            <View style={styles.navLogoBadge}>
              <Wallet size={18} color={COLORS.white} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.navBrandText}>MiniLedger</Text>
              {phone ? (
                <Text style={styles.navUserPhone}>{maskPhoneNumber(phone)}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.navActions}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.7}
              accessibilityLabel="Logout"
            >
              <LogOut size={16} color={COLORS.textSecondary} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Syncing ledger with server...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.listItemWrapper, isDesktop && styles.desktopListItemWrapper]}>
              <LoanItem
                loan={item}
                onPress={() => navigation.navigate('LoanDetails', { loan: item })}
              />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.desktopListContent,
          ]}
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
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md - 2,
    width: '100%',
  },
  desktopNavInner: {
    maxWidth: 1040,
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLogoBadge: {
    width: 36,
    height: 36,
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
    letterSpacing: -0.4,
  },
  navUserPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navAddBtn: {
    minHeight: 34,
    paddingHorizontal: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  desktopListContent: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
  },
  listItemWrapper: {
    width: '100%',
  },
  desktopListItemWrapper: {
    width: '100%',
  },
  headerComponent: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  welcomeBanner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'column',
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  desktopWelcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextGroup: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  bannerAddButton: {
    alignSelf: 'flex-start',
  },
  summaryCardsGrid: {
    flexDirection: 'column',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  desktopSummaryCardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCardCol: {
    width: '100%',
  },
  desktopSummaryCardCol: {
    flex: 1,
  },
  listControlSection: {
    marginBottom: SPACING.md,
  },
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'column',
    gap: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  desktopFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  desktopSearchInputWrapper: {
    width: 280,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  filterTabActiveOverdue: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
  },
  filterTabActiveRepaid: {
    backgroundColor: COLORS.repaidBg,
    borderColor: COLORS.repaidBorder,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  filterTabTextActiveOverdue: {
    color: COLORS.overdue,
  },
  filterTabTextActiveRepaid: {
    color: COLORS.repaid,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loaderText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.overdueBg,
    borderWidth: 1,
    borderColor: COLORS.overdueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 380,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    minWidth: 160,
  },
  firstLoanButton: {
    minWidth: 200,
  },
});
