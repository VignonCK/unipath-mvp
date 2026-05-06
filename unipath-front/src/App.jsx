// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/auth/callback' element={<AuthCallback />} />

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