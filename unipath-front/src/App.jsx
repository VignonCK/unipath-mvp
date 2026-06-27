// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/academicBento.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import EmailConfirmation from './pages/EmailConfirmation';
import DashboardCommission from './pages/DashboardCommission';
import DetailCandidatCommission from './pages/DetailCandidatCommission';
import DashboardDGES from './pages/DashboardDGES';
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

        {/* Routes protégées - Étudiant / Candidat */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <AccueilEtudiant />
            </ProtectedRoute>
          }
        />

        <Route
          path='/mes-concours'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <AccueilCandidat />
            </ProtectedRoute>
          }
        />

        <Route
          path='/etablissements-prives'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <EtablissementsPrives />
            </ProtectedRoute>
          }
        />

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

        <Route
          path='/concours'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <PageConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/:id'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/:id/classement'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <ClassementConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/inscription/:inscriptionId'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/etudiant'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DashboardEtudiant />
            </ProtectedRoute>
          }
        />

        <Route
          path='/mes-inscriptions-academiques'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <MesInscriptionsAcademiques />
            </ProtectedRoute>
          }
        />

        <Route
          path='/demande-inscription'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DemandeInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/inscription-academique'
          element={<Navigate to='/demande-inscription' replace />}
        />

        <Route
          path='/campagnes-inscription'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <PageCampagnesInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/campagnes-inscription/:id'
          element={
            <ProtectedRoute allowedRoles={STUDENT_ROLES}>
              <DetailCampagneCandidat />
            </ProtectedRoute>
          }
        />

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

        {/* Routes protégées - EXAMINATEUR (sous-rôle de COMMISSION) */}
        <Route
          path='/examinateur/dossiers'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['EXAMINATEUR']}>
              <ListeDossiersExaminateur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/examinateur/dossiers/:dossierInscriptionId'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['EXAMINATEUR']}>
              <DetailDossierExaminateur />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - CONTROLEUR (sous-rôle de COMMISSION) */}
        <Route
          path='/controleur-commission/tableau-de-bord'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['CONTROLEUR']}>
              <TableauDeBordControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['CONTROLEUR']}>
              <ListeDossiersControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers/:dossierInscriptionId'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['CONTROLEUR']}>
              <DetailDossierControleur />
            </ProtectedRoute>
          }
        />

        <Route
          path='/controleur-commission/dossiers-sans-verdict'
          element={
            <ProtectedRoute allowedRoles={['COMMISSION']} allowedSousRoles={['CONTROLEUR']}>
              <DossiersSansVerdictControleur />
            </ProtectedRoute>
          }
        />

        {/* Routes protégées - DGES uniquement */}
        <Route
          path='/dashboard-dges'
          element={
            <ProtectedRoute allowedRoles={['DGES']}>
              <DashboardDGES />
            </ProtectedRoute>
          }
        />

        <Route
          path='/gestion-concours'
          element={
            <ProtectedRoute allowedRoles={['DGES']}>
              <GestionConcours />
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