import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { countAlertesNonVues } from '../utils/concoursAlertes';
import { detectModuleFromPath, MODULES, ROUTES } from '../constants/routes';
import NotificationCenter from './NotificationCenter';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const TAB_NAV = {
  [MODULES.CONCOURS]: [
    {
      label: 'Mes concours',
      path: ROUTES.concours.home,
      activePrefixes: [ROUTES.concours.home, '/concours/inscription'],
      showInscriptionBadge: true,
    },
    {
      label: 'Ouverts',
      path: ROUTES.concours.ouverts,
      activePrefixes: ['/concours/ouverts'],
    },
    {
      label: 'Ma carte',
      path: ROUTES.maCarte,
    },
  ],
  [MODULES.PARCOURS]: [
    { label: 'Accueil', path: ROUTES.parcours.home },
    {
      label: 'Écoles',
      path: ROUTES.parcours.etablissements,
      activePrefixes: [ROUTES.parcours.etablissements],
    },
    {
      label: 'Campagnes',
      path: ROUTES.parcours.campagnes,
      activePrefixes: [ROUTES.parcours.campagnes],
    },
    {
      label: 'Dossiers',
      path: ROUTES.parcours.dossiers,
      activePrefixes: [ROUTES.parcours.dossiers],
      showDossiersBadge: true,
    },
    {
      label: 'Inscriptions',
      path: ROUTES.parcours.mesInscriptions,
      activePrefixes: [ROUTES.parcours.mesInscriptions],
    },
    {
      label: 'Relevé',
      path: ROUTES.parcours.releve,
    },
  ],
};

const MODULE_LABELS = {
  [MODULES.CONCOURS]: 'Concours universitaires',
  [MODULES.PARCOURS]: 'Parcours académique',
};

function countDossiersEnCours(candidat) {
  if (!Array.isArray(candidat?.applications)) return null;
  return candidat.applications.filter((a) => {
    const statut = a.status || a.statut;
    return !['REJETE', 'FICHE_GENEREE', 'FICHE_GENERATED'].includes(statut);
  }).length;
}

function isTabActive(item, pathname) {
  if (item.activePrefixes) {
    return item.activePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function DashboardStyleTab({ label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition min-w-0 w-full ${
        active ? 'text-blue-900' : 'text-gray-500 hover:text-blue-900'
      }`}
    >
      <span
        className={`w-8 sm:w-10 h-1 rounded-full transition shrink-0 ${
          active ? 'bg-orange-500' : 'bg-transparent'
        }`}
      />
      <span className={`inline-flex items-center gap-1 max-w-full px-0.5 ${active ? 'text-blue-900' : ''}`}>
        <span className="text-[10px] sm:text-xs font-semibold truncate">{label}</span>
        {badge != null && badge > 0 && (
          <span className="shrink-0 min-w-[1rem] h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
    </button>
  );
}

function ModuleBottomNav({ module, location, navigate, candidat }) {
  const tabs = TAB_NAV[module];
  if (!tabs?.length) return null;

  const nbInscriptions = candidat?.inscriptions?.length ?? 0;
  const nbAlertesConcours = countAlertesNonVues(candidat?.inscriptions);
  const concoursBadge = nbAlertesConcours > 0 ? nbAlertesConcours : nbInscriptions;
  const nbDossiersEnCours = countDossiersEnCours(candidat);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div
          className="grid gap-0.5 py-2"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((item) => {
            const active = isTabActive(item, location.pathname);
            let badge = null;
            if (item.showInscriptionBadge && concoursBadge > 0) badge = concoursBadge;
            if (item.showDossiersBadge && nbDossiersEnCours > 0) badge = nbDossiersEnCours;

            return (
              <DashboardStyleTab
                key={item.label}
                label={item.label}
                active={active}
                badge={badge}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function CandidatLayout({ children, candidat, photoUrl, module: moduleProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const module = moduleProp || detectModuleFromPath(location.pathname);

  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();
  const inModule = module === MODULES.CONCOURS || module === MODULES.PARCOURS;
  const isHub = module === MODULES.HUB;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-900 text-white px-4 sm:px-6 py-3 shrink-0 z-40 shadow-lg sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {inModule && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.hub)}
                className="p-1.5 rounded-lg hover:bg-blue-800 transition shrink-0"
                aria-label="Retour à l'accueil"
                title="Retour à l'accueil"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(ROUTES.hub)}
              className="text-xl font-black tracking-tight hover:text-orange-300 transition shrink-0"
            >
              UniPath
            </button>
            {inModule && (
              <span className="hidden sm:block text-blue-300 text-xs truncate border-l border-blue-700 pl-2 ml-1">
                {MODULE_LABELS[module]}
              </span>
            )}
            {isHub && (
              <span className="hidden sm:block text-blue-300 text-xs truncate border-l border-blue-700 pl-2 ml-1">
                Accueil
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationCenter />
            <button
              type="button"
              onClick={() => navigate(ROUTES.monCompte)}
              title="Mon compte"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-blue-800 transition"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 border-2 border-orange-400">
                {photoUrl ? (
                  <img src={photoUrl} alt="profil" className="w-full h-full object-cover" />
                ) : (
                  initiales(candidat?.prenom, candidat?.nom)
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight max-w-[8rem] truncate">{nom || 'Mon compte'}</p>
                {candidat?.matricule && (
                  <p className="text-orange-300 text-[10px] font-mono truncate max-w-[8rem]">{candidat.matricule}</p>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                authService.logout();
                navigate('/login');
              }}
              className="hidden sm:inline text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${inModule ? 'pb-20' : ''}`}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {inModule && (
        <ModuleBottomNav
          module={module}
          location={location}
          navigate={navigate}
          candidat={candidat}
        />
      )}
    </div>
  );
}
