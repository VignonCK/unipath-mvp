import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campagneService, filiereService } from '../../services/api';
import CandidatLayout from '../../components/CandidatLayout';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PageCampagnesInscription() {
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ ville: '', anneeAcademique: '', filiereId: '' });

  const charger = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (filters.ville) params.ville = filters.ville;
    if (filters.anneeAcademique) params.anneeAcademique = filters.anneeAcademique;
    if (filters.filiereId) params.filiereId = filters.filiereId;

    campagneService
      .getAll(params)
      .then((data) => setCampagnes(data.campagnes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filiereService.getAll().then((data) => setFilieres(data.filieres || [])).catch(() => {});
  }, []);

  useEffect(() => { charger(); }, [filters.ville, filters.anneeAcademique, filters.filiereId]);

  const villes = [...new Set(campagnes.map((c) => c.etablissement?.ville).filter(Boolean))].sort();

  return (
    <CandidatLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/dashboard')} className="text-sm text-blue-900 hover:underline mb-2">← Accueil</button>
          <h1 className="text-2xl font-black text-gray-900">Inscriptions Établissements Privés</h1>
          <p className="text-gray-500 text-sm mt-1">Campagnes d&apos;inscription ouvertes dans les établissements privés.</p>
        </div>

        <BentoCard className="p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <select value={filters.ville} onChange={(e) => setFilters((p) => ({ ...p, ville: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Toutes</option>
                {villes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Année académique</label>
              <input value={filters.anneeAcademique} onChange={(e) => setFilters((p) => ({ ...p, anneeAcademique: e.target.value }))} placeholder="2025-2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière</label>
              <select value={filters.filiereId} onChange={(e) => setFilters((p) => ({ ...p, filiereId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Toutes</option>
                {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
          </div>
        </BentoCard>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : campagnes.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">Aucune campagne ouverte pour le moment.</BentoCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campagnes.map((c) => (
              <BentoCard key={c.id} className="p-5 flex flex-col">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{c.etablissement?.nom}</p>
                <h2 className="font-bold text-gray-900 mt-1">{c.titre}</h2>
                <p className="text-sm text-gray-500 mt-1">{c.etablissement?.ville} · {c.anneeAcademique}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(c.dateOuverture)} → {formatDate(c.dateCloture)}
                </p>
                <p className="text-sm text-gray-600 mt-2">{c.filieres?.length ?? 0} filière(s) disponible(s)</p>
                <button
                  type="button"
                  onClick={() => navigate(`/campagnes-inscription/${c.id}`)}
                  className="mt-4 self-start px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800"
                >
                  Voir les détails
                </button>
              </BentoCard>
            ))}
          </div>
        )}
      </div>
    </CandidatLayout>
  );
}
