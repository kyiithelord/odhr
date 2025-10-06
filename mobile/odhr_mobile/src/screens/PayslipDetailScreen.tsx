import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { getPayslipDetails, getPayslipPDF, type SalaryLine } from '../api/odoo';

 type Props = NativeStackScreenProps<RootStackParamList, 'PayslipDetail'>;

export default function PayslipDetailScreen({ route }: Props) {
  const { cfg } = useAuth();
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('');
  const [lines, setLines] = useState<SalaryLine[]>([]);

  useEffect(() => {
    (async () => {
      if (!cfg) return;
      setLoading(true);
      try {
        const res = await getPayslipDetails(cfg, id);
        setName(res.payslip.name);
        setPeriod(`${new Date(res.payslip.date_from).toLocaleDateString()} - ${new Date(res.payslip.date_to).toLocaleDateString()}`);
        setLines(res.lines);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load payslip');
      } finally {
        setLoading(false);
      }
    })();
  }, [cfg?.baseUrl, cfg?.db, id]);

  async function onDownload() {
    if (!cfg) return;
    try {
      const pdf = await getPayslipPDF(cfg, id);
      Alert.alert('Payslip PDF', `Received ${pdf.filename} (base64 length ${pdf.pdf_base64.length}). Integrate FileSystem to save.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to fetch PDF');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.meta}>{period}</Text>
      <TouchableOpacity style={styles.button} onPress={onDownload}>
        <Text style={styles.buttonText}>Download PDF</Text>
      </TouchableOpacity>
      <View style={{ height: 12 }} />
      {lines.map((l, idx) => (
        <View key={idx} style={styles.lineRow}>
          <Text style={styles.lineName}>{l.name} ({l.code})</Text>
          <Text style={styles.lineAmt}>{l.amount.toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 12, color: '#666', marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  lineName: { fontSize: 14, color: '#333' },
  lineAmt: { fontSize: 14, fontWeight: '600' },
});
