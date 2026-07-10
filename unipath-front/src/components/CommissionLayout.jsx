// src/components/CommissionLayout.jsx
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import NotificationCenter from './NotificationCenter';
import BottomTabNav from './BottomTabNav';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const ESPACE_LABELS = {
  EXAMINATEUR: 'Examinateur',
  CONTROLEUR: 'Contrôleur',
};

function getEspaceLabel(sousRole) {
  return ESPACE_LABELS[sousRole] || 'Commission';
}

function getTabs(sousRole) {
  if (sousRole === 'EXAMINATEUR') {
    return [
      {
        label: 'Dossiers',
        path: '/examinateur/dossiers',
        activePrefixes: ['/examinateur'],
      },
    ];
  }

  if (sousRole === 'CONTROLEUR') {
    return [
      {
        label: 'Tableau de bord',
        path: '/controleur-commission/tableau-de-bord',
        activePrefixes: ['/controleur-commission/tableau-de-bord'],
      },
      {
        label: 'Dossiers',
        path: '/controleur-commission/dossiers',
        activePrefixes: ['/controleur-commission/dossiers'],
      },
      {
        label: 'Sans verdict',
        path: '/controleur-commission/dossiers-sans-verdict',
        activePrefixes: ['/controleur-commission/dossiers-sans-verdict'],
      },
    ];
  }

  return [
    {
      label: 'Dossiers',
      path: '/commission',
      isActive: (pathname) =>
        pathname === '/commission' || pathname.startsWith('/commission/candidat'),
    },
    {
      label: 'Notes',
      path: '/commission/notes',
      activePrefixes: ['/commission/notes'],
    },
  ];
}

function getHomePath(sousRole) {
  if (sousRole === 'EXAMINATEUR') return '/examinateur/dossiers';
  if (sousRole === 'CONTROLEUR') return '/controleur-commission/tableau-de-bord';
  return '/commission';
}

export default function CommissionLayout({ children }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const sousRole = user?.sousRole;
  const espaceLabel = getEspaceLabel(sousRole);
  const tabs = getTabs(sousRole);
  const homePath = getHomePath(sousRole);
  const nomUser = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user?.email || 'Commission';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-slate-800 text-white px-4 sm:px-6 py-3 shrink-0 z-40 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate(homePath)}
              className="text-xl font-black tracking-tight hover:text-orange-300 transition shrink-0"
            >
              UniPath
            </button>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded shrink-0">
              {espaceLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationCenter />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-white border-2 border-slate-500">
                {initiales(user?.prenom || user?.email?.[0], user?.nom || user?.email?.[1])}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight max-w-[10rem] truncate">{nomUser}</p>
                <p className="text-slate-400 text-[10px]">{espaceLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <BottomTabNav tabs={tabs} />
    </div>
  );
}
