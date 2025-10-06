import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { listPayslips, type Payslip } from '../api/odoo';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

 type Props = NativeStackScreenProps<RootStackParamList, 'Payslips'>;

export default function PayslipsScreen({ navigation }: Props) {
  const { cfg } = useAuth();
  const [items, setItems] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  async function load(reset = false) {
    if (!cfg) return;
    setLoading(true);
    try {
      const limit = 20;
      const res = await listPayslips(cfg, { limit, offset: reset ? 0 : offset });
      setTotal(res.total);
      setOffset((reset ? 0 : offset) + res.items.length);
      setItems(reset ? res.items : [...items, ...res.items]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(true); }, [cfg?.baseUrl, cfg?.db]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(true)} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (items.length < total && !loading) load(false); }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PayslipDetail', { id: item.id })}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{new Date(item.date_from).toLocaleDateString()} - {new Date(item.date_to).toLocaleDateString()}</Text>
            <Text style={styles.amount}>Net: {item.net_wage?.toFixed?.(2) ?? item.net_wage}</Text>
            <Text style={styles.meta}>State: {item.state}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12, color: '#666' },
  amount: { marginTop: 8, fontSize: 14, color: '#333' },
});
