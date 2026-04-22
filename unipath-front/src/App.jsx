// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCandidat from './pages/DashboardCandidat';
import DashboardCommission from './pages/DashboardCommission';
import DashboardDGES from './pages/DashboardDGES';

function RouteProtegee({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to='/login' />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/' element={<Navigate to='/login' />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
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
        <Route path='/dges'
          element={
            <RouteProtegee>
              <DashboardDGES />
            </RouteProtegee>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;