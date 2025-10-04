import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getEmployee } from '../services/api';

 type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeDetail'>;

export default function EmployeeDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getEmployee(id);
        setData(resp);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator /></View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}><Text>Not found</Text></View>
    );
  }

  const avatarUri = data.image_1920 ? `data:image/png;base64,${data.image_1920}` : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}

      <Text style={styles.name}>{data.name}</Text>
      {data.job_title ? <Text style={styles.secondary}>{data.job_title}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        {data.work_email ? <Text>Email: {data.work_email}</Text> : null}
        {data.work_phone ? <Text>Work Phone: {data.work_phone}</Text> : null}
        {data.mobile_phone ? <Text>Mobile: {data.mobile_phone}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Organization</Text>
        {data.department_id ? <Text>Department: {data.department_id.name}</Text> : null}
        {data.work_location_id ? <Text>Location: {data.work_location_id.name}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emergency</Text>
        {data.emergency_contact_name ? <Text>Contact: {data.emergency_contact_name}</Text> : null}
        {data.emergency_contact_phone ? <Text>Phone: {data.emergency_contact_phone}</Text> : null}
        {data.probation_end_date ? <Text>Probation Ends: {data.probation_end_date}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 12, backgroundColor: '#eee' },
  placeholder: { backgroundColor: '#e5e5e5' },
  name: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  secondary: { color: '#666', textAlign: 'center', marginTop: 4 },
  card: { marginTop: 16, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  cardTitle: { fontWeight: '600', marginBottom: 6 },
});
