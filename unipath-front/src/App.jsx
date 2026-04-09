// Importation des composants nécessaires de react-router-dom pour gérer le routage
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Importation des différentes pages de l'application
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCandidat from './pages/DashboardCandidat';
import DashboardCommission from './pages/DashboardCommission';

// Définition du composant principal App
function App() {
  return (
    // BrowserRouter englobe l'application pour activer le routage
    <BrowserRouter>
      {/* Définition des routes de l'application */}
      <Routes>
        {/* Route par défaut : redirige vers la page de login */}
        <Route path='/' element={<Navigate to='/login' />} />
        {/* Pages publiques accessibles sans authentification */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        {/* Pages protégées, accessibles après authentification */}
        <Route path='/dashboard' element={<DashboardCandidat />} />
        <Route path='/commission' element={<DashboardCommission />} />
      </Routes>
    </BrowserRouter>
  );
}

// Exportation du composant App pour l'utiliser ailleurs dans l'application
export default App;