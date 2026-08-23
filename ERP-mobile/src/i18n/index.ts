import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

export type Locale = 'en' | 'ar';

const dictionaries = { en, ar } as const;

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

// Minimal dotted-path lookup, e.g. t('modules.sales'). No interpolation/pluralization yet.
export function t(path: string): string {
  const segments = path.split('.');
  let value: unknown = dictionaries[currentLocale];
  for (const segment of segments) {
    if (typeof value !== 'object' || value === null) return path;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' ? value : path;
}
