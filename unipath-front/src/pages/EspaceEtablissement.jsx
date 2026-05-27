import { useEffect, useState } from 'react';
import { applicationService, etablissementService, filiereService, preinscriptionEtablissementService } from '../services/api';

function EspaceEtablissement() {
  const [loading, setLoading] = useState(true);
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);
  const [error, setError] = useState('');
  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [demandesPreinscription, setDemandesPreinscription] = useState([]);
  const [demandesApplication, setDemandesApplication] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [requirementForm, setRequirementForm] = useState({
    code: '',
    label: '',
    requirementType: 'DOCUMENT_UPLOAD',
    profileFieldKey: '',
    isRequired: true,
  });
  const [selectedEtablissement, setSelectedEtablissement] = useState('');
  const [monProfil, setMonProfil] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [filters, setFilters] = useState({ filiere: '', annee: '' });

  useEffect(() => {
    const chargerEtablissements = async () => {
      try {
        setLoading(true);
        setError('');

        try {
          const profilData = await etablissementService.getMonProfil();
          const etab = profilData?.etablissement || null;
          if (etab) {
            setMonProfil(etab);
            setEtablissements([etab]);
            setSelectedEtablissement(etab.id);
            return;
          }
        } catch {
          // Fallback pour les roles non-etablissement utilisant cette page
        }

        const data = await etablissementService.getAll();
        const list = data.etablissements || [];
        setEtablissements(list);
        if (list.length > 0) setSelectedEtablissement(list[0].id);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des etablissements');
      } finally {
        setLoading(false);
      }
    };

    chargerEtablissements();
  }, []);

  useEffect(() => {
    const chargerDonnees = async () => {
      if (!selectedEtablissement) return;
      try {
        setLoadingEtudiants(true);
        const [filieresData, etudiantsData] = await Promise.all([
          filiereService.getByEtablissement(selectedEtablissement),
          etablissementService.getEtudiants(selectedEtablissement, filters),
        ]);
        setFilieres(filieresData.filieres || []);
        setEtudiants(etudiantsData.etudiants || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des etudiants');
      } finally {
        setLoadingEtudiants(false);
      }
    };

    chargerDonnees();
  }, [selectedEtablissement, filters]);

  useEffect(() => {
    const chargerDemandes = async () => {
      try {
        const [dataPreinscriptions, dataApplications, dataRequirements] = await Promise.all([
          preinscriptionEtablissementService.getDemandesEtablissement('EN_ATTENTE'),
          applicationService.getDemandesEtablissement(),
          applicationService.getMyRequirementsEtablissement(),
        ]);
        setDemandesPreinscription(dataPreinscriptions.demandes || []);
        setDemandesApplication(dataApplications.applications || []);
        setRequirements(dataRequirements.requirements || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des demandes');
      }
    };

    if (monProfil) chargerDemandes();
  }, [monProfil]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    try {
      setUploadingLogo(true);
      setError('');
      await etablissementService.uploadMonLogo(logoFile);
      const profilData = await etablissementService.getMonProfil();
      const etab = profilData?.etablissement || null;
      if (etab) {
        setMonProfil(etab);
        setEtablissements([etab]);
      }
      setLogoFile(null);
    } catch (err) {
      setError(err.message || 'Erreur upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDecisionPreinscription = async (id, statut) => {
    try {
      let motifDecision = '';
      if (statut === 'SOUS_RESERVE' || statut === 'REJETE') {
        motifDecision = window.prompt('Motif de la décision :', '') || '';
      }
      await preinscriptionEtablissementService.decider(id, { statut, motifDecision });
      const data = await preinscriptionEtablissementService.getDemandesEtablissement('EN_ATTENTE');
      setDemandesPreinscription(data.demandes || []);
    } catch (err) {
      setError(err.message || 'Erreur lors de la decision');
    }
  };

  const handleRequirementField = (event) => {
    const { name, value, type, checked } = event.target;
    setRequirementForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveRequirement = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await applicationService.upsertRequirementEtablissement({
        code: requirementForm.code.trim(),
        label: requirementForm.label.trim(),
        requirementType: requirementForm.requirementType,
        profileFieldKey:
          requirementForm.requirementType === 'PROFILE_FIELD' ? requirementForm.profileFieldKey.trim() : undefined,
        isRequired: Boolean(requirementForm.isRequired),
      });
      const data = await applicationService.getMyRequirementsEtablissement();
      setRequirements(data.requirements || []);
      setRequirementForm({
        code: '',
        label: '',
        requirementType: 'DOCUMENT_UPLOAD',
        profileFieldKey: '',
        isRequired: true,
      });
    } catch (err) {
      setError(err.message || 'Erreur enregistrement exigence');
    }
  };

  const handleDeleteRequirement = async (id) => {
    try {
      setError('');
      await applicationService.deleteRequirementEtablissement(id);
      setRequirements((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Erreur suppression exigence');
    }
  };

  if (loading) {
    return <div className='p-6 text-slate-600'>Chargement de l espace etablissement...</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-6xl space-y-4'>
        <h1 className='text-2xl font-semibold text-slate-900'>Espace Etablissement</h1>

        {error && <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</div>}

        {monProfil && (
          <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1 text-sm text-slate-700'>
                <h2 className='text-lg font-semibold text-slate-900'>Profil de l etablissement</h2>
                <p><strong>Nom:</strong> {monProfil.nom}</p>
                <p><strong>Type:</strong> {monProfil.type}</p>
                <p><strong>Ville:</strong> {monProfil.ville}</p>
                <p><strong>Email:</strong> {monProfil.email || '-'}</p>
              </div>

              <div className='flex flex-col gap-2'>
                {monProfil.logoUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${monProfil.logoUrl}`}
                    alt='Logo etablissement'
                    className='h-20 w-20 rounded border object-contain bg-white'
                  />
                ) : (
                  <div className='flex h-20 w-20 items-center justify-center rounded border bg-slate-100 text-xs text-slate-500'>
                    Aucun logo
                  </div>
                )}
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className='text-xs'
                />
                <button
                  type='button'
                  onClick={handleUploadLogo}
                  disabled={!logoFile || uploadingLogo}
                  className='rounded bg-blue-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50'
                >
                  {uploadingLogo ? 'Upload...' : 'Mettre a jour le logo'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Demandes de dossier (nouveau flow)</h2>
            <span className='text-sm text-slate-500'>{demandesApplication.length} demande(s)</span>
          </div>
          {demandesApplication.length === 0 && (
            <p className='text-sm text-slate-500'>Aucune demande de dossier pour le moment.</p>
          )}
          {demandesApplication.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Numero</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Etudiant</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Filiere</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Statut</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {demandesApplication.map((d) => (
                    <tr key={d.id}>
                      <td className='px-3 py-2 text-slate-700'>{d.numeroApplication}</td>
                      <td className='px-3 py-2 text-slate-700'>{`${d.candidat?.nom || ''} ${d.candidat?.prenom || ''}`.trim()}</td>
                      <td className='px-3 py-2 text-slate-700'>{d.filiere?.nom || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='mb-3 text-lg font-semibold text-slate-900'>Configuration des pieces requises</h2>
          <form className='grid gap-3 md:grid-cols-5' onSubmit={handleSaveRequirement}>
            <input
              name='code'
              value={requirementForm.code}
              onChange={handleRequirementField}
              placeholder='code_piece'
              className='rounded border border-slate-300 px-3 py-2 text-sm'
              required
            />
            <input
              name='label'
              value={requirementForm.label}
              onChange={handleRequirementField}
              placeholder='Libelle'
              className='rounded border border-slate-300 px-3 py-2 text-sm'
              required
            />
            <select
              name='requirementType'
              value={requirementForm.requirementType}
              onChange={handleRequirementField}
              className='rounded border border-slate-300 px-3 py-2 text-sm'
            >
              <option value='DOCUMENT_UPLOAD'>DOCUMENT_UPLOAD</option>
              <option value='PROFILE_FIELD'>PROFILE_FIELD</option>
            </select>
            <input
              name='profileFieldKey'
              value={requirementForm.profileFieldKey}
              onChange={handleRequirementField}
              placeholder='profileFieldKey (si PROFILE_FIELD)'
              className='rounded border border-slate-300 px-3 py-2 text-sm'
              disabled={requirementForm.requirementType !== 'PROFILE_FIELD'}
            />
            <button
              type='submit'
              className='rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white'
            >
              Enregistrer
            </button>
          </form>
          <label className='mt-3 flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              name='isRequired'
              checked={requirementForm.isRequired}
              onChange={handleRequirementField}
            />
            Exigence obligatoire
          </label>

          {requirements.length > 0 && (
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Code</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Libelle</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Type</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Profil</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {requirements.map((r) => (
                    <tr key={r.id}>
                      <td className='px-3 py-2'>{r.code}</td>
                      <td className='px-3 py-2'>{r.label}</td>
                      <td className='px-3 py-2'>{r.requirementType}</td>
                      <td className='px-3 py-2'>{r.profileFieldKey || '-'}</td>
                      <td className='px-3 py-2'>
                        <button
                          type='button'
                          onClick={() => handleDeleteRequirement(r.id)}
                          className='rounded bg-red-700 px-2 py-1 text-xs font-medium text-white'
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

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Demandes de pre-inscription (en attente)</h2>
            <span className='text-sm text-slate-500'>{demandesPreinscription.length} demande(s)</span>
          </div>
          {demandesPreinscription.length === 0 && (
            <p className='text-sm text-slate-500'>Aucune demande en attente.</p>
          )}
          {demandesPreinscription.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Numero</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Etudiant</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Filiere</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Annee</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Niveau</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {demandesPreinscription.map((d) => (
                    <tr key={d.id}>
                      <td className='px-3 py-2 text-slate-700'>{d.numeroPreinscription}</td>
                      <td className='px-3 py-2 text-slate-700'>{`${d.candidat?.nom || ''} ${d.candidat?.prenom || ''}`.trim()}</td>
                      <td className='px-3 py-2 text-slate-700'>{d.filiere?.nom || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{d.anneeAcademique}</td>
                      <td className='px-3 py-2 text-slate-700'>{d.niveau}</td>
                      <td className='px-3 py-2 text-slate-700'>
                        <div className='flex flex-wrap gap-2'>
                          <button
                            type='button'
                            onClick={() => handleDecisionPreinscription(d.id, 'VALIDE')}
                            className='rounded bg-green-700 px-2 py-1 text-xs font-medium text-white hover:bg-green-600'
                          >
                            Valider
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDecisionPreinscription(d.id, 'SOUS_RESERVE')}
                            className='rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500'
                          >
                            Sous reserve
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDecisionPreinscription(d.id, 'REJETE')}
                            className='rounded bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-600'
                          >
                            Rejeter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div>
              <label htmlFor='etablissement' className='mb-1 block text-sm font-medium text-slate-700'>
                Etablissement
              </label>
              <select
                id='etablissement'
                value={selectedEtablissement}
                onChange={(e) => setSelectedEtablissement(e.target.value)}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              >
                {etablissements.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='filiere' className='mb-1 block text-sm font-medium text-slate-700'>
                Filiere
              </label>
              <select
                id='filiere'
                name='filiere'
                value={filters.filiere}
                onChange={handleFilterChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              >
                <option value=''>Toutes</option>
                {filieres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='annee' className='mb-1 block text-sm font-medium text-slate-700'>
                Annee academique
              </label>
              <input
                id='annee'
                name='annee'
                value={filters.annee}
                onChange={handleFilterChange}
                placeholder='2025-2026'
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              />
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Etudiants inscrits</h2>
            <span className='text-sm text-slate-500'>{etudiants.length} resultat(s)</span>
          </div>

          {loadingEtudiants && <p className='text-sm text-slate-600'>Chargement des etudiants...</p>}

          {!loadingEtudiants && etudiants.length === 0 && (
            <p className='text-sm text-slate-500'>Aucun etudiant trouve pour ces filtres.</p>
          )}

          {!loadingEtudiants && etudiants.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Matricule</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Nom complet</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Filiere</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Annee</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Niveau</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Statut</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {etudiants.map((row) => (
                    <tr key={row.id}>
                      <td className='px-3 py-2 text-slate-700'>{row.candidat?.matricule || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{`${row.candidat?.nom || ''} ${row.candidat?.prenom || ''}`.trim()}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.filiere?.nom || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.anneeAcademique}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.niveau}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EspaceEtablissement;

