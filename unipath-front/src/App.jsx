// src/App.jsx
// Point central de la navigation de l'application
// Contient les routes publiques et les routes protégées

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCandidat from './pages/DashboardCandidat';
import DashboardCommission from './pages/DashboardCommission';

// Composant qui protège une route
// Si l'utilisateur n'est pas connecté → redirige vers /login
// Si connecté → affiche la page demandée
function RouteProtegee({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to='/login' />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection par défaut vers login */}
        <Route path='/' element={<Navigate to='/login' />} />

        {/* Routes publiques — accessibles sans connexion */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Routes protégées — redirige vers /login si pas connecté */}
        <Route path='/dashboard'
          element={
            <RouteProtegee>
              <DashboardCandidat />
            </RouteProtegee>
          }
        />
        <Route path='/commission'
          element={
            <RouteProtegee>
              <DashboardCommission />
            </RouteProtegee>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;