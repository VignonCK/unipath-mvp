// src/components/CommissionLayout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

export default function CommissionLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = authService.getCurrentUser();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dossiers',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
        </svg>
      ),
      path: '/commission',
      active: location.pathname === '/commission' || location.pathname.startsWith('/commission/candidat'),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
        </svg>
      ),
      path: '/commission/notes',
      active: location.pathname === '/commission/notes',
    },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-800 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header Sidebar */}
        <div className='h-16 flex items-center justify-between px-4 border-b border-slate-700'>
          {sidebarOpen && (
            <div className='flex items-center gap-2'>
              <span className='text-lg font-semibold'>UniPath</span>
              <span className='text-xs text-slate-400'>Commission</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='p-2 rounded-lg hover:bg-slate-700 transition'
            title={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              {sidebarOpen ? (
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 19l-7-7 7-7m8 14l-7-7 7-7' />
              ) : (
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 5l7 7-7 7M5 5l7 7-7 7' />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className='p-4 space-y-1'>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                item.active
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              {item.icon}
              {sidebarOpen && (
                <span className='text-sm'>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold flex-shrink-0'>
              {user ? initiales(user.prenom || user.email?.[0], user.nom || user.email?.[1]) : 'C'}
            </div>
            {sidebarOpen && (
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>
                  {user?.prenom ? `${user.prenom} ${user.nom}` : user?.email}
                </p>
                <p className='text-slate-400 text-xs'>Commission</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm'
            title={!sidebarOpen ? 'Déconnexion' : ''}
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
            </svg>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
