import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Header } from '../ui/components/Header';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { InlineAlert } from '../ui/components/InlineAlert';
import { theme } from '../ui/theme';
import { createLeave } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

 type Props = NativeStackScreenProps<RootStackParamList, 'LeaveCreate'>;

export default function LeaveCreateScreen({ navigation }: Props) {
  const [employeeId, setEmployeeId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!employeeId || !typeId || !from || !to) {
      setError('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createLeave({ employee_id: Number(employeeId), holiday_status_id: Number(typeId), request_date_from: from, request_date_to: to, name });
      Alert.alert('Success', 'Leave created');
      navigation.replace('Leaves');
    } catch (e: any) {
      setError(e?.message || 'Failed to create leave');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="New Leave" />
      <View style={styles.body}>
        {error ? <InlineAlert text={error} style={{ marginBottom: theme.spacing(3) }} /> : null}
        <Text style={styles.label}>Employee ID</Text>
        <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} keyboardType="number-pad" placeholder="e.g., 5" />
        <Text style={styles.label}>Leave Type ID</Text>
        <TextInput style={styles.input} value={typeId} onChangeText={setTypeId} keyboardType="number-pad" placeholder="e.g., 1" />
        <Text style={styles.label}>From (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="2025-10-10" />
        <Text style={styles.label}>To (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="2025-10-12" />
        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Annual leave" />
        <PrimaryButton title={submitting ? 'Submitting...' : 'Create Leave'} onPress={onSubmit} />
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
