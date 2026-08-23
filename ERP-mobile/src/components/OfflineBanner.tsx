import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { useConnectivity } from '@/sync/connectivity';

export function OfflineBanner() {
  const connectivity = useConnectivity();

  if (connectivity !== 'offline') {
    return null;
  }

  return (
    <ThemedView type="backgroundElement" style={styles.banner}>
      <ThemedText type="small">{t('offline.banner')}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
