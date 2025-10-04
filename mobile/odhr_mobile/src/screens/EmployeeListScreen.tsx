import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { listEmployees, EmployeeSummary } from '../services/api';

 type Props = NativeStackScreenProps<RootStackParamList, 'Employees'>;

export default function EmployeeListScreen({ navigation }: Props) {
  const [items, setItems] = useState<EmployeeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const load = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await listEmployees({ limit: PAGE_SIZE, offset: reset ? 0 : offset, search });
      if (reset) {
        setItems(resp.items);
      } else {
        setItems((prev: EmployeeSummary[]) => [...prev, ...resp.items]);
      }
      setHasMore(resp.items.length === PAGE_SIZE);
      setOffset((prev: number) => (reset ? PAGE_SIZE : prev + PAGE_SIZE));
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
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('EmployeeDetail', { id: item.id, name: item.name })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.secondary}>{item.job_title || ''}</Text>
      <Text style={styles.secondary}>{item.work_email || ''}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search name or email"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(it: EmployeeSummary) => String(it.id)}
        renderItem={renderItem}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchRow: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  search: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
  row: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600' },
  secondary: { color: '#666', marginTop: 2 },
});
