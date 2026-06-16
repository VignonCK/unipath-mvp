// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getDefaultRoute, hasRole, hasSousRole, getUser, clearAuth } from '../utils/auth';

/**
 * @param {Array<string>} [allowedRoles]
 * @param {Array<string>} [allowedSousRoles] - Sous-rôles commission (EXAMINATEUR, CONTROLEUR)
 */
export default function ProtectedRoute({ children, allowedRoles = [], allowedSousRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to='/login' replace />;
  }

  const user = getUser();
  if (!user?.role) {
    clearAuth();
    return <Navigate to='/login' replace />;
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
