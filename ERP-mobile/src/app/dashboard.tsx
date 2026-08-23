import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModuleCard } from '@/components/ModuleCard';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { MODULE_DEFINITIONS } from '@/types/modules';

// Role-based filtering is not applied yet — all modules are shown until the
// real session/permission cache is wired up.
export default function DashboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OfflineBanner />
        <ThemedText type="subtitle">{t('dashboard.title')}</ThemedText>
        <ThemedView style={styles.grid}>
          {MODULE_DEFINITIONS.map((module) => (
            <ModuleCard key={module.key} module={module} />
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
