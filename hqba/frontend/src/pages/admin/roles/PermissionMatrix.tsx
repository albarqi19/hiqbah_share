import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import type { PermissionGroup } from '@/types';

interface Props {
  groups: PermissionGroup[];
  selected: Set<string>;
  onToggle: (permission: string) => void;
  onToggleResource: (resource: string, allSelected: boolean) => void;
  disabledPermissions?: Set<string>;
  readOnly?: boolean;
}

export function PermissionMatrix({
  groups,
  selected,
  onToggle,
  onToggleResource,
  disabledPermissions,
  readOnly = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const groupSelected = group.permissions.filter((p) => selected.has(p.name));
        const allSelected = groupSelected.length === group.permissions.length;
        const someSelected = groupSelected.length > 0 && !allSelected;

        return (
          <div key={group.resource} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                  onCheckedChange={() => !readOnly && onToggleResource(group.resource, allSelected)}
                  disabled={readOnly}
                />
                <span className="font-semibold text-sm">
                  {t(`resource_${group.resource}`, { defaultValue: group.resource.replace(/_/g, ' ') })}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({groupSelected.length}/{group.permissions.length})
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
              {group.permissions.map((perm) => {
                const isDisabled = readOnly || disabledPermissions?.has(perm.name);
                const isInherited = disabledPermissions?.has(perm.name);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-2 text-sm rounded px-2 py-1.5 ${
                      isDisabled ? 'opacity-70 cursor-not-allowed bg-muted/40' : 'cursor-pointer hover:bg-accent'
                    }`}
                  >
                    <Checkbox
                      checked={selected.has(perm.name)}
                      onCheckedChange={() => !isDisabled && onToggle(perm.name)}
                      disabled={isDisabled}
                    />
                    <span className="flex-1">
                      {t(`action_${perm.action}`, { defaultValue: perm.action || perm.name })}
                    </span>
                    {isInherited && (
                      <span className="text-[10px] text-muted-foreground" title={t('inherited_from_role')}>
                        ({t('inherited')})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
