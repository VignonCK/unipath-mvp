// src/pages/DashboardDGES.jsx — Module 2 (établissements privés)
import { useNavigate } from 'react-router-dom';
import DGESLayout from '../components/DGESLayout';
import { BentoCard } from '../components/AcademicLayout';

export default function DashboardDGES() {
  const navigate = useNavigate();

  return (
    <DGESLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espace DGES</h1>
          <p className="text-sm text-gray-500 mt-1">
            Module 2 — établissements privés et administrateurs d&apos;école
          </p>
        </div>

        <BentoCard className="p-6 bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-2">
            Établissements privés &amp; admins
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Créez des établissements privés et gérez leurs comptes administrateurs.
            La gestion des concours et des établissements publics relève de la DEC.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dges-etablissements-admins')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Ouvrir la gestion
          </button>
        </BentoCard>
      </div>
    </DGESLayout>
  );
}
