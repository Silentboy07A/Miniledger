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
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { formatDate, toIsoDateString } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AddLoan'>;

// Zod schema for loan form validation
const loanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, "Friend's name is required")
    .max(50, "Name cannot exceed 50 characters"),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    }, 'Amount must be greater than ₹0')
    .refine(
      (val) => /^\d+(\.\d{1,2})?$/.test(val),
      'Amount can have at most 2 decimal places'
    ),
  dueDate: z.date({
    error: 'Please select a valid due date',
  }),
  notes: z.string().trim().max(150, 'Notes cannot exceed 150 characters').optional(),
});

export const AddLoanScreen: React.FC<Props> = ({ navigation }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(() => {
    // Default due date: 7 days from today
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
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

  const handleSave = async () => {
    if (saving) return; // Prevent duplicate submissions

    setServerError(null);
    setErrors({});

    // Validate with Zod
    const result = loanSchema.safeParse({
      friendName,
      amount,
      dueDate,
      notes,
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
        notes: notes.trim() || undefined,
      });

      setSaving(false);
      Alert.alert('Loan Recorded', `Loan to ${friendName.trim()} has been saved.`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      setSaving(false);
      // Retain form state and display user-friendly error
      setServerError(
        err.message || 'Failed to save loan. Please check server connection.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={COLORS.navy} />
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record New Loan</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {serverError && (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          )}

          <Card elevated style={styles.formCard}>
            {/* Friend Name */}
            <Input
              label="Friend's Name *"
              placeholder="e.g. Rahul Sharma"
              value={friendName}
              maxLength={50}
              onChangeText={(text) => {
                setFriendName(text);
                if (errors.friendName) {
                  setErrors((prev) => ({ ...prev, friendName: '' }));
                }
              }}
              prefix={<User size={18} color={COLORS.textSecondary} />}
              error={errors.friendName}
            />

            {/* Amount in INR */}
            <Input
              label="Amount (INR) *"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }
              }}
              prefix={<IndianRupee size={18} color={COLORS.textSecondary} />}
              error={errors.amount}
              helperText="Maximum two decimal places"
            />

            {/* Due Date Picker Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Repayment Due Date *</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.datePickerButton,
                  errors.dueDate ? styles.datePickerError : null,
                ]}
              >
                <View style={styles.datePickerLeft}>
                  <CalendarIcon size={18} color={COLORS.primary} style={styles.calendarIcon} />
                  <Text style={styles.datePickerText}>
                    {formatDate(toIsoDateString(dueDate))}
                  </Text>
                </View>
                <Text style={styles.dateChangeAction}>Change</Text>
              </TouchableOpacity>
              {errors.dueDate && (
                <Text style={styles.errorText}>{errors.dueDate}</Text>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            {/* Optional Notes */}
            <Input
              label="Notes (Optional)"
              placeholder="e.g. For dinner bill split"
              value={notes}
              maxLength={150}
              onChangeText={setNotes}
              prefix={<FileText size={18} color={COLORS.textSecondary} />}
              error={errors.notes}
            />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              />
              <Button
                title="Save Loan"
                variant="primary"
                loading={saving}
                onPress={handleSave}
                leftIcon={<Check size={18} color={COLORS.white} />}
                style={styles.saveButton}
              />
            </View>
          </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  headerRightPlaceholder: {
    width: 60,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  serverErrorBox: {
    backgroundColor: COLORS.overdueBg,
    borderColor: COLORS.overdueBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  serverErrorText: {
    color: COLORS.overdue,
    fontSize: 13,
    fontWeight: '500',
  },
  formCard: {
    padding: SPACING.xl,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs + 2,
    letterSpacing: 0.2,
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
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: SPACING.sm,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateChangeAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.overdue,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  saveButton: {
    flex: 1.4,
    marginLeft: SPACING.sm,
  },
});
