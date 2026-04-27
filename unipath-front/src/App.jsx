// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCandidat from './pages/DashboardCandidat';
import DashboardCommission from './pages/DashboardCommission';
import DashboardDGES from './pages/DashboardDGES';
import PageConcours from './pages/PageConcours';
import AccueilCandidat from './pages/AccueilCandidat';
import MonCompte from './pages/MonCompte';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

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
          path='/concours'
          element={
            <ProtectedRoute allowedRoles={['CANDIDAT']}>
              <PageConcours />
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

        {/* Routes protégées - DGES et COMMISSION */}
        <Route
          path='/dges'
          element={
            <ProtectedRoute allowedRoles={['DGES', 'COMMISSION']}>
              <DashboardDGES />
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