import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { managerTeamOverview } from '../api/odoo';

export default function ManagerDashboardScreen() {
  const { cfg, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ team_size: number; today_attendance_count: number; open_leaves_count: number } | null>(null);

  async function load() {
    if (!cfg) return;
    setLoading(true);
    try {
      const res = await managerTeamOverview(cfg, {});
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (hasRole('manager','hr','admin')) load(); }, [cfg?.baseUrl, cfg?.db]);

  if (!hasRole('manager','hr','admin')) {
    return (
      <View style={styles.center}><Text>You do not have access to this page.</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Team Overview</Text>
      <View style={styles.card}>
        <Text style={styles.kpi}>Team size: {data?.team_size ?? '-'}</Text>
        <Text style={styles.kpi}>Attendance today: {data?.today_attendance_count ?? '-'}</Text>
        <Text style={styles.kpi}>Open leaves: {data?.open_leaves_count ?? '-'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  kpi: { fontSize: 16, marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
