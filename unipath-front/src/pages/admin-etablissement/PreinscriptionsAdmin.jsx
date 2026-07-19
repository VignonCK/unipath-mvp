import { Navigate } from 'react-router-dom';

/** Ancienne page Pré-inscriptions — redirigée vers Candidatures (dossier + verdict unifiés). */
export default function PreinscriptionsAdmin() {
  return <Navigate to="/admin-etablissement/candidatures" replace />;
}
