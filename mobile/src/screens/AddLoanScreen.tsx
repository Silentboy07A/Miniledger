import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { z } from 'zod';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  User,
  IndianRupee,
  FileText,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { formatDate, formatINR, toIsoDateString } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AddLoan'>;

const loanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, "Friend's name is required")
    .max(100, "Name cannot exceed 100 characters"),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    }, 'Amount must be a positive number greater than ₹0')
    .refine(
      (val) => /^\d+(\.\d{1,2})?$/.test(val),
      'Amount can have at most 2 decimal places'
    ),
  dueDate: z.date({
    error: 'Please select a valid due date',
  }),
});

export const AddLoanScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick preset shortcuts
  const setQuickDate = (daysToAdd: number) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    setDueDate(nextDate);
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: '' }));
    }
  };

  const handleNativeDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
      if (errors.dueDate) {
        setErrors((prev) => ({ ...prev, dueDate: '' }));
      }
    }
  };

  const handleWebDateChange = (e: any) => {
    const val = e.target.value;
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const nextDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        setDueDate(nextDate);
        if (errors.dueDate) {
          setErrors((prev) => ({ ...prev, dueDate: '' }));
        }
      }
    }
  };

  const handleSave = async () => {
    if (saving) return; // Prevent accidental duplicate submissions

    setServerError(null);
    setErrors({});

    const result = loanSchema.safeParse({
      friendName,
      amount,
      dueDate,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (!newErrors[field]) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      const formattedDate = toIsoDateString(dueDate);
      await api.createLoan({
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dueDate: formattedDate,
      });

      setSaving(false);

      if (Platform.OS === 'web') {
        window.alert(`Loan of ${formatINR(parseFloat(amount))} to ${friendName.trim()} has been recorded.`);
        navigation.goBack();
        return;
      }

      Alert.alert(
        'Loan Recorded',
        `Loan to ${friendName.trim()} has been saved successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      setSaving(false);
      setServerError(
        err.message || 'Failed to save loan. Please check server connection.'
      );
    }
  };

  const parsedAmountNum = parseFloat(amount);
  const isValidAmountNumber = !isNaN(parsedAmountNum) && parsedAmountNum > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={COLORS.navy} />
              <Text style={styles.backText}>Dashboard</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Record New Loan</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, isDesktop && styles.desktopContainer]}>
            {serverError && (
              <View style={styles.serverErrorBox}>
                <AlertCircle size={16} color={COLORS.overdue} style={styles.alertIcon} />
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <Card elevated style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.formTitle}>Loan Details</Text>
                <Text style={styles.formSubtitle}>
                  Enter the borrower's name, loan amount, and repayment date.
                </Text>
              </View>

              {/* Friend Name */}
              <Input
                label="Friend's Name * (Required)"
                placeholder="e.g. Rahul Sharma"
                value={friendName}
                maxLength={100}
                onChangeText={(text) => {
                  setFriendName(text);
                  if (errors.friendName) {
                    setErrors((prev) => ({ ...prev, friendName: '' }));
                  }
                }}
                prefix={<User size={17} color={COLORS.textSecondary} />}
                error={errors.friendName}
                helperText="Person who is borrowing money from you"
              />

              {/* Amount in INR */}
              <Input
                label="Amount (INR) * (Required)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => {
                  // Allow numbers and at most one decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setAmount(cleaned);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }
                }}
                prefix={<IndianRupee size={17} color={COLORS.textSecondary} />}
                error={errors.amount}
                helperText={
                  isValidAmountNumber
                    ? `Formatted: ${formatINR(parsedAmountNum)}`
                    : 'Enter principal amount in Indian Rupees'
                }
              />

              {/* Repayment Due Date */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Repayment Due Date * (Required)</Text>

                {Platform.OS === 'web' ? (
                  <View style={styles.webDateWrapper}>
                    <input
                      type="date"
                      value={toIsoDateString(dueDate)}
                      onChange={handleWebDateChange}
                      style={{
                        width: '100%',
                        height: 48,
                        borderRadius: RADIUS.md,
                        border: `1.5px solid ${errors.dueDate ? COLORS.overdue : COLORS.border}`,
                        padding: '0 14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: COLORS.navy,
                        backgroundColor: COLORS.card,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowDatePicker(true)}
                      style={[
                        styles.datePickerButton,
                        errors.dueDate ? styles.datePickerError : null,
                      ]}
                    >
                      <View style={styles.datePickerLeft}>
                        <CalendarIcon
                          size={17}
                          color={COLORS.primary}
                          style={styles.calendarIcon}
                        />
                        <Text style={styles.datePickerText}>
                          {formatDate(toIsoDateString(dueDate))}
                        </Text>
                      </View>
                      <Text style={styles.dateChangeAction}>Change</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={dueDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleNativeDateChange}
                      />
                    )}
                  </>
                )}

                {/* Quick Date Presets */}
                <View style={styles.presetRow}>
                  <Text style={styles.presetLabel}>Quick Presets:</Text>
                  <TouchableOpacity
                    onPress={() => setQuickDate(7)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>+7 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQuickDate(14)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>+2 Weeks</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQuickDate(30)}
                    style={styles.presetChip}
                  >
                    <Text style={styles.presetChipText}>+1 Month</Text>
                  </TouchableOpacity>
                </View>

                {errors.dueDate && (
                  <Text style={styles.errorText}>{errors.dueDate}</Text>
                )}
              </View>

              {/* Optional Notes (Honest regarding backend persistence) */}
              <Input
                label="Memo / Note (Optional)"
                placeholder="e.g. For dinner bill split or weekend trip"
                value={notes}
                maxLength={150}
                onChangeText={setNotes}
                prefix={<FileText size={17} color={COLORS.textSecondary} />}
                helperText="Note: Backend API stores friend name, amount, and due date. Memo is not persisted to server."
              />

              {/* Form Action Buttons */}
              <View style={styles.actionsRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  disabled={saving}
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                />
                <Button
                  title="Save Loan"
                  variant="primary"
                  size="md"
                  loading={saving}
                  disabled={saving}
                  onPress={handleSave}
                  leftIcon={<Check size={18} color={COLORS.white} />}
                  style={styles.saveButton}
                />
              </View>
            </Card>

            <View style={styles.infoBox}>
              <Info size={14} color={COLORS.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Recorded loans will appear immediately on your dashboard. When your friend repays,
                open the loan and click "Mark as Repaid".
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  desktopHeaderInner: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '700',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
  },
  desktopScrollContent: {
    padding: SPACING.xxxl,
    paddingBottom: SPACING.xxxl * 2,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 580,
  },
  desktopContainer: {
    maxWidth: 580,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  serverErrorText: {
    flex: 1,
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  formCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
  },
  cardHeader: {
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },
  formSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  fieldContainer: {
    marginBottom: SPACING.md + 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  webDateWrapper: {
    width: '100%',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  datePickerError: {
    borderColor: COLORS.overdue,
    backgroundColor: COLORS.overdueBg,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: SPACING.sm,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  dateChangeAction: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginRight: 2,
  },
  presetChip: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.overdue,
    marginTop: 5,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1.4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
