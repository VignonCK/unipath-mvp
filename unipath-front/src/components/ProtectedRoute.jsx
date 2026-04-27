// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

/**
 * Composant pour protéger les routes selon le rôle de l'utilisateur
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à afficher si autorisé
 * @param {Array<string>} props.allowedRoles - Liste des rôles autorisés (ex: ['CANDIDAT', 'COMMISSION'])
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // 1. Vérifier si l'utilisateur est connecté
  if (!token) {
    return <Navigate to='/login' replace />;
  }

  // 2. Vérifier le rôle si des rôles sont spécifiés
  if (allowedRoles.length > 0) {
    try {
      const user = JSON.parse(userStr);
      const userRole = user?.role;

      // Si l'utilisateur n'a pas le bon rôle, rediriger vers son dashboard
      if (!allowedRoles.includes(userRole)) {
        // Redirection selon le rôle
        switch (userRole) {
          case 'CANDIDAT':
            return <Navigate to='/dashboard' replace />;
          case 'COMMISSION':
            return <Navigate to='/commission' replace />;
          case 'DGES':
            return <Navigate to='/dges' replace />;
          default:
            return <Navigate to='/login' replace />;
        }
      }
    } catch (error) {
      console.error('Erreur parsing user:', error);
      // Si erreur de parsing, déconnecter l'utilisateur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to='/login' replace />;
    }
  }

  // 3. Si tout est OK, afficher le composant
  return children;
}
