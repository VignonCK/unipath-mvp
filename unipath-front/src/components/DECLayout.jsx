// src/components/DECLayout.jsx
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
    path: '/dashboard-dec',
    activePrefixes: ['/dashboard-dec'],
  },
  {
    label: 'Concours',
    path: '/gestion-concours',
    activePrefixes: ['/gestion-concours'],
  },
];

export default function DECLayout({ children }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const nomUser = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user?.email || 'DEC';

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-emerald-900 text-white px-4 sm:px-6 py-3 shrink-0 z-40 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard-dec')}
              className="text-xl font-black tracking-tight hover:text-emerald-200 transition shrink-0"
            >
              UniPath
            </button>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded shrink-0">
              DEC
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold text-white border-2 border-emerald-400">
                {initiales(nomUser)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight max-w-[10rem] truncate">{nomUser}</p>
                <p className="text-emerald-200 text-[10px]">Administrateur DEC</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline text-xs border border-emerald-400 text-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition"
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
