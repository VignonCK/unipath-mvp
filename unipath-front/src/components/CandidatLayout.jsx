// src/components/CandidatLayout.jsx

import { useState, useEffect } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { authService } from '../services/api';

import { countAlertesNonVues } from '../utils/concoursAlertes';

import NotificationCenter from './NotificationCenter';



const SIDEBAR_KEY = 'unipath-sidebar-collapsed';



const BUILDING_ICON =

  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';



const DOSSIER_ICON =

  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';



function initiales(prenom, nom) {

  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();

}



const NAV_GROUPS = [

  {

    items: [

      {

        label: 'Accueil',

        path: '/dashboard',

        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',

      },

      {

        label: 'Mes concours',

        path: '/mes-concours',

        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',

        activePrefixes: ['/mes-concours', '/inscription'],

        showInscriptionBadge: true,

      },

      {

        label: 'Concours ouverts',

        path: '/concours',

        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',

        activePrefixes: ['/concours'],

      },

    ],

  },

  {

    items: [

      {

        label: 'Écoles privées',

        path: '/etablissements-prives',

        icon: BUILDING_ICON,

        activePrefixes: ['/etablissements-prives', '/campagnes-inscription'],

      },

      {

        label: 'Mes dossiers',

        path: '/demande-inscription',

        icon: DOSSIER_ICON,

        activePrefixes: ['/demande-inscription'],

        showDossiersBadge: true,

      },

    ],

  },

  {

    items: [

      {

        label: 'Mon compte',

        path: '/mon-compte',

        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',

      },

    ],

  },

];



function countDossiersEnCours(candidat) {

  if (!Array.isArray(candidat?.applications)) return null;

  return candidat.applications.filter((a) => {

    const statut = a.status || a.statut;

    return !['REJETE', 'FICHE_GENEREE', 'FICHE_GENERATED'].includes(statut);

  }).length;

}



export default function CandidatLayout({ children, candidat, photoUrl }) {

  const navigate = useNavigate();

  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {

    try {

      return localStorage.getItem(SIDEBAR_KEY) === '1';

    } catch {

      return false;

    }

  });



  useEffect(() => {

    try {

      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');

    } catch {

      /* ignore */

    }

  }, [collapsed]);



  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();



  const handleNav = (item) => {

    setMobileOpen(false);

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

    if (item.activePrefixes) {

      return item.activePrefixes.some(

        (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),

      );

    }

    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  };



  const nbInscriptions = candidat?.inscriptions?.length ?? 0;

  const nbAlertesConcours = countAlertesNonVues(candidat?.inscriptions);

  const sidebarBadge = nbAlertesConcours > 0 ? nbAlertesConcours : nbInscriptions;

  const nbDossiersEnCours = countDossiersEnCours(candidat);



  const toggleCollapsed = () => setCollapsed((v) => !v);



  const renderNavItem = (item) => {

    const active = isActive(item);

    const dossiersBadge = item.showDossiersBadge && nbDossiersEnCours != null && nbDossiersEnCours > 0;



    return (

      <button

        key={item.label}

        type="button"

        onClick={() => handleNav(item)}

        title={collapsed ? item.label : undefined}

        className={`

          w-full flex items-center rounded-xl text-sm font-medium transition text-left

          ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}

          ${active

            ? 'bg-blue-900 text-white'

            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-900'

          }

        `}

      >

        <span className="relative flex-shrink-0">

          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />

          </svg>

          {collapsed && item.showInscriptionBadge && sidebarBadge > 0 && (

            <span

              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${

                nbAlertesConcours > 0 ? 'bg-orange-500' : 'bg-blue-500'

              }`}

            />

          )}

          {collapsed && dossiersBadge && (

            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />

          )}

        </span>

        {!collapsed && (

          <>

            <span className="flex-1 text-left truncate">{item.label}</span>

            {item.showInscriptionBadge && sidebarBadge > 0 && (

              <span

                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${

                  nbAlertesConcours > 0

                    ? active

                      ? 'bg-orange-400 text-white'

                      : 'bg-orange-500 text-white'

                    : active

                      ? 'bg-blue-400 text-white'

                      : 'bg-blue-100 text-blue-800'

                }`}

              >

                {sidebarBadge}

              </span>

            )}

            {dossiersBadge && (

              <span

                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${

                  active ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-800'

                }`}

              >

                {nbDossiersEnCours}

              </span>

            )}

          </>

        )}

      </button>

    );

  };



  return (

    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      <header className="bg-blue-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-40 shadow-lg">

        <div className="flex items-center gap-3">

          <button

            type="button"

            onClick={() => setMobileOpen(!mobileOpen)}

            className="lg:hidden p-1.5 rounded-lg hover:bg-blue-800 transition"

            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}

          >

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path

                strokeLinecap="round"

                strokeLinejoin="round"

                strokeWidth={2}

                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}

              />

            </svg>

          </button>

          <button

            type="button"

            onClick={toggleCollapsed}

            className="hidden lg:flex p-1.5 rounded-lg hover:bg-blue-800 transition"

            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}

            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}

          >

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path

                strokeLinecap="round"

                strokeLinejoin="round"

                strokeWidth={2}

                d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'}

              />

            </svg>

          </button>

          <span className="text-xl font-black tracking-tight">UniPath</span>

          <span className="hidden sm:block text-blue-300 text-xs">Espace Étudiant</span>

        </div>



        <div className="flex items-center gap-3">

          <NotificationCenter />



          <div className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 border-2 border-orange-400">

              {photoUrl ? (

                <img src={photoUrl} alt="profil" className="w-full h-full object-cover" />

              ) : (

                initiales(candidat?.prenom, candidat?.nom)

              )}

            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-semibold leading-tight">{nom}</p>

              <p className="text-orange-300 text-xs font-mono">{candidat?.matricule}</p>

            </div>

          </div>

          <button

            type="button"

            onClick={() => {

              authService.logout();

              navigate('/login');

            }}

            className="text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition"

          >

            Déconnexion

          </button>

        </div>

      </header>



      <div className="flex flex-1 overflow-hidden relative">

        {mobileOpen && (

          <div

            className="fixed inset-0 bg-black/40 z-30 lg:hidden"

            onClick={() => setMobileOpen(false)}

            aria-hidden

          />

        )}



        <aside

          className={`

            fixed top-[52px] left-0 z-30 flex flex-col bg-white border-r border-gray-200 shadow-sm

            h-[calc(100vh-52px)] transition-all duration-300 ease-in-out

            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}

            lg:translate-x-0

            ${collapsed ? 'lg:w-[4.5rem]' : 'w-56 lg:w-56'}

          `}

        >

          <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'p-2' : 'p-3'} space-y-1`}>

            {NAV_GROUPS.map((group, groupIndex) => (

              <div key={groupIndex}>

                {groupIndex > 0 && <div className="border-t border-gray-200 my-2" aria-hidden />}

                <div className="space-y-1">{group.items.map(renderNavItem)}</div>

              </div>

            ))}

          </nav>



          {candidat?.matricule && (

            <div className={`mt-auto border-t border-gray-100 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>

              <div

                className={`bg-blue-50 rounded-xl ${collapsed ? 'px-1 py-2 text-center' : 'px-3 py-2.5'}`}

                title={collapsed ? candidat.matricule : undefined}

              >

                {!collapsed && <p className="text-xs text-gray-400 mb-0.5">Matricule</p>}

                <p

                  className={`font-mono font-bold text-blue-900 truncate ${

                    collapsed ? 'text-[9px] leading-tight' : 'text-xs'

                  }`}

                >

                  {collapsed ? candidat.matricule.replace(/^UnP-/, '') : candidat.matricule}

                </p>

              </div>

            </div>

          )}

        </aside>



        <main

          className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 transition-[margin] duration-300 ${

            collapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-56'

          }`}

        >

          {children}

        </main>

      </div>

    </div>

  );

}


