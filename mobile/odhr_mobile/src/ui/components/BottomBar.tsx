import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../App';

export function BottomBar({ active, navigation }: { active: 'employees' | 'leaves' | 'attendance' | 'settings'; navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const Item = ({ label, to, keyName }: { label: string; to: keyof RootStackParamList; keyName: typeof active }) => (
    <TouchableOpacity style={styles.item} onPress={() => (navigation as any).replace(to)}>
      <Text style={[styles.label, active === keyName && styles.active]}>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.bar}>
      <Item label="Employees" to="Employees" keyName="employees" />
      <Item label="Leaves" to="Leaves" keyName="leaves" />
      <Item label="Attendance" to="Attendance" keyName="attendance" />
      <Item label="Settings" to="Settings" keyName="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing(3),
    backgroundColor: theme.colors.bg,
  },
  item: { paddingHorizontal: theme.spacing(3) },
  label: { color: theme.colors.muted, fontWeight: '600' },
  active: { color: theme.colors.primary },
});
