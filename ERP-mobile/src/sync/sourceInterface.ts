import { Platform } from 'react-native';

import type { SourceInterface } from '@/types/sync';

export function getSourceInterface(): SourceInterface {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return 'WEB';
}
