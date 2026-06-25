import { useEffect, useState } from 'react';
import {
  applicationService,
  etablissementService,
  filiereService,
  filiereAdminService,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

const EMPTY_FILIERE = { nom: '', code: '', niveau: 'LICENCE', dureeAnnees: '3' };
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

export default function MonEtablissementAdmin() {
  const user = getUser();
  const [etablissement, setEtablissement] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filiereForm, setFiliereForm] = useState(EMPTY_FILIERE);
  const [profilForm, setProfilForm] = useState({ ville: '', adresse: '', email: '' });
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
        });
        setFilieres(filData.filieres || []);
        setRequirements(reqData.requirements || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, [user?.etablissementId]);

  const handleCreateFiliere = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!filiereForm.nom.trim()) {
      setError('Le nom de la filière est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      await filiereAdminService.creer({
        nom: filiereForm.nom.trim(),
        code: filiereForm.code.trim() || undefined,
        niveau: filiereForm.niveau,
        dureeAnnees: Number(filiereForm.dureeAnnees),
      });
      setFiliereForm(EMPTY_FILIERE);
      setSuccess('Filière ajoutée.');
      charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'ajouter la filière');
    } finally {
      setSubmitting(false);
    }
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

  const logoSrc = etablissement?.logoUrl ? `${API_ORIGIN}${etablissement.logoUrl}` : null;

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

            <BentoCard className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Filières</h3>
              <form onSubmit={handleCreateFiliere} className="grid gap-3 sm:grid-cols-2">
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold bg-teal-900 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </form>
              {filieres.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune filière.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filieres.map((f) => (
                    <li key={f.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{f.nom}</span>
                        <span className="text-gray-500 ml-2">({f.code})</span>
                        <p className="text-xs text-gray-400">{f.niveau} · {f.dureeAnnees} an(s)</p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === f.id}
                        onClick={() => handleDeleteFiliere(f.id)}
                        className="text-xs text-red-600 font-semibold disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>

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
