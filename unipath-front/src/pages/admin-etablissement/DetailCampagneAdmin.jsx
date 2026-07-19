import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campagneAdminService } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import StatutCampagneBadge from '../../components/StatutCampagneBadge';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DetailCampagneAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campagne, setCampagne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const charger = () => {
    campagneAdminService
      .getById(id)
      .then((data) => setCampagne(data.campagne))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [id]);

  const runAction = async (action) => {
    if (action === 'delete' && !window.confirm('Supprimer cette campagne ?')) return;
    setBusy(true);
    try {
      if (action === 'delete') await campagneAdminService.supprimer(id);
      else if (action === 'publier') await campagneAdminService.publier(id);
      else if (action === 'cloturer') await campagneAdminService.cloturer(id);
      if (action === 'delete') navigate('/admin-etablissement/campagnes');
      else charger();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AdminEtablissementLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </AdminEtablissementLayout>
    );
  }

  if (!campagne) {
    return (
      <AdminEtablissementLayout>
        <div className="p-6 text-center text-red-600">{error || 'Campagne introuvable'}</div>
      </AdminEtablissementLayout>
    );
  }

  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button type="button" onClick={() => navigate('/admin-etablissement/campagnes')} className="text-sm text-teal-900 hover:underline">← Mes campagnes</button>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <BentoCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-gray-900">{campagne.titre}</h1>
                <StatutCampagneBadge statut={campagne.statut} />
              </div>
              <p className="text-gray-600">{campagne.anneeAcademique}</p>
              <p className="text-sm text-gray-500 mt-2">
                Ouverture : {formatDate(campagne.dateOuverture)} — Clôture : {formatDate(campagne.dateCloture)}
              </p>
              {campagne.description && <p className="text-sm text-gray-700 mt-4">{campagne.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {['BROUILLON', 'PUBLIEE'].includes(campagne.statut) && (
                <button type="button" onClick={() => navigate(`/admin-etablissement/campagnes/${id}/modifier`)} className="px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-900 rounded-lg">Modifier</button>
              )}
              {campagne.statut === 'BROUILLON' && (
                <>
                  <button type="button" disabled={busy} onClick={() => runAction('publier')} className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg disabled:opacity-50">Publier</button>
                  <button type="button" disabled={busy} onClick={() => runAction('delete')} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg disabled:opacity-50">Supprimer</button>
                </>
              )}
              {campagne.statut === 'PUBLIEE' && (
                <button type="button" disabled={busy} onClick={() => runAction('cloturer')} className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg disabled:opacity-50">Clôturer</button>
              )}
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Filières recrutées ({campagne.filieres?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Frais</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Séries</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Critères</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(campagne.filieres || []).map((cf) => (
                  <tr key={cf.id}>
                    <td className="px-6 py-4 font-medium">{cf.filiere?.nom || cf.filiereId}</td>
                    <td className="px-6 py-4">{cf.fraisDossier?.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-6 py-4">{(cf.seriesAcceptees || []).join(', ') || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{cf.criteresSelection || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
