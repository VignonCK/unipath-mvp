import { NavLink } from 'react-router-dom';

function tabClass({ isActive }) {
  return `px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
    isActive
      ? 'border-orange-500 text-blue-900'
      : 'border-transparent text-gray-500 hover:text-blue-900 hover:border-gray-300'
  }`;
}

export default function EcolesPriveesNav() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">Écoles privées</p>
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        <NavLink to="/etablissements-prives" className={tabClass} end>
          Toutes les écoles
        </NavLink>
        <NavLink to="/campagnes-inscription" className={tabClass}>
          Campagnes ouvertes
        </NavLink>
      </div>
    </div>
  );
}
