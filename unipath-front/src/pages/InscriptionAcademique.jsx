import { useCallback, useEffect, useState } from 'react';
import { applicationService, etablissementService, filiereService } from '../services/api';

function InscriptionAcademique() {
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [applicationDetail, setApplicationDetail] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [uploadFiles, setUploadFiles] = useState({});
  const [bankReceiptFile, setBankReceiptFile] = useState(null);

  const [form, setForm] = useState({
    etablissementId: '',
    filiereId: '',
    anneeAcademique: '',
    niveau: '',
  });

  const loadApplications = useCallback(async (preferId = '') => {
    setLoadingList(true);
    const data = await applicationService.getMesDemandes();
    const list = data.applications || [];
    setApplications(list);
    const nextId = preferId || selectedApplicationId || list[0]?.id || '';
    setSelectedApplicationId(nextId);
    setLoadingList(false);
    return nextId;
  }, [selectedApplicationId]);

  const loadApplicationDetails = useCallback(async (id) => {
    if (!id) {
      setApplicationDetail(null);
      setRequirements([]);
      return;
    }
    setLoadingDetail(true);
    const [detail, req] = await Promise.all([
      applicationService.getById(id),
      applicationService.getRequirements(id),
    ]);
    setApplicationDetail(detail.application || null);
    setRequirements(req.requirements || []);
    setLoadingDetail(false);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await etablissementService.getAll();
        setEtablissements((data.etablissements || []).filter((e) => e.type === 'PRIVE'));
        const appId = await loadApplications();
        if (appId) await loadApplicationDetails(appId);
      } catch (err) {
        setError(err.message || 'Erreur de chargement initial');
        setLoadingList(false);
      }
    };
    bootstrap();
  }, [loadApplicationDetails, loadApplications]);

  useEffect(() => {
    const loadFilieres = async () => {
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
    loadFilieres();
  }, [form.etablissementId]);

  useEffect(() => {
    if (!selectedApplicationId) return;
    loadApplicationDetails(selectedApplicationId).catch((err) => {
      setError(err.message || 'Erreur de chargement du dossier');
    });
  }, [loadApplicationDetails, selectedApplicationId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError('');
    setMessage('');
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'etablissementId' ? { filiereId: '' } : {}),
    }));
  };

  const handleCreateApplication = async (event) => {
    event.preventDefault();
    try {
      setLoadingCreate(true);
      setError('');
      setMessage('');
      const payload = {
        etablissementId: form.etablissementId,
        filiereId: form.filiereId,
        anneeAcademique: form.anneeAcademique,
        niveau: Number(form.niveau),
      };
      const data = await applicationService.creer(payload);
      const appId = data?.application?.id || '';
      const chosenId = await loadApplications(appId);
      if (chosenId) await loadApplicationDetails(chosenId);
      setMessage(data.message || 'Demande creee avec succes');
    } catch (err) {
      setError(err.message || 'Erreur lors de la creation');
    } finally {
      setLoadingCreate(false);
    }
  };

  const payDossierFees = async () => {
    if (!selectedApplicationId) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.payerFraisDossierMock(selectedApplicationId);
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Paiement confirme');
    } catch (err) {
      setError(err.message || 'Erreur paiement frais dossier');
    } finally {
      setActionBusy(false);
    }
  };

  const uploadBankReceipt = async () => {
    if (!selectedApplicationId || !bankReceiptFile) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.uploadQuittanceBancaire(selectedApplicationId, bankReceiptFile);
      setBankReceiptFile(null);
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Quittance bancaire enregistree');
    } catch (err) {
      setError(err.message || 'Erreur upload quittance bancaire');
    } finally {
      setActionBusy(false);
    }
  };

  const uploadRequiredDocument = async (code) => {
    if (!selectedApplicationId || !uploadFiles[code]) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.uploadDocument(selectedApplicationId, code, uploadFiles[code]);
      setUploadFiles((prev) => ({ ...prev, [code]: null }));
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Document ajoute');
    } catch (err) {
      setError(err.message || 'Erreur upload document');
    } finally {
      setActionBusy(false);
    }
  };

  const finalizeApplication = async () => {
    if (!selectedApplicationId) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.finaliser(selectedApplicationId);
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Fiche generee');
    } catch (err) {
      setError(err.message || 'Erreur finalisation dossier');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-6xl space-y-4'>
        <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h1 className='text-2xl font-semibold text-slate-900'>Depot de dossier - ecoles privees</h1>
          <p className='mt-1 text-sm text-slate-500'>
            Créez votre demande, reglez les frais, completez les pieces et generez la fiche de pre-inscription.
          </p>

          {error && <div className='mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</div>}
          {message && (
            <div className='mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700'>{message}</div>
          )}

          <form className='mt-6 grid gap-4 md:grid-cols-2' onSubmit={handleCreateApplication}>
            <div>
              <label htmlFor='etablissementId' className='mb-1 block text-sm font-medium text-slate-700'>Etablissement prive</label>
              <select
                id='etablissementId'
                name='etablissementId'
                value={form.etablissementId}
                onChange={handleChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
                required
              >
                <option value=''>Selectionner...</option>
                {etablissements.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='filiereId' className='mb-1 block text-sm font-medium text-slate-700'>Filiere</label>
              <select
                id='filiereId'
                name='filiereId'
                value={form.filiereId}
                onChange={handleChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
                required
                disabled={!form.etablissementId}
              >
                <option value=''>Selectionner...</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='anneeAcademique' className='mb-1 block text-sm font-medium text-slate-700'>Annee academique</label>
              <input
                id='anneeAcademique'
                name='anneeAcademique'
                value={form.anneeAcademique}
                onChange={handleChange}
                placeholder='2025-2026'
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
                required
              />
            </div>

            <div>
              <label htmlFor='niveau' className='mb-1 block text-sm font-medium text-slate-700'>Niveau</label>
              <input
                id='niveau'
                name='niveau'
                type='number'
                min='1'
                max='8'
                value={form.niveau}
                onChange={handleChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
                required
              />
            </div>

            <div className='md:col-span-2'>
              <button
                type='submit'
                disabled={loadingCreate}
                className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'
              >
                {loadingCreate ? 'Creation...' : 'Creer une nouvelle demande'}
              </button>
            </div>
          </form>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>Mes demandes</h2>
          {loadingList && <p className='mt-2 text-sm text-slate-500'>Chargement...</p>}
          {!loadingList && applications.length === 0 && (
            <p className='mt-2 text-sm text-slate-500'>Aucune demande pour le moment.</p>
          )}
          {!loadingList && applications.length > 0 && (
            <div className='mt-3 overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left'>Numero</th>
                    <th className='px-3 py-2 text-left'>Etablissement</th>
                    <th className='px-3 py-2 text-left'>Filiere</th>
                    <th className='px-3 py-2 text-left'>Statut</th>
                    <th className='px-3 py-2 text-left'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {applications.map((a) => (
                    <tr key={a.id}>
                      <td className='px-3 py-2'>{a.numeroApplication}</td>
                      <td className='px-3 py-2'>{a.etablissement?.nom || '-'}</td>
                      <td className='px-3 py-2'>{a.filiere?.nom || '-'}</td>
                      <td className='px-3 py-2'>{a.status}</td>
                      <td className='px-3 py-2'>
                        <button
                          type='button'
                          onClick={() => setSelectedApplicationId(a.id)}
                          className='rounded bg-slate-800 px-3 py-1 text-xs text-white'
                        >
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>Suivi du dossier selectionne</h2>
          {!selectedApplicationId && <p className='mt-2 text-sm text-slate-500'>Selectionnez une demande.</p>}
          {loadingDetail && <p className='mt-2 text-sm text-slate-500'>Chargement du detail...</p>}
          {!loadingDetail && applicationDetail && (
            <div className='mt-3 space-y-4'>
              <div className='grid gap-3 md:grid-cols-3'>
                <button
                  type='button'
                  onClick={payDossierFees}
                  disabled={actionBusy}
                  className='rounded bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-60'
                >
                  Payer frais dossier (mock)
                </button>
                <div className='rounded border border-slate-200 p-2'>
                  <input
                    type='file'
                    accept='application/pdf,image/png,image/jpeg'
                    onChange={(e) => setBankReceiptFile(e.target.files?.[0] || null)}
                    className='w-full text-xs'
                  />
                  <button
                    type='button'
                    onClick={uploadBankReceipt}
                    disabled={actionBusy || !bankReceiptFile}
                    className='mt-2 rounded bg-indigo-700 px-3 py-1 text-xs text-white disabled:opacity-60'
                  >
                    Upload quittance bancaire
                  </button>
                </div>
                <button
                  type='button'
                  onClick={finalizeApplication}
                  disabled={actionBusy}
                  className='rounded bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-60'
                >
                  Finaliser et generer fiche
                </button>
              </div>

              <div className='rounded border border-slate-200 p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <h3 className='font-medium text-slate-900'>Pieces requises</h3>
                  <button
                    type='button'
                    onClick={() => applicationService.telechargerFiche(selectedApplicationId)}
                    className='rounded bg-slate-700 px-3 py-1 text-xs text-white'
                  >
                    Telecharger fiche
                  </button>
                </div>
                {requirements.length === 0 && (
                  <p className='text-sm text-slate-500'>Aucune exigence configuree pour cet etablissement.</p>
                )}
                {requirements.length > 0 && (
                  <div className='space-y-3'>
                    {requirements.map((req) => (
                      <div key={req.code} className='rounded border border-slate-100 bg-slate-50 p-3'>
                        <p className='text-sm font-medium text-slate-800'>{req.label}</p>
                        <p className='text-xs text-slate-500'>
                          {req.provided ? 'Fourni' : req.requirementType === 'PROFILE_FIELD' ? 'Attendu depuis profil' : 'Upload requis'}
                        </p>
                        {req.requirementType === 'DOCUMENT_UPLOAD' && !req.provided && (
                          <div className='mt-2 flex flex-wrap items-center gap-2'>
                            <input
                              type='file'
                              accept='application/pdf,image/png,image/jpeg'
                              onChange={(e) =>
                                setUploadFiles((prev) => ({ ...prev, [req.code]: e.target.files?.[0] || null }))
                              }
                              className='text-xs'
                            />
                            <button
                              type='button'
                              onClick={() => uploadRequiredDocument(req.code)}
                              disabled={actionBusy || !uploadFiles[req.code]}
                              className='rounded bg-slate-800 px-3 py-1 text-xs text-white disabled:opacity-60'
                            >
                              Envoyer
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InscriptionAcademique;

