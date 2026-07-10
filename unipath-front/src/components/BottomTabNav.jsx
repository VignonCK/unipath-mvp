import { useNavigate, useLocation } from 'react-router-dom';

export function isTabActive(item, pathname) {
  if (typeof item.isActive === 'function') {
    return item.isActive(pathname);
  }
  if (item.activePrefixes?.length) {
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

/**
 * Barre de navigation fixe en bas (style candidat).
 * @param {{ label: string, path: string, activePrefixes?: string[], badge?: number|null }[]} tabs
 */
export default function BottomTabNav({ tabs = [], getBadge }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!tabs.length) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div
          className="grid gap-0.5 py-2"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((item) => {
            const active = isTabActive(item, location.pathname);
            const badge = typeof getBadge === 'function' ? getBadge(item) : item.badge;

            return (
              <DashboardStyleTab
                key={item.path || item.label}
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
