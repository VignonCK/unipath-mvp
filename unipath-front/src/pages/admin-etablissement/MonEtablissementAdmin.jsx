import { useEffect, useRef, useState } from 'react';
import {
  applicationService,
  etablissementService,
  filiereService,
  demandeFiliereAdminService,
  dgesService,
  resolvePublicAssetUrl,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

const EMPTY_FILIERE = {
  modeNom: 'catalogue', // catalogue | autre
  filiereReferenceId: '',
  nom: '',
  code: '',
  niveau: 'LICENCE',
  /// true si le catalogue n'impose pas Licence/Master (niveau null)
  niveauLibre: true,
  dureeAnnees: '',
  fraisScolariteAnnuels: '',
  fraisInscriptionEffective: '',
  fraisAutres: '',
  debouches: '',
  partenariatsEntreprises: '',
  partenariatsUniversites: '',
  dureeStage: '',
  langueEnseignement: '',
};

const LABEL_NIVEAU = {
  LICENCE: 'Licence',
  MASTER: 'Master',
  AUTRE: 'Autres',
};

const dureePourNiveau = (niveau) => {
  if (niveau === 'MASTER') return 2;
  if (niveau === 'LICENCE') return 3;
  return null;
};

const buildFilierePayload = (form) => {
  const dureeFixe = dureePourNiveau(form.niveau);
  const dureeAnnees = dureeFixe != null ? dureeFixe : Number(form.dureeAnnees);

  return {
    filiereReferenceId: form.modeNom === 'catalogue' && form.filiereReferenceId
      ? form.filiereReferenceId
      : undefined,
    nom: form.modeNom === 'autre' ? form.nom.trim() : form.nom.trim() || undefined,
    code: form.code.trim() || undefined,
    niveau: form.niveau,
    dureeAnnees,
    fraisScolariteAnnuels: form.fraisScolariteAnnuels !== '' ? Number(form.fraisScolariteAnnuels) : null,
    fraisInscriptionEffective: form.fraisInscriptionEffective !== '' ? Number(form.fraisInscriptionEffective) : null,
    fraisAutres: form.fraisAutres.trim() || null,
    debouches: form.debouches.trim() || null,
    partenariatsEntreprises: form.partenariatsEntreprises.trim() || null,
    partenariatsUniversites: form.partenariatsUniversites.trim() || null,
    dureeStage: form.dureeStage.trim() || null,
    langueEnseignement: form.langueEnseignement.trim() || null,
  };
};

const STATUT_DEMANDE = {
  EN_ATTENTE: { label: 'En attente DGES', className: 'bg-amber-100 text-amber-900' },
  VALIDE: { label: 'Validée', className: 'bg-emerald-100 text-emerald-800' },
  REJETE: { label: 'Rejetée', className: 'bg-red-100 text-red-800' },
};

export default function MonEtablissementAdmin() {
  const user = getUser();
  const [etablissement, setEtablissement] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [catalogueFilieres, setCatalogueFilieres] = useState([]);
  const [demandesFiliere, setDemandesFiliere] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filiereForm, setFiliereForm] = useState(EMPTY_FILIERE);
  const [profilForm, setProfilForm] = useState({
    ville: '',
    adresse: '',
    email: '',
    telephone: '',
    siteWeb: '',
    description: '',
    agrementMESRS: '',
    anneeCreation: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  });
  const [requirementForm, setRequirementForm] = useState({
    code: '',
    label: '',
    requirementType: 'DOCUMENT_UPLOAD',
    profileFieldKey: '',
    isRequired: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const filiereFormRef = useRef(null);

  const charger = () => {
    if (!user?.etablissementId) {
      setError('Établissement non associé à votre compte');
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      etablissementService.getMonProfil(),
      filiereService.getByEtablissement(user.etablissementId),
      applicationService.getMyRequirementsEtablissement(),
      demandeFiliereAdminService.getAll(),
      dgesService.listerFilieresReference({ actifs: '1' }),
    ])
      .then(([profilData, filData, reqData, demandesData, catalogueData]) => {
        const etab = profilData.etablissement;
        setEtablissement(etab);
        setProfilForm({
          ville: etab?.ville || '',
          adresse: etab?.adresse || '',
          email: etab?.email || '',
          telephone: etab?.telephone || '',
          siteWeb: etab?.siteWeb || '',
          description: etab?.description || '',
          agrementMESRS: etab?.agrementMESRS || '',
          anneeCreation: etab?.anneeCreation != null ? String(etab.anneeCreation) : '',
          facebook: etab?.facebook || '',
          instagram: etab?.instagram || '',
          linkedin: etab?.linkedin || '',
        });
        setFilieres(filData.filieres || []);
        setRequirements(reqData.requirements || []);
        setDemandesFiliere(demandesData.demandes || []);
        setCatalogueFilieres(catalogueData.references || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [user?.etablissementId]);

  const handleDemandeFiliere = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (filiereForm.modeNom === 'catalogue' && !filiereForm.filiereReferenceId) {
      setError('Sélectionnez une filière dans le catalogue DGES, ou choisissez « Autre ».');
      return;
    }
    if (filiereForm.modeNom === 'autre' && !filiereForm.nom.trim()) {
      setError('Le nom de la filière est obligatoire.');
      return;
    }
    if (filiereForm.niveau === 'AUTRE') {
      const d = Number(filiereForm.dureeAnnees);
      if (!Number.isFinite(d) || d < 1 || d > 5) {
        setError('Pour « Autres », indiquez la durée de la formation (entre 1 et 5 ans).');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = buildFilierePayload(filiereForm);
      const res = await demandeFiliereAdminService.creer(payload);
      setSuccess(res.message || 'Demande envoyée à la DGES.');
      setFiliereForm(EMPTY_FILIERE);
      charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'envoyer la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSavingProfil(true);
    setError('');
    try {
      await etablissementService.updateMonProfil(profilForm);
      setSuccess('Profil mis à jour.');
      charger();
    } catch (err) {
      setError(err.message || 'Erreur mise à jour profil');
    } finally {
      setSavingProfil(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setError('');
    try {
      await etablissementService.uploadMonLogo(logoFile);
      setLogoFile(null);
      setSuccess('Logo mis à jour.');
      charger();
    } catch (err) {
      setError(err.message || 'Erreur upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveRequirement = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await applicationService.upsertRequirementEtablissement({
        code: requirementForm.code.trim(),
        label: requirementForm.label.trim(),
        requirementType: requirementForm.requirementType,
        profileFieldKey:
          requirementForm.requirementType === 'PROFILE_FIELD'
            ? requirementForm.profileFieldKey.trim()
            : undefined,
        isRequired: Boolean(requirementForm.isRequired),
      });
      setRequirementForm({
        code: '',
        label: '',
        requirementType: 'DOCUMENT_UPLOAD',
        profileFieldKey: '',
        isRequired: true,
      });
      setSuccess('Exigence enregistrée.');
      charger();
    } catch (err) {
      setError(err.message || 'Erreur enregistrement exigence');
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Supprimer cette exigence ?')) return;
    try {
      await applicationService.deleteRequirementEtablissement(id);
      setSuccess('Exigence supprimée.');
      charger();
    } catch (err) {
      setError(err.message || 'Erreur suppression');
    }
  };

  const logoSrc = resolvePublicAssetUrl(etablissement?.logoUrl);
  // cache-bust après upload (évite une image cassée en cache navigateur)
  const logoDisplaySrc = logoSrc
    ? `${logoSrc}${logoSrc.includes('?') ? '&' : '?'}t=${etablissement?.updatedAt || Date.now()}`
    : null;

  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-black text-gray-900">Mon Établissement</h1>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : etablissement && (
          <>
            <BentoCard className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">{etablissement.nom}</h2>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${etablissement.type === 'PRIVE' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                    {etablissement.type}
                  </span>
                </div>
                <div className="flex flex-col items-start gap-2">
                  {logoDisplaySrc ? (
                    <img src={logoDisplaySrc} alt="Logo" className="h-20 w-20 rounded border object-contain bg-white" />
                  ) : (
                    <div className="h-20 w-20 rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-400">Aucun logo</div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-xs" />
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={!logoFile || uploadingLogo}
                    className="px-3 py-1.5 text-xs font-semibold bg-teal-900 text-white rounded-lg disabled:opacity-50"
                  >
                    {uploadingLogo ? 'Envoi...' : 'Mettre à jour le logo'}
                  </button>
                </div>
              </div>
              <form onSubmit={handleSaveProfil} className="mt-6 grid gap-3 sm:grid-cols-2 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ville</label>
                  <input
                    type="text"
                    value={profilForm.ville}
                    onChange={(e) => setProfilForm((p) => ({ ...p, ville: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email contact</label>
                  <input
                    type="email"
                    value={profilForm.email}
                    onChange={(e) => setProfilForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={profilForm.adresse}
                    onChange={(e) => setProfilForm((p) => ({ ...p, adresse: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={profilForm.telephone}
                    onChange={(e) => setProfilForm((p) => ({ ...p, telephone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Site web</label>
                  <input
                    type="url"
                    value={profilForm.siteWeb}
                    onChange={(e) => setProfilForm((p) => ({ ...p, siteWeb: e.target.value }))}
                    placeholder="https://"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Agrément MESRS</label>
                  <input
                    type="text"
                    value={profilForm.agrementMESRS}
                    onChange={(e) => setProfilForm((p) => ({ ...p, agrementMESRS: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Année de création</label>
                  <input
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    value={profilForm.anneeCreation}
                    onChange={(e) => setProfilForm((p) => ({ ...p, anneeCreation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={profilForm.description}
                    onChange={(e) => setProfilForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={profilForm.facebook}
                    onChange={(e) => setProfilForm((p) => ({ ...p, facebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={profilForm.instagram}
                    onChange={(e) => setProfilForm((p) => ({ ...p, instagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={profilForm.linkedin}
                    onChange={(e) => setProfilForm((p) => ({ ...p, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={savingProfil}
                    className="px-4 py-2 text-sm font-semibold bg-teal-900 text-white rounded-lg disabled:opacity-50"
                  >
                    {savingProfil ? 'Enregistrement...' : 'Enregistrer le profil'}
                  </button>
                </div>
              </form>
            </BentoCard>

            <div ref={filiereFormRef} className="scroll-mt-6">
            <BentoCard className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900">Filières</h3>
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;ajout d&apos;une filière passe par une demande à la DGES. Une fois validée, la filière apparaît dans la liste ci-dessous.
                </p>
              </div>
              <form onSubmit={handleDemandeFiliere} className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold text-gray-700">Demander l&apos;ajout d&apos;une filière</p>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Nom de la filière *</label>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="modeNom"
                        checked={filiereForm.modeNom === 'catalogue'}
                        onChange={() => setFiliereForm((p) => ({
                          ...p,
                          modeNom: 'catalogue',
                          nom: '',
                          niveauLibre: true,
                          dureeAnnees: '',
                        }))}
                      />
                      Choisir dans le catalogue DGES
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="modeNom"
                        checked={filiereForm.modeNom === 'autre'}
                        onChange={() => setFiliereForm((p) => ({
                          ...p,
                          modeNom: 'autre',
                          filiereReferenceId: '',
                          niveauLibre: true,
                          dureeAnnees: p.niveau === 'AUTRE' ? (p.dureeAnnees || '') : '',
                        }))}
                      />
                      Autre (saisie libre)
                    </label>
                  </div>
                  {filiereForm.modeNom === 'catalogue' ? (
                    <select
                      required
                      value={filiereForm.filiereReferenceId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const ref = catalogueFilieres.find((r) => r.id === id);
                        const niveauImpose = ref?.niveau === 'LICENCE' || ref?.niveau === 'MASTER'
                          ? ref.niveau
                          : null;
                        setFiliereForm((p) => ({
                          ...p,
                          filiereReferenceId: id,
                          nom: ref?.nom || '',
                          niveau: niveauImpose || p.niveau,
                          niveauLibre: !niveauImpose,
                          dureeAnnees: (niveauImpose || p.niveau) === 'AUTRE' ? (p.dureeAnnees || '') : '',
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="">
                        {catalogueFilieres.length === 0
                          ? 'Aucune filière définie par la DGES'
                          : 'Sélectionner une filière'}
                      </option>
                      {catalogueFilieres.map((ref) => (
                        <option key={ref.id} value={ref.id}>
                          {ref.nom}
                          {ref.niveau ? ` (${ref.niveau})` : ' (niveau indifférent)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Nom de la filière *"
                      value={filiereForm.nom}
                      onChange={(e) => setFiliereForm((p) => ({ ...p, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      required
                    />
                  )}
                  <p className="text-[11px] text-gray-400">
                    Si la filière n&apos;est pas dans le catalogue, utilisez « Autre » pour saisir le nom.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Code (optionnel)"
                  value={filiereForm.code}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, code: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Niveau / Durée de la formation *
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filiereForm.niveau}
                      onChange={(e) => {
                        const niveau = e.target.value;
                        setFiliereForm((p) => ({
                          ...p,
                          niveau,
                          dureeAnnees: niveau === 'AUTRE' ? (p.dureeAnnees || '') : '',
                        }));
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      aria-label="Niveau"
                      disabled={!filiereForm.niveauLibre}
                    >
                      <option value="LICENCE">Licence</option>
                      <option value="MASTER">Master</option>
                      {filiereForm.niveauLibre && <option value="AUTRE">Autres</option>}
                    </select>
                    {filiereForm.niveau === 'AUTRE' ? (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          required
                          value={filiereForm.dureeAnnees}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setFiliereForm((p) => ({ ...p, dureeAnnees: '' }));
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n)) return;
                            setFiliereForm((p) => ({
                              ...p,
                              dureeAnnees: String(Math.min(5, Math.max(1, Math.round(n)))),
                            }));
                          }}
                          placeholder="Durée"
                          className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          aria-label="Durée en années"
                        />
                        <span className="text-sm text-gray-500">an(s)</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-600">
                        — {dureePourNiveau(filiereForm.niveau)} ans
                      </span>
                    )}
                  </div>
                  {filiereForm.niveau === 'AUTRE' && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Précisez la durée de la formation (1 à 5 ans).
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  placeholder="Frais scolarité annuels (FCFA)"
                  value={filiereForm.fraisScolariteAnnuels}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, fraisScolariteAnnuels: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Frais inscription effective (FCFA)"
                  value={filiereForm.fraisInscriptionEffective}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, fraisInscriptionEffective: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Langue d'enseignement"
                  value={filiereForm.langueEnseignement}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, langueEnseignement: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Durée du stage (ex: 3 mois en L3)"
                  value={filiereForm.dureeStage}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, dureeStage: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Autres frais (description libre)"
                  value={filiereForm.fraisAutres}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, fraisAutres: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Débouchés"
                  value={filiereForm.debouches}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, debouches: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Partenariats entreprises"
                  value={filiereForm.partenariatsEntreprises}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, partenariatsEntreprises: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Partenariats universités"
                  value={filiereForm.partenariatsUniversites}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, partenariatsUniversites: e.target.value }))}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 px-4 py-2 text-sm font-semibold bg-teal-900 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Envoi…' : 'Envoyer la demande à la DGES'}
                </button>
              </form>

              {demandesFiliere.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800">Mes demandes</h4>
                  <ul className="divide-y divide-gray-100">
                    {demandesFiliere.map((d) => {
                      const st = STATUT_DEMANDE[d.statut] || { label: d.statut, className: 'bg-slate-100 text-slate-700' };
                      return (
                        <li key={d.id} className="py-3 flex justify-between items-start gap-3 text-sm">
                          <div>
                            <span className="font-medium">{d.nom}</span>
                            {d.code && <span className="text-gray-500 ml-2">({d.code})</span>}
                            <p className="text-xs text-gray-400">{LABEL_NIVEAU[d.niveau] || d.niveau} · {d.dureeAnnees} an(s)</p>
                            {d.motifDecision && (
                              <p className="text-xs text-red-600 mt-1">Motif : {d.motifDecision}</p>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${st.className}`}>
                            {st.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800">Filières validées</h4>
                {filieres.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune filière validée pour le moment.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filieres.map((f) => (
                      <li key={f.id} className="py-3 text-sm">
                        <span className="font-medium">{f.nom}</span>
                        <span className="text-gray-500 ml-2">({f.code})</span>
                        <p className="text-xs text-gray-400">{LABEL_NIVEAU[f.niveau] || f.niveau} · {f.dureeAnnees} an(s)</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </BentoCard>
            </div>

            <BentoCard className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Pièces requises (candidatures)</h3>
              <form onSubmit={handleSaveRequirement} className="grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="code_piece"
                  value={requirementForm.code}
                  onChange={(e) => setRequirementForm((p) => ({ ...p, code: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                />
                <input
                  placeholder="Libellé"
                  value={requirementForm.label}
                  onChange={(e) => setRequirementForm((p) => ({ ...p, label: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                />
                <select
                  value={requirementForm.requirementType}
                  onChange={(e) => setRequirementForm((p) => ({ ...p, requirementType: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="DOCUMENT_UPLOAD">Document à téléverser</option>
                  <option value="PROFILE_FIELD">Champ du profil</option>
                </select>
                <input
                  placeholder="Clé profil (si champ profil)"
                  value={requirementForm.profileFieldKey}
                  onChange={(e) => setRequirementForm((p) => ({ ...p, profileFieldKey: e.target.value }))}
                  disabled={requirementForm.requirementType !== 'PROFILE_FIELD'}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                />
                <label className="flex items-center gap-2 text-sm col-span-2">
                  <input
                    type="checkbox"
                    checked={requirementForm.isRequired}
                    onChange={(e) => setRequirementForm((p) => ({ ...p, isRequired: e.target.checked }))}
                  />
                  Obligatoire
                </label>
                <button type="submit" className="col-span-2 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg">
                  Enregistrer l&apos;exigence
                </button>
              </form>
              {requirements.length > 0 && (
                <ul className="divide-y divide-gray-100 text-sm">
                  {requirements.map((r) => (
                    <li key={r.id} className="py-2 flex justify-between items-center">
                      <span>{r.label} <span className="text-gray-400">({r.code})</span></span>
                      <button type="button" onClick={() => handleDeleteRequirement(r.id)} className="text-xs text-red-600 font-semibold">
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>
          </>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
