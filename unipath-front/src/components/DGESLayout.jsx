// src/components/DGESLayout.jsx
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import BottomTabNav from './BottomTabNav';

function initiales(str) {
  if (!str) return 'D';
  const parts = str.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : str.slice(0, 2).toUpperCase();
}

const TABS = [
  {
    label: 'Tableau de bord',
    path: '/dashboard-dges',
    activePrefixes: ['/dashboard-dges'],
  },
  {
    label: 'Établissements',
    path: '/dges-etablissements-admins',
    activePrefixes: ['/dges-etablissements-admins', '/dges/etablissements'],
  },
  {
    label: 'Concours',
    path: '/gestion-concours',
    activePrefixes: ['/gestion-concours'],
  },
];

export default function DGESLayout({ children }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const nomUser = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user?.email || 'DGES';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-900 text-white px-4 sm:px-6 py-3 shrink-0 z-40 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard-dges')}
              className="text-xl font-black tracking-tight hover:text-orange-300 transition shrink-0"
            >
              UniPath
            </button>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded shrink-0">
              DGES
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white border-2 border-orange-400">
                {initiales(nomUser)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight max-w-[10rem] truncate">{nomUser}</p>
                <p className="text-orange-300 text-[10px]">Administrateur DGES</p>
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

      <BottomTabNav tabs={TABS} />
    </div>
  );
}
