import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';

interface Props {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children?: React.ReactNode;
  redirectTo?: string;
}

export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  children,
  redirectTo = '/unauthorized',
}: Props) {
  const { has, hasAny, hasAll } = usePermission();

  let allowed = true;
  if (permission) allowed = has(permission);
  else if (anyOf?.length) allowed = hasAny(anyOf);
  else if (allOf?.length) allowed = hasAll(allOf);

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
