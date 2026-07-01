import { useCallback, useEffect, useState } from 'react';
import { centreCompositionService } from '../../services/api';

const EMPTY_CENTRE = { nom: '', ville: '', adresse: '', telephone: '' };

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCentre, setNewCentre] = useState(EMPTY_CENTRE);

  const loadData = useCallback(async () => {
    if (!concoursId) return;
    setLoading(true);
    setError('');
    try {
      const [centres, liens] = await Promise.all([
        centreCompositionService.lister({ actif: 'true' }),
        centreCompositionService.getConcoursCentres(concoursId, { tous: '1' }),
      ]);
      setCatalogue(centres);
      setAssocies(liens);
    } catch (err) {
      setError(err.message || 'Impossible de charger les centres');
    } finally {
      setLoading(false);
    }
  }, [concoursId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      await loadData();
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
      await loadData();
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
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreerCentre = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await centreCompositionService.creer(newCentre);
      setShowCreateModal(false);
      setNewCentre(EMPTY_CENTRE);
      await loadData();
      setSelectedCentreId(created.id);
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

  if (loading) {
    return <p className='text-sm text-gray-500'>Chargement des centres…</p>;
  }

  return (
    <div className='border-t pt-4 space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-sm font-bold text-gray-800'>Centres de composition</h3>
        <button
          type='button'
          onClick={() => setShowCreateModal(true)}
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
              </option>
            ))}
          </select>
          <input
            type='text'
            value={anneeAcademique}
            onChange={(e) => setAnneeAcademique(e.target.value)}
            placeholder='2025-2026'
            className='px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
          <input
            type='number'
            min='1'
            value={capaciteAjout}
            onChange={(e) => setCapaciteAjout(e.target.value)}
            placeholder='Capacité (opt.)'
            className='px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
        </div>
        <button
          type='button'
          disabled={busy || !selectedCentreId}
          onClick={handleAjouter}
          className='px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-60'
        >
          Ajouter au concours
        </button>
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
              onClick={() => handleRetirer(lien.id)}
              className='text-xs text-red-600 hover:text-red-800 font-semibold'
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <form
            onSubmit={handleCreerCentre}
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'
          >
            <h4 className='font-bold text-gray-900'>Nouveau centre</h4>
            <input
              required
              value={newCentre.nom}
              onChange={(e) => setNewCentre({ ...newCentre, nom: e.target.value })}
              placeholder='Nom du lieu'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <input
              required
              value={newCentre.ville}
              onChange={(e) => setNewCentre({ ...newCentre, ville: e.target.value })}
              placeholder='Ville'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <input
              value={newCentre.adresse}
              onChange={(e) => setNewCentre({ ...newCentre, adresse: e.target.value })}
              placeholder='Adresse (optionnel)'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <input
              value={newCentre.telephone}
              onChange={(e) => setNewCentre({ ...newCentre, telephone: e.target.value })}
              placeholder='Téléphone (optionnel)'
              className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
            />
            <div className='flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => setShowCreateModal(false)}
                className='px-4 py-2 text-sm text-gray-600'
              >
                Annuler
              </button>
              <button
                type='submit'
                disabled={busy}
                className='px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold'
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
