import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campagneAdminService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import StatutCampagneBadge from '../../components/StatutCampagneBadge';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MesCampagnes() {
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const charger = () => {
    setLoading(true);
    campagneAdminService
      .getAll()
      .then((data) => setCampagnes(data.campagnes || []))
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const runAction = async (id, action) => {
    if (action === 'delete' && !window.confirm('Supprimer cette campagne ?')) return;
    setActionId(id);
    setError('');
    try {
      if (action === 'delete') await campagneAdminService.supprimer(id);
      else if (action === 'publier') await campagneAdminService.publier(id);
      else if (action === 'cloturer') await campagneAdminService.cloturer(id);
      charger();
    } catch (err) {
      setError(err.message || 'Action impossible');
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mes Campagnes</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez vos campagnes d&apos;inscription.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin-etablissement/campagnes/nouvelle')}
            className="px-5 py-2.5 rounded-lg bg-teal-900 text-white text-sm font-semibold hover:bg-teal-800"
          >
            + Nouvelle campagne
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : campagnes.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">
            Aucune campagne. Créez votre première campagne d&apos;inscription.
          </BentoCard>
        ) : (
          <div className="space-y-4">
            {campagnes.map((c) => (
              <BentoCard key={c.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="font-bold text-gray-900">{c.titre}</h2>
                      <StatutCampagneBadge statut={c.statut} />
                    </div>
                    <p className="text-sm text-gray-500">{c.anneeAcademique}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(c.dateOuverture)} → {formatDate(c.dateCloture)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {c.filieres?.length ?? 0} filière(s) recrutée(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate(`/admin-etablissement/campagnes/${c.id}`)} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Voir</button>
                    {['BROUILLON', 'PUBLIEE'].includes(c.statut) && (
                      <button type="button" onClick={() => navigate(`/admin-etablissement/campagnes/${c.id}/modifier`)} className="px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-900 rounded-lg hover:bg-blue-50">Modifier</button>
                    )}
                    {c.statut === 'BROUILLON' && (
                      <>
                        <button type="button" disabled={actionId === c.id} onClick={() => runAction(c.id, 'publier')} className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Publier</button>
                        <button type="button" disabled={actionId === c.id} onClick={() => runAction(c.id, 'delete')} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">Supprimer</button>
                      </>
                    )}
                    {c.statut === 'PUBLIEE' && (
                      <button type="button" disabled={actionId === c.id} onClick={() => runAction(c.id, 'cloturer')} className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Clôturer</button>
                    )}
                  </div>
                </div>
              </BentoCard>
            ))}
          </div>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
