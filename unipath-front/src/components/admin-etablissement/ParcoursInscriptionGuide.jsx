import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    key: 'candidatures',
    title: 'Candidatures',
    desc: 'Consulter les pièces et donner le verdict',
    path: '/admin-etablissement/candidatures',
  },
  {
    key: 'etudiants',
    title: 'Étudiants',
    desc: 'Candidats acceptés et inscrits',
    path: '/admin-etablissement/etudiants',
  },
];

export default function ParcoursInscriptionGuide({ active, pendingCount = 0 }) {
  const navigate = useNavigate();
  const activeIndex = STEPS.findIndex((s) => s.key === active);

  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 space-y-3">
      <p className="text-sm text-teal-900">
        <strong>Parcours d&apos;admission :</strong> ouvrez un dossier, consultez les pièces, puis validez,
        mettez sous réserve ou rejetez.
        {pendingCount > 0 && active === 'candidatures' && (
          <span className="ml-1 font-semibold text-orange-700">
            {pendingCount} décision{pendingCount > 1 ? 's' : ''} en attente.
          </span>
        )}
      </p>
      <ol className="flex flex-col sm:flex-row gap-2 sm:gap-0">
        {STEPS.map((step, index) => {
          const isActive = step.key === active;
          const isPast = index < activeIndex;
          return (
            <li key={step.key} className="flex flex-1 items-start sm:items-center gap-2 sm:gap-0">
              {index > 0 && (
                <span className="hidden sm:block flex-shrink-0 w-6 text-center text-teal-300" aria-hidden>
                  →
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate(step.path)}
                className={`flex-1 text-left rounded-lg px-3 py-2 transition ${
                  isActive
                    ? 'bg-white border-2 border-orange-400 shadow-sm'
                    : isPast
                    ? 'bg-white/70 border border-teal-200 hover:bg-white'
                    : 'bg-white/40 border border-transparent hover:bg-white/70'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mr-2 ${
                    isActive ? 'bg-orange-500 text-white' : isPast ? 'bg-teal-700 text-white' : 'bg-teal-200 text-teal-800'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-teal-900'}`}>
                  {step.title}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 sm:ml-7">{step.desc}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
