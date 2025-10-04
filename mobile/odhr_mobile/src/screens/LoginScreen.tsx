import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CONFIG } from '../config';
import { getCredentials, saveCredentials } from '../services/storage';

 type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [login, setLogin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(CONFIG.API_BASE_URL);

  useEffect(() => {
    (async () => {
      const { login, apiKey, baseUrl } = await getCredentials();
      if (login) setLogin(login);
      if (apiKey) setApiKey(apiKey);
      if (baseUrl) setBaseUrl(baseUrl);
    })();
  }, []);

  async function onContinue() {
    if (!login || !apiKey) {
      Alert.alert('Missing info', 'Please enter login and API key');
      return;
    }
    await saveCredentials(login, apiKey, baseUrl || CONFIG.API_BASE_URL);
    navigation.replace('Employees');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Odoo</Text>

      <Text style={styles.label}>Odoo Base URL</Text>
      <TextInput
        style={styles.input}
        placeholder="http://<host>:8069"
        autoCapitalize="none"
        value={baseUrl}
        onChangeText={setBaseUrl}
      />

      <Text style={styles.label}>Login (email)</Text>
      <TextInput
        style={styles.input}
        placeholder="user@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={login}
        onChangeText={setLogin}
      />

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Odoo API Key"
        autoCapitalize="none"
        secureTextEntry
        value={apiKey}
        onChangeText={setApiKey}
      />

      <Button title="Continue" onPress={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  label: { fontSize: 14, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
});
