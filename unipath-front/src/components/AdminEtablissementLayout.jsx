import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, etablissementService } from '../services/api';
import { getUser } from '../utils/auth';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

export default function AdminEtablissementLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [etablissement, setEtablissement] = useState(null);

  useEffect(() => {
    if (!user?.etablissementId) return;
    etablissementService
      .getById(user.etablissementId)
      .then((data) => setEtablissement(data.etablissement || null))
      .catch(() => {});
  }, [user?.etablissementId]);

  const menuItems = [
    {
      name: 'Mes Campagnes',
      path: '/admin-etablissement/campagnes',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      name: 'Candidatures',
      subtitle: 'Consulter les dossiers',
      path: '/admin-etablissement/candidatures',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      name: 'Pré-inscriptions',
      subtitle: 'Décider (valider / rejeter)',
      path: '/admin-etablissement/preinscriptions',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
      name: 'Étudiants',
      path: '/admin-etablissement/etudiants',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      name: 'Mon Établissement',
      path: '/admin-etablissement/etablissement',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      name: 'Sécurité',
      path: '/admin-etablissement/securite',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const SidebarContent = () => (
    <>
      <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-teal-800">
        <span className="text-xl font-black text-white tracking-tight">UniPath</span>
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded">Admin</span>
      </div>
      {etablissement && (
        <div className="px-6 py-4 border-b border-teal-800">
          <p className="text-white font-semibold text-sm truncate">{etablissement.nom}</p>
          <p className="text-teal-200 text-xs">{etablissement.ville}</p>
        </div>
      )}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
              isActive(item.path) ? 'bg-orange-500 text-white shadow-lg' : 'text-teal-100 hover:bg-teal-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-left">
              <span className="block">{item.name}</span>
              {item.subtitle && (
                <span className={`block text-[10px] font-normal leading-tight ${isActive(item.path) ? 'text-orange-100' : 'text-teal-300'}`}>
                  {item.subtitle}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
      <div className="flex-shrink-0 border-t border-teal-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white">
            {initiales(user?.prenom, user?.nom)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-teal-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { authService.logout(); navigate('/login'); }}
          className="w-full px-4 py-2 text-sm font-medium text-orange-300 border border-orange-400 rounded-lg hover:bg-orange-500 hover:text-white transition"
        >
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-teal-900 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-900/75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-teal-900 h-full overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col flex-1">
        <header className="lg:hidden sticky top-0 z-40 bg-teal-900 px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm truncate flex-1">{etablissement?.nom || 'Admin établissement'}</span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
