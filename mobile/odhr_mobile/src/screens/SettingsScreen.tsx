import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Header } from '../ui/components/Header';
import { PrimaryButton } from '../ui/components/PrimaryButton';
import { InlineAlert } from '../ui/components/InlineAlert';
import { theme } from '../ui/theme';
import { getCredentials, saveCredentials, clearCredentials } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const [login, setLogin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const { signOut, me } = useAuth();

  useEffect(() => {
    (async () => {
      const c = await getCredentials();
      setLogin(c.login || '');
      setApiKey(c.apiKey || '');
      setBaseUrl(c.baseUrl || '');
    })();
  }, []);

  async function onSave() {
    await saveCredentials(login, apiKey, baseUrl);
    setMsg('Saved');
    setTimeout(() => setMsg(null), 2000);
  }

  async function onClear() {
    await clearCredentials();
    setLogin(''); setApiKey(''); setBaseUrl('');
    setMsg('Cleared');
    setTimeout(() => setMsg(null), 2000);
  }

  async function onSignOut() {
    await signOut();
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <View style={styles.body}>
        {msg ? <InlineAlert text={msg} style={{ marginBottom: theme.spacing(3) }} /> : null}
        {me ? (
          <InlineAlert text={`Signed in as ${me.name} (${me.login}) • Roles: ${me.roles.join(', ')}`} style={{ marginBottom: theme.spacing(3) }} />
        ) : null}
        <Text style={styles.label}>Base URL (include ?db=...)</Text>
        <TextInput style={styles.input} value={baseUrl} onChangeText={setBaseUrl} placeholder="http://localhost:8069/?db=odhr" />
        <Text style={styles.label}>Login (email)</Text>
        <TextInput style={styles.input} value={login} onChangeText={setLogin} placeholder="user@example.com" autoCapitalize="none" />
        <Text style={styles.label}>API Key</Text>
        <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="Your Odoo API Key" autoCapitalize="none" secureTextEntry />
        <PrimaryButton title="Save" onPress={onSave} />
        <View style={{ height: theme.spacing(2) }} />
        <PrimaryButton title="Clear" onPress={onClear} />
        <View style={{ height: theme.spacing(2) }} />
        <PrimaryButton title="Sign out" onPress={onSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1, padding: theme.spacing(4), gap: theme.spacing(3) },
  label: { fontWeight: '600', color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing(3) },
});
