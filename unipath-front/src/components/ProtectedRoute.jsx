// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, getDefaultRoute, hasRole } from '../utils/auth';

/**
 * Composant pour protéger les routes selon le rôle de l'utilisateur
 * ✅ Utilise les utilitaires d'authentification centralisés
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à afficher si autorisé
 * @param {Array<string>} props.allowedRoles - Liste des rôles autorisés (ex: ['CANDIDAT', 'COMMISSION'])
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  // 1. Vérifier si l'utilisateur est connecté
  if (!isAuthenticated()) {
    return <Navigate to='/login' replace />;
  }

  // 2. Vérifier le rôle si des rôles sont spécifiés
  if (allowedRoles.length > 0) {
    const userRole = getUserRole();

    // Si l'utilisateur n'a pas le bon rôle, rediriger vers son dashboard
    if (!hasRole(allowedRoles)) {
      const defaultRoute = getDefaultRoute(userRole);
      return <Navigate to={defaultRoute} replace />;
    }
  }

  // 3. Si tout est OK, afficher le composant
  return children;
}
