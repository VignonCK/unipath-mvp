import { useEffect, useState } from 'react';
import { concoursService, decService, etablissementService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

const ETAB_FORM_INIT = { nom: '', ville: '', adresse: '', email: '' };

function formatConcoursDates(concours) {
  const depotDebut = concours.dateDebutDepot || concours.dateDebut;
  const depotFin = concours.dateFinDepot || concours.dateFin;
  const compoDebut = concours.dateDebutComposition || concours.dateComposition;
  const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
  return `Dépôt ${fmt(depotDebut)} → ${fmt(depotFin)} · Composition ${fmt(compoDebut)}`;
}

export default function DECEtablissementsPublics() {
  const [etablissements, setEtablissements] = useState([]);
  const [concoursByEtab, setConcoursByEtab] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageMessage, setPageMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [etabForm, setEtabForm] = useState(ETAB_FORM_INIT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await etablissementService.getPublics();
      const publics = data.etablissements || [];
      setEtablissements(publics);
      const entries = await Promise.all(
        publics.map(async (etab) => {
          const concours = await concoursService.getByEtablissement(etab.id);
          return [etab.id, Array.isArray(concours) ? concours : []];
        })
      );
      setConcoursByEtab(Object.fromEntries(entries));
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
    setCreating(true);
    setCreateError('');
    try {
      await decService.creerEtablissement(etabForm);
      setPageMessage('Établissement public créé');
      setCreateModalOpen(false);
      setEtabForm(ETAB_FORM_INIT);
      await charger();
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (etab) => {
    if (!window.confirm(`Supprimer « ${etab.nom} » ?`)) return;
    try {
      await decService.supprimerEtablissement(etab.id);
      setPageMessage('Établissement supprimé');
      await charger();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <DECLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Établissements publics</h1>
            <p className="text-gray-500 text-sm mt-1">
              Module 1 — établissements publics et concours associés
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            + Ajouter un établissement public
          </button>
        </div>

        {pageMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{pageMessage}</div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Ville</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Concours</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etablissements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        Aucun établissement public enregistré.
                      </td>
                    </tr>
                  ) : (
                    etablissements.map((etab) => {
                      const concours = concoursByEtab[etab.id] || [];
                      const open = expandedId === etab.id;
                      return (
                        <FragmentRow
                          key={etab.id}
                          etab={etab}
                          concours={concours}
                          open={open}
                          onToggle={() => setExpandedId(open ? null : etab.id)}
                          onDelete={() => handleDelete(etab)}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}

        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Nouvel établissement public</h2>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Nom"
                  value={etabForm.nom}
                  onChange={(e) => setEtabForm((f) => ({ ...f, nom: e.target.value }))}
                />
                <input
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ville"
                  value={etabForm.ville}
                  onChange={(e) => setEtabForm((f) => ({ ...f, ville: e.target.value }))}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Adresse"
                  value={etabForm.adresse}
                  onChange={(e) => setEtabForm((f) => ({ ...f, adresse: e.target.value }))}
                />
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Email"
                  value={etabForm.email}
                  onChange={(e) => setEtabForm((f) => ({ ...f, email: e.target.value }))}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-3 py-2 text-sm" onClick={() => setCreateModalOpen(false)}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {creating ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DECLayout>
  );
}

function FragmentRow({ etab, concours, open, onToggle, onDelete }) {
  return (
    <>
      <tr className="hover:bg-gray-50/50">
        <td className="px-6 py-4 font-medium text-gray-900">{etab.nom}</td>
        <td className="px-6 py-4 text-gray-600">{etab.ville}</td>
        <td className="px-6 py-4 text-gray-600">{concours.length}</td>
        <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
          <button type="button" onClick={onToggle} className="text-sm font-semibold text-slate-800 hover:text-orange-500">
            {open ? 'Masquer' : 'Voir concours'}
          </button>
          <button type="button" onClick={onDelete} className="text-sm font-semibold text-red-600 hover:text-red-800">
            Supprimer
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={4} className="px-6 py-3 bg-slate-50">
            {concours.length === 0 ? (
              <p className="text-xs text-gray-500">Aucun concours lié.</p>
            ) : (
              <ul className="space-y-1">
                {concours.map((c) => (
                  <li key={c.id} className="text-xs text-gray-700">
                    <span className="font-medium">{c.libelle}</span>
                    <span className="text-gray-500"> — {formatConcoursDates(c)}</span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
