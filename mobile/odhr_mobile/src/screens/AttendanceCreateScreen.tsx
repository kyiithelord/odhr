import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Header } from '../ui/components/Header';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { InlineAlert } from '../ui/components/InlineAlert';
import { theme } from '../ui/theme';
import { createAttendance } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

 type Props = NativeStackScreenProps<RootStackParamList, 'AttendanceCreate'>;

export default function AttendanceCreateScreen({ navigation }: Props) {
  const [employeeId, setEmployeeId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!employeeId || !checkIn) {
      setError('Employee ID and Check In are required');
      return;
    }
    setSubmitting(true);
    try {
      await createAttendance({ employee_id: Number(employeeId), check_in: checkIn, check_out: checkOut || undefined });
      Alert.alert('Success', 'Attendance created');
      navigation.replace('Attendance');
    } catch (e: any) {
      setError(e?.message || 'Failed to create attendance');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="New Attendance" />
      <View style={styles.body}>
        {error ? <InlineAlert text={error} style={{ marginBottom: theme.spacing(3) }} /> : null}
        <Text style={styles.label}>Employee ID</Text>
        <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} keyboardType="number-pad" placeholder="e.g., 5" />
        <Text style={styles.label}>Check In (YYYY-MM-DD HH:mm:ss)</Text>
        <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="2025-10-04 09:00:00" />
        <Text style={styles.label}>Check Out (optional)</Text>
        <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="2025-10-04 17:30:00" />
        <PrimaryButton title={submitting ? 'Submitting...' : 'Create Attendance'} onPress={onSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1, padding: theme.spacing(4), gap: theme.spacing(3) },
  label: { fontWeight: '600', color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing(3) },
});
