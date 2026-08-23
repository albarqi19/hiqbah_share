export type ModuleKey = 'sales' | 'operations' | 'qc' | 'packaging' | 'inventory' | 'management';

export interface ModuleDefinition {
  key: ModuleKey;
  route: string;
  labelKey: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { key: 'sales', route: '/modules/sales', labelKey: 'modules.sales' },
  { key: 'operations', route: '/modules/operations', labelKey: 'modules.operations' },
  { key: 'qc', route: '/modules/qc', labelKey: 'modules.qc' },
  { key: 'packaging', route: '/modules/packaging', labelKey: 'modules.packaging' },
  { key: 'inventory', route: '/modules/inventory', labelKey: 'modules.inventory' },
  { key: 'management', route: '/modules/management', labelKey: 'modules.management' },
];
