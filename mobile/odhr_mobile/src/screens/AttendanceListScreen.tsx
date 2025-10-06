import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Header } from '../ui/components/Header';
import { InlineAlert } from '../ui/components/InlineAlert';
import { SkeletonList } from '../ui/components/Skeleton';
import { theme } from '../ui/theme';
import { listAttendances, AttendanceItem, AttendancesResponse } from '../services/api';
// Tab screen; keep navigation typing generic to avoid coupling
import { useAuth } from '../contexts/AuthContext';
import { attendanceCheckIn, attendanceCheckOut } from '../api/odoo';
import { getCurrentPosition } from '../services/geo';
import { enqueueAttendanceAction } from '../services/offline';

 type Props = any;

export default function AttendanceListScreen({ navigation }: Props) {
  const [data, setData] = useState<AttendancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { cfg } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listAttendances({ limit: 20, offset: 0 });
      setData(resp);
    } catch (e: any) {
      setError(e?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doCheck(kind: 'in' | 'out') {
    if (!cfg) return;
    setActionMsg(null);
    try {
      const pos = await getCurrentPosition();
      const payload = { lat: pos?.lat, lng: pos?.lng };
      if (kind === 'in') await attendanceCheckIn(cfg, payload);
      else await attendanceCheckOut(cfg, payload);
      setActionMsg(kind === 'in' ? 'Checked in' : 'Checked out');
      await load();
    } catch (e: any) {
      // Offline or failed: enqueue for later
      await enqueueAttendanceAction({ kind: kind === 'in' ? 'checkin' : 'checkout', payload: { manual: true, reason: 'offline' }, ts: Date.now() });
      setActionMsg('No network; queued for sync');
    }
  }

  const renderItem = ({ item }: { item: AttendanceItem }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.employee_id?.name || 'Employee'}</Text>
      <Text style={styles.meta}>In: {item.check_in || '-'} | Out: {item.check_out || '-'}</Text>
      {typeof item.worked_hours === 'number' ? <Text style={styles.badge}>{item.worked_hours.toFixed(2)} h</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Attendance" right="New" onRightPress={() => navigation.navigate('AttendanceCreate')} />
      <View style={styles.body}>
        <View style={styles.actionsRow}>
          <Text style={styles.actionBtn} onPress={() => doCheck('in')}>Check In</Text>
          <Text style={styles.actionBtn} onPress={() => doCheck('out')}>Check Out</Text>
        </View>
        {actionMsg ? <InlineAlert text={actionMsg} style={{ marginBottom: theme.spacing(3) }} /> : null}
        {error ? <InlineAlert text={error} style={{ marginBottom: theme.spacing(3) }} /> : null}
        {loading && !error ? <SkeletonList count={5} /> : null}
        {!loading && data ? (
          <FlatList
            data={data.items}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            ListFooterComponent={loading ? <ActivityIndicator style={{ margin: theme.spacing(4) }} /> : null}
          />
        ) : null}
        {!loading && !error && (!data || data.items.length === 0) ? (
          <Text style={styles.empty}>No attendance records yet. Tap New to add one.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1, padding: theme.spacing(4) },
  actionsRow: { flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(3) },
  actionBtn: { color: theme.colors.primary, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: theme.colors.bg,
  },
  title: { fontWeight: '700', color: theme.colors.text },
  meta: { color: theme.colors.muted, marginTop: 4 },
  badge: { marginTop: 6, color: theme.colors.primary, fontWeight: '600' },
  empty: { color: theme.colors.muted },
});
