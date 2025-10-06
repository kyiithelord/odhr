import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, RefreshControl, StyleSheet } from 'react-native';
import { listAnnouncements, type Announcement } from '../api/odoo';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementsScreen() {
  const { cfg } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  async function load(reset = false) {
    if (!cfg) return;
    setLoading(true);
    try {
      const limit = 20;
      const res = await listAnnouncements(cfg, { limit, offset: reset ? 0 : offset });
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
          <View style={styles.card}>
            <Text style={styles.title}>{item.subject || 'Announcement'}</Text>
            {!!item.author_name && <Text style={styles.meta}>{item.author_name}</Text>}
            <Text style={styles.meta}>{new Date(item.date).toLocaleString()}</Text>
            {!!item.body_text && <Text style={styles.body} numberOfLines={4}>{item.body_text}</Text>}
          </View>
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
  body: { marginTop: 8, fontSize: 14, color: '#333' },
});
