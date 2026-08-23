import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import type { ModuleDefinition } from '@/types/modules';

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  return (
    <Link href={module.route as never} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{t(module.labelKey)}</ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.three,
    minWidth: 140,
  },
  pressed: {
    opacity: 0.7,
  },
});
