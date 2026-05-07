// src/components/CandidatLayout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import NotificationCenter from './NotificationCenter';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const NAV_ITEMS = [
  { label: 'Accueil',            path: '/dashboard',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Concours',           path: '/concours',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Parcours académique', path: '/parcours',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Mon compte',         path: '/mon-compte', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function CandidatLayout({ children, candidat, photoUrl }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();

  const handleNav = (item) => {
    setSidebarOpen(false);
    if (item.anchor) {
      navigate(item.path);
      setTimeout(() => {
        document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  const isActive = (item) => {
    if (item.anchor) return false;
    return location.pathname === item.path;
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>

      {/* HEADER */}
      <header className='bg-blue-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg'>
        <div className='flex items-center gap-3'>
          {/* Burger mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='lg:hidden p-1.5 rounded-lg hover:bg-blue-800 transition'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
          <span className='text-xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-xs'>Espace Candidat</span>
        </div>

        <div className='flex items-center gap-3'>
          {/* Notification Center */}
          <NotificationCenter />
          
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 border-2 border-orange-400'>
              {photoUrl
                ? <img src={photoUrl} alt='profil' className='w-full h-full object-cover' />
                : initiales(candidat?.prenom, candidat?.nom)
              }
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold leading-tight'>{nom}</p>
              <p className='text-orange-300 text-xs font-mono'>{candidat?.matricule}</p>
            </div>
          </div>
          <button
            onClick={() => { authService.logout(); navigate('/login'); }}
            className='text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition'
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className='flex flex-1'>

        {/* SIDEBAR */}
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 bg-black/40 z-30 lg:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed top-[52px] left-0 h-[calc(100vh-52px)] w-56 bg-white border-r border-gray-100 shadow-sm z-30
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-auto lg:shadow-none
        `}>
          <nav className='p-4 space-y-1'>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                  isActive(item)
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-900'
                }`}
              >
                <svg className='w-4 h-4 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Matricule en bas de sidebar */}
          {candidat?.matricule && (
            <div className='absolute bottom-6 left-4 right-4'>
              <div className='bg-blue-50 rounded-xl px-3 py-2.5'>
                <p className='text-xs text-gray-400 mb-0.5'>Matricule</p>
                <p className='text-xs font-mono font-bold text-blue-900'>{candidat.matricule}</p>
              </div>
            </div>
          )}
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className='flex-1 min-w-0 p-4 sm:p-6'>
          {children}
        </main>

      </div>
    </div>
  );
}
