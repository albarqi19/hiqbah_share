import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';

// UI placeholder only. No real authentication call is wired up in Phase M0.
export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">{t('login.title')}</ThemedText>

        <TextInput
          placeholder={t('login.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder={t('login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <ThemedView type="backgroundElement" style={styles.submitButton}>
          <ThemedText type="smallBold">{t('login.submit')}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#60646C',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  submitButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
});
