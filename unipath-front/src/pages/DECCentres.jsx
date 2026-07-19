import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { centreCompositionService, concoursService } from '../services/api';
import DECLayout from '../components/DECLayout';
import GestionCentresConcours from '../components/concours/GestionCentresConcours';

const EMPTY_CENTRE = { nom: '', ville: '', codeVille: '', adresse: '', telephone: '' };
const EMPTY_SALLE = { nom: '', capacite: '' };

export default function DECCentres() {
  const [centres, setCentres] = useState([]);
  const [concoursList, setConcoursList] = useState([]);
  const [filterConcoursId, setFilterConcoursId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CENTRE);

  const [sallesCentre, setSallesCentre] = useState(null);
  const [salles, setSalles] = useState([]);
  const [loadingSalles, setLoadingSalles] = useState(false);
  const [sallesError, setSallesError] = useState('');
  const [showSalleModal, setShowSalleModal] = useState(false);
  const [editingSalleId, setEditingSalleId] = useState(null);
  const [salleForm, setSalleForm] = useState(EMPTY_SALLE);

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, concours] = await Promise.all([
        centreCompositionService.lister({}),
        concoursService.getAll(),
      ]);
      setCentres(Array.isArray(list) ? list : []);
      setConcoursList(Array.isArray(concours) ? concours : []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les centres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  const loadSalles = async (centre) => {
    setSallesCentre(centre);
    setLoadingSalles(true);
    setSallesError('');
    try {
      const data = await centreCompositionService.listerSalles(centre.id);
      setSalles(data.salles || []);
    } catch (err) {
      setSallesError(err.message || 'Impossible de charger les salles');
      setSalles([]);
    } finally {
      setLoadingSalles(false);
    }
  };

  const closeSallesPanel = () => {
    setSallesCentre(null);
    setSalles([]);
    setSallesError('');
    setShowSalleModal(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_CENTRE);
    setShowModal(true);
  };

  const openEdit = (centre) => {
    setEditingId(centre.id);
    setForm({
      nom: centre.nom || '',
      ville: centre.ville || '',
      codeVille: centre.codeVille || '',
      adresse: centre.adresse || '',
      telephone: centre.telephone || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        nom: form.nom,
        ville: form.ville,
        adresse: form.adresse || null,
        telephone: form.telephone || null,
        codeVille: form.codeVille.trim() === '' ? null : form.codeVille.trim(),
      };
      if (editingId) {
        await centreCompositionService.modifier(editingId, payload);
      } else {
        await centreCompositionService.creer(payload);
      }
      setShowModal(false);
      await loadCatalogue();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActif = async (centre) => {
    setBusy(true);
    try {
      await centreCompositionService.toggleActif(centre.id);
      await loadCatalogue();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openCreateSalle = () => {
    setEditingSalleId(null);
    setSalleForm(EMPTY_SALLE);
    setShowSalleModal(true);
  };

  const openEditSalle = (salle) => {
    setEditingSalleId(salle.id);
    setSalleForm({
      nom: salle.nom || '',
      capacite: salle.capacite != null ? String(salle.capacite) : '',
    });
    setShowSalleModal(true);
  };

  const handleSubmitSalle = async (e) => {
    e.preventDefault();
    if (!sallesCentre) return;
    setBusy(true);
    try {
      const payload = {
        nom: salleForm.nom,
        capacite: salleForm.capacite.trim() === '' ? null : Number(salleForm.capacite),
      };
      if (editingSalleId) {
        await centreCompositionService.modifierSalle(editingSalleId, payload);
      } else {
        await centreCompositionService.creerSalle(sallesCentre.id, payload);
      }
      setShowSalleModal(false);
      await loadSalles(sallesCentre);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSalle = async (salle) => {
    if (!window.confirm(`Supprimer la salle « ${salle.nom} » ?`)) return;
    setBusy(true);
    try {
      await centreCompositionService.supprimerSalle(salle.id);
      if (sallesCentre) await loadSalles(sallesCentre);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const selectedConcours = concoursList.find((c) => c.id === filterConcoursId);

  return (
    <DECLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Centres de composition</h1>
            <p className="text-sm text-gray-500 mt-1">
              Référentiel global, salles et associations par concours
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
          >
            + Nouveau centre
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="filter-concours-centres">
            Filtrer / associer à un concours
          </label>
          <select
            id="filter-concours-centres"
            value={filterConcoursId}
            onChange={(e) => setFilterConcoursId(e.target.value)}
            className="w-full sm:max-w-lg rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">— Catalogue global uniquement —</option>
            {concoursList.map((c) => (
              <option key={c.id} value={c.id}>{c.libelle}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Chargement…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Ville</th>
                    <th className="px-4 py-3">Code ville</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {centres.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        Aucun centre. Créez-en un pour commencer.
                      </td>
                    </tr>
                  ) : (
                    centres.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{c.nom}</td>
                        <td className="px-4 py-3 text-gray-600">{c.ville}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {c.codeVille || <span className="text-amber-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            c.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {c.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => loadSalles(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 hover:bg-teal-100"
                            >
                              Salles
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 hover:bg-blue-100"
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleToggleActif(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              {c.actif ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sallesCentre && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Salles — {sallesCentre.nom}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {sallesCentre.ville}
                  {sallesCentre.codeVille ? ` · code ${sallesCentre.codeVille}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openCreateSalle}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700"
                >
                  + Ajouter une salle
                </button>
                <button
                  type="button"
                  onClick={closeSallesPanel}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>

            {sallesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sallesError}
              </div>
            )}

            {loadingSalles ? (
              <p className="text-sm text-gray-500">Chargement des salles…</p>
            ) : salles.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune salle pour ce centre.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
                      <th className="py-2 px-3">Nom</th>
                      <th className="py-2 px-3">Capacité</th>
                      <th className="py-2 px-3">Statut</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salles.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-medium text-gray-800">{s.nom}</td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {s.capacite != null ? s.capacite : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs font-semibold ${s.actif ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {s.actif ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditSalle(s)}
                            className="text-xs font-semibold text-blue-900 hover:text-orange-600"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteSalle(s)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {filterConcoursId && selectedConcours && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Associations — {selectedConcours.libelle}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Lier des centres du référentiel à ce concours
            </p>
            <GestionCentresConcours
              concoursId={selectedConcours.id}
              concoursLibelle={selectedConcours.libelle}
            />
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <h4 className="font-bold text-gray-900">
              {editingId ? 'Modifier le centre' : 'Nouveau centre'}
            </h4>
            <input
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom du lieu"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              required
              value={form.ville}
              onChange={(e) => setForm({ ...form, ville: e.target.value })}
              placeholder="Ville"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Code ville (2 chiffres)
              </label>
              <input
                value={form.codeVille}
                onChange={(e) => setForm({ ...form, codeVille: e.target.value })}
                placeholder="01"
                maxLength={2}
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <input
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Adresse (optionnel)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              placeholder="Téléphone (optionnel)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600">
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {busy ? '…' : (editingId ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )}

      {showSalleModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmitSalle}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <h4 className="font-bold text-gray-900">
              {editingSalleId ? 'Modifier la salle' : 'Nouvelle salle'}
            </h4>
            <p className="text-xs text-gray-500">{sallesCentre?.nom}</p>
            <input
              required
              value={salleForm.nom}
              onChange={(e) => setSalleForm({ ...salleForm, nom: e.target.value })}
              placeholder="Nom / numéro de salle"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              value={salleForm.capacite}
              onChange={(e) => setSalleForm({ ...salleForm, capacite: e.target.value })}
              placeholder="Capacité (optionnel)"
              inputMode="numeric"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSalleModal(false)} className="px-4 py-2 text-sm text-gray-600">
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {busy ? '…' : (editingSalleId ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </DECLayout>
  );
}
