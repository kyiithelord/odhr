import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { listEmployees, EmployeeSummary } from '../services/api';
import { clearCredentials } from '../services/storage';
import { Header } from '../ui/components/Header';
import { SearchBar } from '../ui/components/SearchBar';
import { EmployeeCard } from '../ui/components/EmployeeCard';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { theme } from '../ui/theme';
import { BottomBar } from '../ui/components/BottomBar';

 type Props = NativeStackScreenProps<RootStackParamList, 'Employees'>;

export default function EmployeeListScreen({ navigation }: Props) {
  const [items, setItems] = useState<EmployeeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await listEmployees({ limit: PAGE_SIZE, offset: reset ? 0 : offset, search });
      if (reset) {
        setItems(resp.items);
      } else {
        setItems((prev: EmployeeSummary[]) => [...prev, ...resp.items]);
      }
      setHasMore(resp.items.length === PAGE_SIZE);
      setOffset((prev: number) => (reset ? PAGE_SIZE : prev + PAGE_SIZE));
    } catch (e: any) {
      setError(e?.message || 'Failed to load employees');
      if (reset) {
        setItems([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, offset, search]);

  useEffect(() => {
    // initial load
    load(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const onEndReached = () => {
    if (hasMore && !loading) load(false);
  };

  const onSearchSubmit = () => {
    setOffset(0);
    load(true);
  };

  const renderItem = ({ item }: { item: EmployeeSummary }) => (
    <EmployeeCard
      name={item.name}
      jobTitle={item.job_title}
      email={item.work_email}
      onPress={() => navigation.navigate('EmployeeDetail', { id: item.id, name: item.name })}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="Employees" right="Settings" onRightPress={() => navigation.replace('Login')} />
      <View style={styles.body}>
        <SearchBar
          style={{ marginBottom: theme.spacing(3) }}
          placeholder="Search name or email"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearchSubmit}
        />
      {error ? (
        <View style={{ marginBottom: theme.spacing(3) }}>
          <Text style={styles.error}>Error: {error}</Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginTop: theme.spacing(2) }}>
            <PrimaryButton title="Open Login" onPress={() => navigation.replace('Login')} />
            <PrimaryButton title="Clear Saved URL" onPress={async () => { await clearCredentials(); setItems([]); setOffset(0); setHasMore(true); setError(null); }} />
          </View>
        </View>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <Text style={styles.empty}>No employees found. Check Base URL, login, and API key in the Login screen, and ensure HR app is installed with employee data.</Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(it: EmployeeSummary) => String(it.id)}
        renderItem={renderItem}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: theme.spacing(4) }} /> : null}
      />
      </View>
      <BottomBar active="employees" navigation={navigation as any} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1, padding: theme.spacing(4) },
  error: { color: theme.colors.danger },
  empty: { color: theme.colors.muted },
});
