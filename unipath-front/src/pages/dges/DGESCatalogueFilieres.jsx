import { useEffect, useState } from 'react';
import { dgesService } from '../../services/api';
import DGESLayout from '../../components/DGESLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function DGESCatalogueFilieres() {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState(null);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dgesService.listerFilieresReference();
      setReferences(data.references || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const res = await dgesService.creerFiliereReference({
        nom: nom.trim(),
        niveau: niveau || null,
      });
      setMessage(res.message || 'Filière ajoutée au catalogue');
      setNom('');
      setNiveau('');
      await charger();
    } catch (err) {
      setError(err.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (ref) => {
    setActionId(ref.id);
    setError('');
    setMessage('');
    try {
      if (ref.actif) {
        const res = await dgesService.desactiverFiliereReference(ref.id);
        setMessage(res.message || 'Filière désactivée');
      } else {
        const res = await dgesService.modifierFiliereReference(ref.id, { actif: true });
        setMessage(res.message || 'Filière réactivée');
      }
      await charger();
    } catch (err) {
      setError(err.message || 'Action impossible');
    } finally {
      setActionId(null);
    }
  };

  return (
    <DGESLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Catalogue des filières</h1>
          <p className="text-gray-500 text-sm mt-1">
            Définissez les filières de référence. Les administrateurs d&apos;établissements privés
            pourront les sélectionner lors d&apos;une demande d&apos;ajout, ou saisir un autre nom.
          </p>
        </div>

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-800">Ajouter une filière au catalogue</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
              <input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Informatique de gestion"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Niveau (optionnel)</label>
              <select
                value={niveau}
                onChange={(e) => setNiveau(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Indifférent</option>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {creating ? 'Ajout…' : 'Ajouter'}
            </button>
          </form>
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Niveau</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Statut</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {references.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        Aucune filière dans le catalogue.
                      </td>
                    </tr>
                  ) : (
                    references.map((ref) => (
                      <tr key={ref.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{ref.nom}</td>
                        <td className="px-6 py-4 text-gray-600">{ref.niveau || '—'}</td>
                        <td className="px-6 py-4">
                          {ref.actif ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={actionId === ref.id}
                            onClick={() => handleToggle(ref)}
                            className={`text-sm font-semibold ${
                              ref.actif ? 'text-orange-600 hover:text-orange-700' : 'text-emerald-700 hover:text-emerald-800'
                            }`}
                          >
                            {actionId === ref.id ? '…' : ref.actif ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </DGESLayout>
  );
}
