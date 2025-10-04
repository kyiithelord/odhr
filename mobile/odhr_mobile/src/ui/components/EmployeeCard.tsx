import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme';

export type EmployeeCardProps = {
  name: string;
  jobTitle?: string;
  email?: string;
  avatarBase64?: string | false;
  onPress?: () => void;
};

export function EmployeeCard({ name, jobTitle, email, avatarBase64, onPress }: EmployeeCardProps) {
  const avatarUri = avatarBase64 ? `data:image/png;base64,${avatarBase64}` : undefined;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        {!!jobTitle && <Text style={styles.meta}>{jobTitle}</Text>}
        {!!email && <Text style={styles.meta}>{email}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee' },
  placeholder: { backgroundColor: '#e5e5e5' },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  meta: { color: theme.colors.muted, marginTop: 2 },
});
