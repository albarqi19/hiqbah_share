import { usePermission } from '@/hooks/usePermission';

interface Props {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ permission, anyOf, allOf, fallback = null, children }: Props) {
  const { has, hasAny, hasAll } = usePermission();

  let allowed = true;
  if (permission) allowed = has(permission);
  else if (anyOf?.length) allowed = hasAny(anyOf);
  else if (allOf?.length) allowed = hasAll(allOf);

  return <>{allowed ? children : fallback}</>;
}
