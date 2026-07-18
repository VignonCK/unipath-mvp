import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, etablissementService } from '../services/api';
import { getUser, SOUS_ROLES_ETABLISSEMENT } from '../utils/auth';
import BottomTabNav from './BottomTabNav';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const ALL_TABS = [
  {
    label: 'Campagnes',
    path: '/admin-etablissement/campagnes',
    activePrefixes: ['/admin-etablissement/campagnes'],
    sousRoles: [SOUS_ROLES_ETABLISSEMENT.ADMIN],
  },
  {
    label: 'Candidatures',
    path: '/admin-etablissement/candidatures',
    activePrefixes: ['/admin-etablissement/candidatures'],
    sousRoles: [
      SOUS_ROLES_ETABLISSEMENT.ADMIN,
      SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
      SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
    ],
  },
  {
    label: 'Pré-inscr.',
    path: '/admin-etablissement/preinscriptions',
    activePrefixes: ['/admin-etablissement/preinscriptions'],
    sousRoles: [
      SOUS_ROLES_ETABLISSEMENT.ADMIN,
      SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
      SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
    ],
  },
  {
    label: 'Quittances',
    path: '/admin-etablissement/validation-quittances',
    activePrefixes: ['/admin-etablissement/validation-quittances'],
    sousRoles: [
      SOUS_ROLES_ETABLISSEMENT.ADMIN,
      SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
      SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
    ],
  },
  {
    label: 'Étudiants',
    path: '/admin-etablissement/etudiants',
    activePrefixes: ['/admin-etablissement/etudiants'],
    sousRoles: [
      SOUS_ROLES_ETABLISSEMENT.ADMIN,
      SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
      SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
    ],
  },
  {
    label: 'Personnel',
    path: '/admin-etablissement/personnel',
    activePrefixes: ['/admin-etablissement/personnel'],
    sousRoles: [SOUS_ROLES_ETABLISSEMENT.ADMIN, SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR],
  },
  {
    label: 'Stats',
    path: '/admin-etablissement/statistiques',
    activePrefixes: ['/admin-etablissement/statistiques'],
    sousRoles: [SOUS_ROLES_ETABLISSEMENT.ADMIN, SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR],
  },
  {
    label: 'Établissement',
    path: '/admin-etablissement/etablissement',
    activePrefixes: ['/admin-etablissement/etablissement'],
    sousRoles: [SOUS_ROLES_ETABLISSEMENT.ADMIN],
  },
  {
    label: 'Sécurité',
    path: '/admin-etablissement/securite',
    activePrefixes: ['/admin-etablissement/securite'],
    sousRoles: [
      SOUS_ROLES_ETABLISSEMENT.ADMIN,
      SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
      SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
    ],
  },
];

const SOUS_ROLE_LABELS = {
  ADMIN: 'Admin',
  SUPERVISEUR: 'Superviseur',
  CONTROLEUR: 'Contrôleur',
};

export default function AdminEtablissementLayout({ children }) {
  const navigate = useNavigate();
  const user = getUser();
  const sousRole = user?.sousRole || SOUS_ROLES_ETABLISSEMENT.ADMIN;
  const [etablissement, setEtablissement] = useState(null);

  useEffect(() => {
    if (!user?.etablissementId) return;
    etablissementService
      .getById(user.etablissementId)
      .then((data) => setEtablissement(data.etablissement || null))
      .catch(() => {});
  }, [user?.etablissementId]);

  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => tab.sousRoles.includes(sousRole)),
    [sousRole],
  );

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-teal-900 text-white px-4 sm:px-6 py-3 shrink-0 z-40 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate(tabs[0]?.path || '/admin-etablissement/preinscriptions')}
              className="text-xl font-black tracking-tight hover:text-orange-300 transition shrink-0"
            >
              UniPath
            </button>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded shrink-0">
              {SOUS_ROLE_LABELS[sousRole] || 'Admin'}
            </span>
            {etablissement && (
              <span className="hidden sm:block text-teal-200 text-xs truncate border-l border-teal-700 pl-2 ml-1 max-w-[14rem]">
                {etablissement.nom}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white border-2 border-orange-400">
                {initiales(user?.prenom, user?.nom)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight max-w-[10rem] truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-teal-200 text-[10px] truncate max-w-[10rem]">{user?.email}</p>
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
