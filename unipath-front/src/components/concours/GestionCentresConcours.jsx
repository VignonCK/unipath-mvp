import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { centreCompositionService } from '../../services/api';

const EMPTY_CENTRE = { nom: '', ville: '', codeVille: '', adresse: '', telephone: '' };

function defaultAnneeAcademique(libelle) {
  const match = String(libelle || '').match(/20\d{2}/);
  if (match) {
    const y = parseInt(match[0], 10);
    return `${y - 1}-${y}`;
  }
  return '2025-2026';
}

export default function GestionCentresConcours({ concoursId, concoursLibelle }) {
  const [catalogue, setCatalogue] = useState([]);
  const [associes, setAssocies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [anneeAcademique, setAnneeAcademique] = useState(() => defaultAnneeAcademique(concoursLibelle));
  const [capaciteAjout, setCapaciteAjout] = useState('');
  const [showCentreModal, setShowCentreModal] = useState(false);
  const [editingCentreId, setEditingCentreId] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [centreForm, setCentreForm] = useState(EMPTY_CENTRE);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!concoursId) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const [centres, liens] = await Promise.all([
        centreCompositionService.lister({ actif: 'true' }),
        centreCompositionService.getConcoursCentres(concoursId, { tous: '1' }),
      ]);
      setCatalogue(centres);
      setAssocies(liens);
      setInitialLoadDone(true);
    } catch (err) {
      setError(err.message || 'Impossible de charger les centres');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [concoursId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateCentre = () => {
    setEditingCentreId(null);
    setCentreForm(EMPTY_CENTRE);
    setShowCentreModal(true);
  };

  const openEditCentre = (centre) => {
    if (!centre?.id) return;
    setEditingCentreId(centre.id);
    setCentreForm({
      nom: centre.nom || '',
      ville: centre.ville || '',
      codeVille: centre.codeVille || '',
      adresse: centre.adresse || '',
      telephone: centre.telephone || '',
    });
    setShowCentreModal(true);
  };

  const handleAjouter = async () => {
    if (!selectedCentreId) return;
    setBusy(true);
    try {
      await centreCompositionService.ajouterAuConcours(concoursId, {
        centreId: selectedCentreId,
        anneeAcademique,
        capacite: capaciteAjout !== '' ? Number(capaciteAjout) : null,
      });
      setSelectedCentreId('');
      setCapaciteAjout('');
      await loadData({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRetirer = async (concourscentreId) => {
    if (!window.confirm('Retirer ce centre du concours ?')) return;
    setBusy(true);
    try {
      await centreCompositionService.retirerDuConcours(concoursId, concourscentreId);
      await loadData({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateLien = async (lien, patch) => {
    setBusy(true);
    try {
      await centreCompositionService.modifierConcoursCentre(concoursId, lien.id, patch);
      await loadData({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitCentre = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        nom: centreForm.nom,
        ville: centreForm.ville,
        adresse: centreForm.adresse || null,
        telephone: centreForm.telephone || null,
        codeVille: centreForm.codeVille.trim() === '' ? null : centreForm.codeVille.trim(),
      };
      if (editingCentreId) {
        await centreCompositionService.modifier(editingCentreId, payload);
      } else {
        const created = await centreCompositionService.creer(payload);
        setSelectedCentreId(created.id);
      }
      setShowCentreModal(false);
      setEditingCentreId(null);
      setCentreForm(EMPTY_CENTRE);
      await loadData({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!concoursId) {
    return (
      <p className='text-sm text-gray-500'>
        Enregistrez le concours avant de configurer les centres de composition.
      </p>
    );
  }

  if (loading && !initialLoadDone) {
    return <p className='text-sm text-gray-500'>Chargement des centres…</p>;
  }

  const selectedCatalogue = catalogue.find((c) => c.id === selectedCentreId);

  return (
    <div className='border-t pt-4 space-y-4 relative'>
      {loading && (
        <p className='text-xs text-gray-400 absolute top-0 right-0'>Mise à jour…</p>
      )}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-bold text-gray-800'>Centres de composition</h3>
        <button
          type='button'
          onClick={openCreateCentre}
          className='text-xs font-semibold text-orange-700 hover:text-orange-900'
        >
          + Créer un nouveau centre
        </button>
      </div>

      {error && <p className='text-xs text-red-600'>{error}</p>}

      <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3'>
        <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>Ajouter au concours</p>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
          <select
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            className='md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white'
          >
            <option value=''>— Centre du référentiel —</option>
            {catalogue.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} — {c.ville}
                {c.codeVille ? ` (${c.codeVille})` : ''}
              </option>
            ))}
          </select>
          <input
            type='text'
            value={anneeAcademique}
            onChange={(e) => setAnneeAcademique(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder='2025-2026'
            className='px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
          <input
            type='number'
            min='1'
            value={capaciteAjout}
            onChange={(e) => setCapaciteAjout(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder='Capacité (opt.)'
            className='px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            disabled={busy || !selectedCentreId}
            onClick={handleAjouter}
            className='px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-60'
          >
            Ajouter au concours
          </button>
          {selectedCatalogue && (
            <button
              type='button'
              disabled={busy}
              onClick={() => openEditCentre(selectedCatalogue)}
              className='px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-white disabled:opacity-60'
            >
              Modifier le centre sélectionné
            </button>
          )}
        </div>
      </div>

      <div className='space-y-2'>
        <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
          Centres associés ({associes.length})
        </p>
        {associes.length === 0 && (
          <p className='text-sm text-gray-500'>Aucun centre associé à ce concours.</p>
        )}
        {associes.map((lien) => (
          <div
            key={lien.id}
            className='flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm'
          >
            <div className='flex-1 min-w-[200px]'>
              <p className='font-medium text-gray-900'>
                {lien.centre?.nom} — {lien.centre?.ville}
                {lien.centre?.codeVille ? (
                  <span className='ml-2 text-xs font-mono text-orange-700'>code {lien.centre.codeVille}</span>
                ) : (
                  <span className='ml-2 text-xs text-amber-600'>sans code ville</span>
                )}
              </p>
              <p className='text-xs text-gray-500'>
                {lien.anneeAcademique}
                {lien.inscritsCount != null && ` · ${lien.inscritsCount} inscrit(s)`}
              </p>
            </div>
            <label className='flex items-center gap-2 text-xs'>
              Capacité
              <input
                type='number'
                min='1'
                defaultValue={lien.capacite ?? ''}
                onBlur={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  if (val !== lien.capacite) {
                    handleUpdateLien(lien, { capacite: val });
                  }
                }}
                className='w-20 px-2 py-1 border border-gray-200 rounded'
              />
            </label>
            <label className='flex items-center gap-2 text-xs cursor-pointer'>
              <input
                type='checkbox'
                checked={lien.estActif}
                onChange={(e) => handleUpdateLien(lien, { estActif: e.target.checked })}
              />
              Actif
            </label>
            <button
              type='button'
              disabled={busy}
              onClick={() => openEditCentre(lien.centre)}
              className='text-xs text-blue-700 hover:text-blue-900 font-semibold'
            >
              Éditer
            </button>
            <button
              type='button'
              disabled={busy}
              onClick={() => handleRetirer(lien.id)}
              className='text-xs text-red-600 hover:text-red-800 font-semibold'
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {showCentreModal && createPortal(
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4'>
          <form
            onSubmit={handleSubmitCentre}
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'
          >
            <h4 className='font-bold text-gray-900'>
              {editingCentreId ? 'Modifier le centre' : 'Nouveau centre'}
            </h4>
            <input
              required
              value={centreForm.nom}
              onChange={(e) => setCentreForm({ ...centreForm, nom: e.target.value })}
              placeholder='Nom du lieu'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <input
              required
              value={centreForm.ville}
              onChange={(e) => setCentreForm({ ...centreForm, ville: e.target.value })}
              placeholder='Ville'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <div>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>
                Code ville (2 chiffres, pour n° de table)
              </label>
              <input
                value={centreForm.codeVille}
                onChange={(e) => setCentreForm({ ...centreForm, codeVille: e.target.value })}
                placeholder='01'
                maxLength={2}
                inputMode='numeric'
                pattern='\d{2}'
                className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono'
              />
              <p className='mt-1 text-[11px] text-gray-500'>Optionnel pour l’instant — ex. 01 = Cotonou</p>
            </div>
            <input
              value={centreForm.adresse}
              onChange={(e) => setCentreForm({ ...centreForm, adresse: e.target.value })}
              placeholder='Adresse (optionnel)'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <input
              value={centreForm.telephone}
              onChange={(e) => setCentreForm({ ...centreForm, telephone: e.target.value })}
              placeholder='Téléphone (optionnel)'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <div className='flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => {
                  setShowCentreModal(false);
                  setEditingCentreId(null);
                }}
                className='px-4 py-2 text-sm text-gray-600'
              >
                Annuler
              </button>
              <button
                type='submit'
                disabled={busy}
                className='px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold disabled:opacity-60'
              >
                {busy ? 'Enregistrement…' : (editingCentreId ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
