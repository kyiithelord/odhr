import React, { useState } from 'react';
import { View, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { Card } from '../ui/components/Card';
import { Divider } from '../ui/components/Divider';
import { useTheme } from '../ui/themeProvider';
import { createEmployee, type OdooConfig } from '../api/odoo';

export type CreateEmployeeScreenProps = {
  odoo: OdooConfig; // pass in via props or inject from a config layer
  onCreated?: (employee: any) => void;
};

export default function CreateEmployeeScreen({ odoo, onCreated }: CreateEmployeeScreenProps) {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [deptId, setDeptId] = useState<string>('');
  const [locId, setLocId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = { name: name.trim() };
      if (email.trim()) payload.work_email = email.trim();
      if (mobile.trim()) payload.mobile_phone = mobile.trim();
      if (jobTitle.trim()) payload.job_title = jobTitle.trim();
      if (deptId.trim()) payload.department_id = Number(deptId);
      if (locId.trim()) payload.work_location_id = Number(locId);

      const res = await createEmployee(odoo, payload);
      Alert.alert('Success', `Employee created: ${res?.name || 'OK'}`);
      onCreated?.(res);
      // reset
      setName('');
      setEmail('');
      setMobile('');
      setJobTitle('');
      setDeptId('');
      setLocId('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(4), gap: theme.spacing(4) }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Full name *</Text>
          <TextInput
            placeholder="Enter full name"
            placeholderTextColor={theme.colors.muted}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />

          <Divider />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Work email</Text>
          <TextInput
            placeholder="name@company.com"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Mobile</Text>
          <TextInput
            placeholder="+1 234 567 890"
            placeholderTextColor={theme.colors.muted}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Job title</Text>
          <TextInput
            placeholder="e.g., Software Engineer"
            placeholderTextColor={theme.colors.muted}
            value={jobTitle}
            onChangeText={setJobTitle}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Department ID</Text>
          <TextInput
            placeholder="Numeric department id"
            placeholderTextColor={theme.colors.muted}
            keyboardType="number-pad"
            value={deptId}
            onChangeText={setDeptId}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Work Location ID</Text>
          <TextInput
            placeholder="Numeric work location id"
            placeholderTextColor={theme.colors.muted}
            keyboardType="number-pad"
            value={locId}
            onChangeText={setLocId}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />
        </Card>

        <PrimaryButton title="Create Employee" onPress={onSubmit} loading={submitting} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
});
