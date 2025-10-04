import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Header } from '../ui/components/Header';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { theme } from '../ui/theme';
import { InlineAlert } from '../ui/components/InlineAlert';
import { SkeletonList } from '../ui/components/Skeleton';
import { listLeaves, LeavesResponse, LeaveItem } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

 type Props = NativeStackScreenProps<RootStackParamList, 'Leaves'>;

export default function LeavesListScreen({ navigation }: Props) {
  const [data, setData] = useState<LeavesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listLeaves({ limit: 20, offset: 0 });
      setData(resp);
    } catch (e: any) {
      setError(e?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: LeaveItem }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.holiday_status_id?.name || 'Leave'}</Text>
      <Text style={styles.meta}>{item.request_date_from} → {item.request_date_to}</Text>
      {item.state ? <Text style={styles.badge}>{item.state}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Leaves" right="New" onRightPress={() => navigation.navigate('LeaveCreate')} />
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
          <Text style={styles.empty}>No leaves yet. Tap New to request leave.</Text>
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
