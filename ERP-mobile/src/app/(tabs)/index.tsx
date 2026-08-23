import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

// M0.1 route wiring: a plain landing screen linking to every M0 placeholder
// screen so they are reachable for manual testing. No business logic here.
const NAV_LINKS: { href: string; labelKey: string }[] = [
  { href: '/login', labelKey: 'login.title' },
  { href: '/dashboard', labelKey: 'dashboard.title' },
  { href: '/modules/sales', labelKey: 'modules.sales' },
  { href: '/modules/operations', labelKey: 'modules.operations' },
  { href: '/modules/qc', labelKey: 'modules.qc' },
  { href: '/modules/packaging', labelKey: 'modules.packaging' },
  { href: '/modules/inventory', labelKey: 'modules.inventory' },
  { href: '/modules/management', labelKey: 'modules.management' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          ERP Mobile
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Phase M0 — placeholder navigation
        </ThemedText>

        <ThemedView style={styles.linkList}>
          {NAV_LINKS.map((link) => (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href as never)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkRow}>
                <ThemedText type="smallBold">{t(link.labelKey)}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    alignItems: 'stretch',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  linkList: {
    gap: Spacing.two,
  },
  linkRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
