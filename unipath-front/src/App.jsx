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
import InscriptionAcademique from './pages/InscriptionAcademique';
import EspaceEtablissement from './pages/EspaceEtablissement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/auth/callback' element={<AuthCallback />} />
        <Route path='/auth/confirm' element={<EmailConfirmation />} />
        <Route path='/design-demo' element={<DesignSystemDemo />} />

        {/* Routes protégées - CANDIDAT uniquement */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <AccueilCandidat />
            </ProtectedRoute>
          }
        />

        <Route
          path='/mon-compte'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <MonCompte />
            </ProtectedRoute>
          }
        />

        <Route
          path='/ma-carte'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <CarteCandidat />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <PageConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/:id'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <DetailConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/concours/:id/classement'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <ClassementConcours />
            </ProtectedRoute>
          }
        />

        <Route
          path='/inscription/:inscriptionId'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <DetailInscription />
            </ProtectedRoute>
          }
        />

        <Route
          path='/etudiant'
          element={
            <ProtectedRoute>
              <DashboardEtudiant />
            </ProtectedRoute>
          }
        />

        <Route
          path='/inscription-academique'
          element={
            <ProtectedRoute>
              <InscriptionAcademique />
            </ProtectedRoute>
          }
        />

        <Route
          path='/etablissement'
          element={
            <ProtectedRoute>
              <EspaceEtablissement />
            </ProtectedRoute>
          }
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

        {/* Route par défaut - 404 */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;