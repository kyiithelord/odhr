import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Header } from '../ui/components/Header';
import { InlineAlert } from '../ui/components/InlineAlert';
import { SkeletonList } from '../ui/components/Skeleton';
import { theme } from '../ui/theme';
import { listAttendances, AttendanceItem, AttendancesResponse } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

 type Props = NativeStackScreenProps<RootStackParamList, 'Attendance'>;

export default function AttendanceListScreen({ navigation }: Props) {
  const [data, setData] = useState<AttendancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
