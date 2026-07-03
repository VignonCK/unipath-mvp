// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getDefaultRoute, hasRole, hasSousRole, getUser, clearAuth } from '../utils/auth';

const ADMIN_PASSWORD_CHANGE_PATH = '/admin-etablissement/changer-mot-de-passe';
const COMMISSION_PASSWORD_CHANGE_PATH = '/commission/changer-mot-de-passe';

/**
 * @param {Array<string>} [allowedRoles]
 * @param {Array<string>} [allowedSousRoles] - Sous-rôles commission (EXAMINATEUR, CONTROLEUR)
 */
export default function ProtectedRoute({ children, allowedRoles = [], allowedSousRoles = [] }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to='/login' replace />;
  }

  const user = getUser();
  if (!user?.role) {
    clearAuth();
    return <Navigate to='/login' replace />;
  }

  if (
    user.role === 'ADMIN_ETABLISSEMENT'
    && user.mustChangePassword
    && location.pathname !== ADMIN_PASSWORD_CHANGE_PATH
  ) {
    return <Navigate to={ADMIN_PASSWORD_CHANGE_PATH} replace />;
  }

  if (
    user.role === 'COMMISSION'
    && user.mustChangePassword
    && location.pathname !== COMMISSION_PASSWORD_CHANGE_PATH
  ) {
    return <Navigate to={COMMISSION_PASSWORD_CHANGE_PATH} replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    const defaultRoute = getDefaultRoute(user?.role, user?.sousRole);
    return <Navigate to={defaultRoute} replace />;
  }

  if (allowedSousRoles.length > 0 && !hasSousRole(allowedSousRoles)) {
    const defaultRoute = getDefaultRoute(user?.role, user?.sousRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}
