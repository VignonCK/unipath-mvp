import { useEffect, useRef, useState } from 'react';
import {
  applicationService,
  etablissementService,
  filiereService,
  filiereAdminService,
  resolvePublicAssetUrl,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

const EMPTY_FILIERE = {
  nom: '',
  code: '',
  niveau: 'LICENCE',
  dureeAnnees: '3',
  fraisScolariteAnnuels: '',
  fraisInscriptionEffective: '',
  fraisAutres: '',
  debouches: '',
  partenariatsEntreprises: '',
  partenariatsUniversites: '',
  tauxReussite: '',
  dureeStage: '',
  langueEnseignement: '',
};

const buildFilierePayload = (form) => ({
  nom: form.nom.trim(),
  code: form.code.trim() || undefined,
  niveau: form.niveau,
  dureeAnnees: Number(form.dureeAnnees),
  fraisScolariteAnnuels: form.fraisScolariteAnnuels !== '' ? Number(form.fraisScolariteAnnuels) : null,
  fraisInscriptionEffective: form.fraisInscriptionEffective !== '' ? Number(form.fraisInscriptionEffective) : null,
  fraisAutres: form.fraisAutres.trim() || null,
  debouches: form.debouches.trim() || null,
  partenariatsEntreprises: form.partenariatsEntreprises.trim() || null,
  partenariatsUniversites: form.partenariatsUniversites.trim() || null,
  tauxReussite: form.tauxReussite !== '' ? Number(form.tauxReussite) : null,
  dureeStage: form.dureeStage.trim() || null,
  langueEnseignement: form.langueEnseignement.trim() || null,
});

const filiereToForm = (filiere) => ({
  nom: filiere.nom || '',
  code: filiere.code || '',
  niveau: filiere.niveau || 'LICENCE',
  dureeAnnees: filiere.dureeAnnees != null ? String(filiere.dureeAnnees) : '3',
  fraisScolariteAnnuels: filiere.fraisScolariteAnnuels != null ? String(filiere.fraisScolariteAnnuels) : '',
  fraisInscriptionEffective: filiere.fraisInscriptionEffective != null ? String(filiere.fraisInscriptionEffective) : '',
  fraisAutres: filiere.fraisAutres || '',
  debouches: filiere.debouches || '',
  partenariatsEntreprises: filiere.partenariatsEntreprises || '',
  partenariatsUniversites: filiere.partenariatsUniversites || '',
  tauxReussite: filiere.tauxReussite != null ? String(filiere.tauxReussite) : '',
  dureeStage: filiere.dureeStage || '',
  langueEnseignement: filiere.langueEnseignement || '',
});

export default function MonEtablissementAdmin() {
  const user = getUser();
  const [etablissement, setEtablissement] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filiereForm, setFiliereForm] = useState(EMPTY_FILIERE);
  const [editingFiliereId, setEditingFiliereId] = useState(null);
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
  const [deletingId, setDeletingId] = useState(null);
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
    ])
      .then(([profilData, filData, reqData]) => {
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [user?.etablissementId]);

  const handleSaveFiliere = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!filiereForm.nom.trim()) {
      setError('Le nom de la filière est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildFilierePayload(filiereForm);
      if (editingFiliereId) {
        await filiereAdminService.modifier(editingFiliereId, payload);
        setSuccess('Filière mise à jour.');
      } else {
        await filiereAdminService.creer(payload);
        setSuccess('Filière ajoutée.');
      }
      setFiliereForm(EMPTY_FILIERE);
      setEditingFiliereId(null);
      charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'enregistrer la filière');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditFiliere = (filiere) => {
    setEditingFiliereId(filiere.id);
    setFiliereForm(filiereToForm(filiere));
    setError('');
    setSuccess('');
    requestAnimationFrame(() => {
      filiereFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const cancelEditFiliere = () => {
    setEditingFiliereId(null);
    setFiliereForm(EMPTY_FILIERE);
  };

  const handleDeleteFiliere = async (id) => {
    if (!window.confirm('Supprimer cette filière ?')) return;
    setDeletingId(id);
    setError('');
    try {
      await filiereAdminService.supprimer(id);
      setSuccess('Filière supprimée.');
      charger();
    } catch (err) {
      setError(err.message || 'Suppression impossible');
    } finally {
      setDeletingId(null);
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
                  {logoSrc ? (
                    <img src={logoSrc} alt="Logo" className="h-20 w-20 rounded border object-contain bg-white" />
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
            <BentoCard
              className={`p-6 space-y-4 transition-shadow ${
                editingFiliereId ? 'ring-2 ring-teal-600 ring-offset-2' : ''
              }`}
            >
              <h3 className="font-bold text-gray-900">Filières</h3>
              <form onSubmit={handleSaveFiliere} className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${editingFiliereId ? 'text-teal-900' : 'text-gray-700'}`}>
                    {editingFiliereId ? 'Modifier la filière' : 'Nouvelle filière'}
                  </p>
                  {editingFiliereId && (
                    <button type="button" onClick={cancelEditFiliere} className="text-xs text-gray-500 hover:underline">
                      Annuler
                    </button>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nom de la filière *"
                    value={filiereForm.nom}
                    onChange={(e) => setFiliereForm((p) => ({ ...p, nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Code (optionnel)"
                  value={filiereForm.code}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, code: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={Boolean(editingFiliereId)}
                />
                <select
                  value={filiereForm.niveau}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, niveau: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="LICENCE">Licence</option>
                  <option value="MASTER">Master</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="Durée (années)"
                  value={filiereForm.dureeAnnees}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, dureeAnnees: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  required
                />
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
                  type="number"
                  min={0}
                  max={1}
                  step="0.01"
                  placeholder="Taux de réussite (0.85 = 85%)"
                  value={filiereForm.tauxReussite}
                  onChange={(e) => setFiliereForm((p) => ({ ...p, tauxReussite: e.target.value }))}
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
                  {submitting ? 'Enregistrement...' : editingFiliereId ? 'Mettre à jour la filière' : 'Ajouter la filière'}
                </button>
              </form>
              {filieres.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune filière.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filieres.map((f) => (
                    <li
                      key={f.id}
                      className={`py-3 flex justify-between items-start gap-3 text-sm rounded-lg px-2 -mx-2 ${
                        editingFiliereId === f.id ? 'bg-teal-50 border border-teal-200' : ''
                      }`}
                    >
                      <div>
                        <span className="font-medium">{f.nom}</span>
                        <span className="text-gray-500 ml-2">({f.code})</span>
                        <p className="text-xs text-gray-400">{f.niveau} · {f.dureeAnnees} an(s)</p>
                        {f.fraisScolariteAnnuels != null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Scolarité : {f.fraisScolariteAnnuels.toLocaleString('fr-FR')} FCFA/an
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditFiliere(f)}
                          className="text-xs text-teal-900 font-semibold hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === f.id}
                          onClick={() => handleDeleteFiliere(f.id)}
                          className="text-xs text-red-600 font-semibold disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
