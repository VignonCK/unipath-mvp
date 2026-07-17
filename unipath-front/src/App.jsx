// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './styles/academicBento.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import EmailConfirmation from './pages/EmailConfirmation';
import DashboardCommission from './pages/DashboardCommission';
import MesConcoursCommission from './pages/MesConcoursCommission';
import DetailCandidatCommission from './pages/DetailCandidatCommission';
import DashboardDGES from './pages/DashboardDGES';
import DashboardDEC from './pages/DashboardDEC';
import GestionConcours from './pages/GestionConcours';
import GestionNotes from './pages/GestionNotes';
import ClassementConcours from './pages/ClassementConcours';
import PageConcours from './pages/PageConcours';
import DetailConcours from './pages/DetailConcours';
import CarteCandidat from './pages/CarteCandidat';
import AccueilCandidat from './pages/AccueilCandidat';
import AccueilEtudiant from './pages/AccueilEtudiant';
import EtablissementsPrives from './pages/EtablissementsPrives';
import { STUDENT_ROLES } from './utils/auth';
import MonCompte from './pages/MonCompte';
import DetailInscription from './pages/DetailInscription';
import DesignSystemDemo from './pages/DesignSystemDemo';
import ProtectedRoute from './components/ProtectedRoute';
import ListeDossiersExaminateur from './pages/ListeDossiersExaminateur';
import DetailDossierExaminateur from './pages/DetailDossierExaminateur';
import TableauDeBordControleur from './pages/TableauDeBordControleur';
import ListeDossiersControleur from './pages/ListeDossiersControleur';
import DetailDossierControleur from './pages/DetailDossierControleur';
import DossiersSansVerdictControleur from './pages/DossiersSansVerdictControleur';
import DashboardEtudiant from './pages/DashboardEtudiant';
import DemandeInscription from './pages/DemandeInscription';
import MesInscriptionsAcademiques from './pages/MesInscriptionsAcademiques';
import DGESEtablissementsAdmins from './pages/dges/DGESEtablissementsAdmins';
import DECEtablissementsPublics from './pages/dec/DECEtablissementsPublics';
import DECAnneesAcademiques from './pages/dec/DECAnneesAcademiques';
import DGESCommissionEtablissement from './pages/dges/DGESCommissionEtablissement';
import MesCampagnes from './pages/admin-etablissement/MesCampagnes';
import CampagneForm from './pages/admin-etablissement/CampagneForm';
import DetailCampagneAdmin from './pages/admin-etablissement/DetailCampagneAdmin';
import MonEtablissementAdmin from './pages/admin-etablissement/MonEtablissementAdmin';
import ChangerMotDePasseObligatoire from './pages/admin-etablissement/ChangerMotDePasseObligatoire';
import SecuriteCompteAdmin from './pages/admin-etablissement/SecuriteCompteAdmin';
import CandidaturesAdmin from './pages/admin-etablissement/CandidaturesAdmin';
import DetailCandidatureAdmin from './pages/admin-etablissement/DetailCandidatureAdmin';
import PreinscriptionsAdmin from './pages/admin-etablissement/PreinscriptionsAdmin';
import ValidationQuittances from './pages/admin-etablissement/ValidationQuittances';
import EtudiantsAdmin from './pages/admin-etablissement/EtudiantsAdmin';
import ResetPassword from './pages/ResetPassword';
import PageCampagnesInscription from './pages/campagnes/PageCampagnesInscription';
import DetailCampagneCandidat from './pages/campagnes/DetailCampagneCandidat';
import EtablissementDetail from './pages/candidat/EtablissementDetail';
import AccueilParcours from './pages/AccueilParcours';

function LegacyConcoursDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/concours/ouverts/${id}`} replace />;
}

function LegacyConcoursClassementRedirect() {
  const { id } = useParams();
  return <Navigate to={`/concours/ouverts/${id}/classement`} replace />;
}

function LegacyInscriptionRedirect() {
  const { inscriptionId } = useParams();
  return <Navigate to={`/concours/inscription/${inscriptionId}`} replace />;
}

function LegacyCampagneRedirect() {
  const { id } = useParams();
  return <Navigate to={`/parcours/campagnes/${id}`} replace />;
}

function LegacyEtablissementRedirect() {
  const { id } = useParams();
  return <Navigate to={`/parcours/etablissements/${id}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/register' element={<Register />} />
        <Route
          path='/register-etablissement'
          element={
            <Navigate
              to='/login'
              replace
              state={{ message: 'Les établissements privés reçoivent un compte administrateur de la DGES.', type: 'info' }}
            />
          }
        />
        <Route path='/auth/callback' element={<AuthCallback />} />
        <Route path='/auth/confirm' element={<EmailConfirmation />} />
        <Route path='/confirmer-email' element={<EmailConfirmation />} />
        <Route path='/design-demo' element={<DesignSystemDemo />} />

        {/* Hub — choix du module */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <AccueilEtudiant />
            </ProtectedRoute>
          }
        />

        {/* Compte partagé */}
        <Route
          path='/mon-compte'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <MonCompte />
            </ProtectedRoute>
          }
        />

        <Route
          path='/ma-carte'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <CarteCandidat />
            </ProtectedRoute>
          }
        />

        {/* Module 1 — Concours */}
        <Route
          path='/concours'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <AccueilCandidat />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/ouverts'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <PageConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/ouverts/:id'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/ouverts/:id/classement'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <ClassementConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/inscription/:inscriptionId'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailInscription />
            </ProtectedRoute>
          }
        />

        {/* Module 2 — Parcours académique */}
        <Route
          path='/parcours'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <AccueilParcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/etablissements'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <EtablissementsPrives />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/etablissements/:id'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <EtablissementDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/dossiers'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DemandeInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/mes-inscriptions'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <MesInscriptionsAcademiques />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/campagnes'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <PageCampagnesInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/campagnes/:id'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailCampagneCandidat />
            </ProtectedRoute>
          }
        />

        <Route
          path='/parcours/releve'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DashboardEtudiant />
            </ProtectedRoute>
          }
        />

        {/* Redirections legacy */}
        <Route path='/mes-concours' element={<Navigate to='/concours' replace />} />
        <Route path='/concours/:id/classement' element={<LegacyConcoursClassementRedirect />} />
        <Route path='/concours/:id' element={<LegacyConcoursDetailRedirect />} />
        <Route path='/inscription/:inscriptionId' element={<LegacyInscriptionRedirect />} />
        <Route path='/etablissements-prives' element={<Navigate to='/parcours/etablissements' replace />} />
        <Route path='/etablissements-prives/:id' element={<LegacyEtablissementRedirect />} />
        <Route path='/demande-inscription' element={<Navigate to='/parcours/dossiers' replace />} />
        <Route path='/mes-inscriptions-academiques' element={<Navigate to='/parcours/mes-inscriptions' replace />} />
        <Route path='/inscription-academique' element={<Navigate to='/parcours/dossiers' replace />} />
        <Route path='/campagnes-inscription' element={<Navigate to='/parcours/campagnes' replace />} />
        <Route path='/campagnes-inscription/:id' element={<LegacyCampagneRedirect />} />
        <Route path='/etudiant' element={<Navigate to='/parcours/releve' replace />} />

        <Route
          path='/etablissement'
          element={<Navigate to='/login' replace state={{ message: 'Utilisez votre compte administrateur d\'établissement.', type: 'info' }} />}
        />

        {/* Routes protégées - COMMISSION uniquement */}
        <Route
          path='/commission'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <DashboardCommission />
            </ProtectedRoute>
          }
        />

        <Route
          path='/commission/mes-concours'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <MesConcoursCommission />
            </ProtectedRoute>
          }
        />

        <Route
          path='/commission/changer-mot-de-passe'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <ChangerMotDePasseObligatoire />
            </ProtectedRoute>
          }
        />

        <Route
          path='/commission/notes'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <GestionNotes />
            </ProtectedRoute>
          }
        />

        <Route
          path='/commission/candidat/:inscriptionId'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <DetailCandidatCommission />
            </ProtectedRoute>
          }
        />

        {/* Espace examinateur (accès résolu par affectation concours) */}
        <Route
          path='/examinateur/dossiers'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <ListeDossiersExaminateur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/examinateur/dossiers/:dossierInscriptionId'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <DetailDossierExaminateur />
            </ProtectedRoute>
          }
        />

        {/* Espace contrôleur (accès résolu par affectation concours) */}
        <Route
          path='/controleur-commission/tableau-de-bord'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <TableauDeBordControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <ListeDossiersControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers/:dossierInscriptionId'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <DetailDossierControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers-sans-verdict'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']}>
              <DossiersSansVerdictControleur />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - DGES (module 2) */}
        <Route
          path='/dashboard-dges'
          element={
            <ProtectedRoute allowedRoles={['DGES']}>
              <DashboardDGES />
            </ProtectedRoute>
          }
        />

        <Route
          path='/dges-etablissements-admins'
          element={
            <ProtectedRoute allowedRoles={['DGES']}>
              <DGESEtablissementsAdmins />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - DEC (module 1) */}
        <Route
          path='/dashboard-dec'
          element={
            <ProtectedRoute allowedRoles={['DEC']}>
              <DashboardDEC />
            </ProtectedRoute>
          }
        />

        <Route
          path='/gestion-concours'
          element={
            <ProtectedRoute allowedRoles={['DEC']}>
              <GestionConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/dec-etablissements-publics'
          element={
            <ProtectedRoute allowedRoles={['DEC']}>
              <DECEtablissementsPublics />
            </ProtectedRoute>
          }
        />

        <Route
          path='/dec-annees-academiques'
          element={
            <ProtectedRoute allowedRoles={['DEC']}>
              <DECAnneesAcademiques />
            </ProtectedRoute>
          }
        />

        <Route
          path='/dges/etablissements/:etablissementId/commission'
          element={
            <ProtectedRoute allowedRoles={['DEC']}>
              <DGESCommissionEtablissement />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - ADMIN_ETABLISSEMENT */}
        <Route
          path='/admin-etablissement/changer-mot-de-passe'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <ChangerMotDePasseObligatoire />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/campagnes'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <MesCampagnes />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/campagnes/nouvelle'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <CampagneForm />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/campagnes/:id/modifier'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <CampagneForm />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/campagnes/:id'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <DetailCampagneAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/etablissement'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <MonEtablissementAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/candidatures'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <CandidaturesAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/candidatures/:id'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <DetailCandidatureAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/preinscriptions'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <PreinscriptionsAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/validation-quittances'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <ValidationQuittances />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/etudiants'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <EtudiantsAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-etablissement/securite'
          element={
            <ProtectedRoute allowedRoles={['ADMIN_ETABLISSEMENT']}>
              <SecuriteCompteAdmin />
            </ProtectedRoute>
          }
        />

        {/* Route par défaut - 404 */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;