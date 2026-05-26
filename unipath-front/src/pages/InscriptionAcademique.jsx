import { useEffect, useState } from 'react';
import { etablissementService, filiereService, inscriptionAcadService } from '../services/api';

function InscriptionAcademique() {
  const [loading, setLoading] = useState(false);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    etablissementId: '',
    filiereId: '',
    anneeAcademique: '',
    niveau: '',
  });

  useEffect(() => {
    const chargerEtablissements = async () => {
      try {
        setChargementInitial(true);
        const data = await etablissementService.getAll();
        setEtablissements(data.etablissements || []);
      } catch (err) {
        setError(err.message || 'Erreur de chargement des etablissements');
      } finally {
        setChargementInitial(false);
      }
    };

    chargerEtablissements();
  }, []);

  useEffect(() => {
    const chargerFilieres = async () => {
      if (!form.etablissementId) {
        setFilieres([]);
        return;
      }
      try {
        const data = await filiereService.getByEtablissement(form.etablissementId);
        setFilieres(data.filieres || []);
      } catch (err) {
        setError(err.message || 'Erreur de chargement des filieres');
      }
    };

    chargerFilieres();
  }, [form.etablissementId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMessage('');
    setError('');
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'etablissementId' ? { filiereId: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      setError('');

      const payload = {
        etablissementId: form.etablissementId,
        filiereId: form.filiereId,
        anneeAcademique: form.anneeAcademique,
        niveau: Number(form.niveau),
      };

      const data = await inscriptionAcadService.creer(payload);
      setMessage(data.message || 'Inscription academique creee avec succes');
      setForm({
        etablissementId: '',
        filiereId: '',
        anneeAcademique: '',
        niveau: '',
      });
      setFilieres([]);
    } catch (err) {
      const texte = err.message || 'Erreur lors de la creation de l inscription academique';
      if (texte.includes('existe deja')) {
        setError('Inscription en doublon : cette filiere a deja une inscription sur cette annee.');
      } else if (texte.includes('Progression bloquee')) {
        setError('Progression bloquee : annee precedente non validee.');
      } else {
        setError(texte);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-semibold text-slate-900'>Nouvelle inscription academique</h1>
        <p className='mt-1 text-sm text-slate-500'>Selectionnez un etablissement, une filiere et votre niveau.</p>

        {chargementInitial && <p className='mt-4 text-sm text-slate-600'>Chargement des donnees...</p>}
        {!chargementInitial && error && (
          <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</div>
        )}
        {!chargementInitial && message && (
          <div className='mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700'>{message}</div>
        )}

        <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='etablissementId' className='mb-1 block text-sm font-medium text-slate-700'>
              Etablissement
            </label>
            <select
              id='etablissementId'
              name='etablissementId'
              value={form.etablissementId}
              onChange={handleChange}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500'
              required
            >
              <option value=''>Selectionner...</option>
              {etablissements.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor='filiereId' className='mb-1 block text-sm font-medium text-slate-700'>
              Filiere
            </label>
            <select
              id='filiereId'
              name='filiereId'
              value={form.filiereId}
              onChange={handleChange}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500'
              required
              disabled={!form.etablissementId}
            >
              <option value=''>Selectionner...</option>
              {filieres.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom} ({item.code})
                </option>
              ))}
            </select>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label htmlFor='anneeAcademique' className='mb-1 block text-sm font-medium text-slate-700'>
                Annee academique
              </label>
              <input
                id='anneeAcademique'
                name='anneeAcademique'
                value={form.anneeAcademique}
                onChange={handleChange}
                placeholder='2025-2026'
                className='w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500'
                required
              />
            </div>
            <div>
              <label htmlFor='niveau' className='mb-1 block text-sm font-medium text-slate-700'>
                Niveau
              </label>
              <input
                id='niveau'
                name='niveau'
                type='number'
                min='1'
                max='8'
                value={form.niveau}
                onChange={handleChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500'
                required
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {loading ? 'Enregistrement...' : 'Creer l inscription academique'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InscriptionAcademique;

