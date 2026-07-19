import { useEffect, useState } from 'react';
import { dgesService } from '../../services/api';
import DGESLayout from '../../components/DGESLayout';
import { BentoCard } from '../../components/AcademicLayout';

const STATUT_STYLE = {
  EN_ATTENTE: 'bg-amber-100 text-amber-900',
  VALIDE: 'bg-emerald-100 text-emerald-800',
  REJETE: 'bg-red-100 text-red-800',
};

const STATUT_LABEL = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  REJETE: 'Rejetée',
};

export default function DGESDemandesFilieres() {
  const [demandes, setDemandes] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('EN_ATTENTE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionId, setActionId] = useState(null);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filtreStatut) params.statut = filtreStatut;
      const data = await dgesService.listerDemandesFilieres(params);
      setDemandes(data.demandes || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, [filtreStatut]);

  const handleValider = async (demande) => {
    if (!window.confirm(`Valider l'ajout de la filière « ${demande.nom} » pour ${demande.etablissement?.nom} ?`)) {
      return;
    }
    setActionId(demande.id);
    setError('');
    setMessage('');
    try {
      const res = await dgesService.validerDemandeFiliere(demande.id);
      setMessage(res.message || 'Demande validée');
      await charger();
    } catch (err) {
      setError(err.message || 'Validation impossible');
    } finally {
      setActionId(null);
    }
  };

  const handleRejeter = async (demande) => {
    const motif = window.prompt(`Motif de rejet pour « ${demande.nom} » (optionnel) :`) ?? null;
    if (motif === null) return;
    setActionId(demande.id);
    setError('');
    setMessage('');
    try {
      const res = await dgesService.rejeterDemandeFiliere(demande.id, motif);
      setMessage(res.message || 'Demande rejetée');
      await charger();
    } catch (err) {
      setError(err.message || 'Rejet impossible');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DGESLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Demandes d&apos;ajout de filières</h1>
          <p className="text-gray-500 text-sm mt-1">
            Validez ou rejetez les demandes envoyées par les administrateurs d&apos;établissements privés.
          </p>
        </div>

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Statut</label>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validées</option>
            <option value="REJETE">Rejetées</option>
            <option value="">Toutes</option>
          </select>
        </BentoCard>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : demandes.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">Aucune demande.</BentoCard>
        ) : (
          <div className="space-y-4">
            {demandes.map((d) => (
              <BentoCard key={d.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{d.nom}</h2>
                    <p className="text-sm text-gray-600">
                      {d.etablissement?.nom}
                      {d.etablissement?.ville ? ` · ${d.etablissement.ville}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Demandé par {d.demandePar?.prenom} {d.demandePar?.nom}
                      {' · '}
                      {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_STYLE[d.statut] || 'bg-slate-100'}`}>
                    {STATUT_LABEL[d.statut] || d.statut}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-2 text-sm text-gray-700">
                  <p><span className="text-gray-500">Code :</span> {d.code || '— (auto à la validation)'}</p>
                  <p><span className="text-gray-500">Niveau :</span> {d.niveau === 'AUTRE' ? 'Autres' : d.niveau}</p>
                  <p><span className="text-gray-500">Durée :</span> {d.dureeAnnees} an(s)</p>
                </div>

                {d.motifDecision && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    Motif : {d.motifDecision}
                  </p>
                )}
                {d.filiere && (
                  <p className="text-sm text-emerald-800">
                    Filière créée : {d.filiere.nom} ({d.filiere.code})
                  </p>
                )}

                {d.statut === 'EN_ATTENTE' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionId === d.id}
                      onClick={() => handleValider(d)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionId === d.id ? '…' : 'Valider'}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === d.id}
                      onClick={() => handleRejeter(d)}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </BentoCard>
            ))}
          </div>
        )}
      </div>
    </DGESLayout>
  );
}
