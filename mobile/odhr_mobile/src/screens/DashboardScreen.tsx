import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// Using any navigation type to keep compatibility with combined Tab + Stack
import { useAuth } from '../contexts/AuthContext';

 type Props = any;

export default function DashboardScreen({ navigation }: Props) {
  const { me, hasRole } = useAuth();

  function Tile({ title, onPress }: { title: string; onPress: () => void }) {
    return (
      <TouchableOpacity style={styles.tile} onPress={onPress}>
        <Text style={styles.tileText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>Hello, {me?.name || 'User'}</Text>
      <View style={styles.grid}>
        <Tile title="Employees" onPress={() => navigation.navigate('Employees')} />
        <Tile title="Attendance" onPress={() => navigation.navigate('Attendance')} />
        <Tile title="Leaves" onPress={() => navigation.navigate('Leaves')} />
        <Tile title="Payslips" onPress={() => navigation.navigate('Payslips')} />
        <Tile title="Announcements" onPress={() => navigation.navigate('Announcements')} />
        {hasRole('manager','hr','admin') ? (
          <Tile title="Manager Dashboard" onPress={() => navigation.navigate('ManagerDashboard')} />
        ) : null}
        <Tile title="Settings" onPress={() => navigation.navigate('Settings')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  hello: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48%', backgroundColor: '#1f2937', padding: 16, borderRadius: 10 },
  tileText: { color: '#fff', fontWeight: '700' },
});
