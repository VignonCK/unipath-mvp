import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campagneAdminService, filiereService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';

const SERIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const EMPTY_FILIERE = () => ({
  filiereId: '',
  fraisDossier: '',
  placesDisponibles: '',
  criteresSelection: '',
  seriesAcceptees: [],
});

export default function CampagneForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const user = getUser();

  const [filieresDispo, setFilieresDispo] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titre: '',
    anneeAcademique: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    dateOuverture: '',
    dateCloture: '',
    description: '',
    filieres: [EMPTY_FILIERE()],
  });

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieresDispo(data.filieres || []);
    });
  }, [user?.etablissementId]);

  useEffect(() => {
    if (!isEdit) return;
    campagneAdminService
      .getById(id)
      .then((data) => {
        const c = data.campagne;
        setForm({
          titre: c.titre || '',
          anneeAcademique: c.anneeAcademique || '',
          dateOuverture: c.dateOuverture ? c.dateOuverture.slice(0, 10) : '',
          dateCloture: c.dateCloture ? c.dateCloture.slice(0, 10) : '',
          description: c.description || '',
          filieres: (c.filieres || []).map((cf) => ({
            filiereId: cf.filiereId,
            fraisDossier: String(cf.fraisDossier ?? ''),
            placesDisponibles: cf.placesDisponibles != null ? String(cf.placesDisponibles) : '',
            criteresSelection: cf.criteresSelection || '',
            seriesAcceptees: cf.seriesAcceptees || [],
          })),
        });
        if (!c.filieres?.length) setForm((p) => ({ ...p, filieres: [EMPTY_FILIERE()] }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateFiliere = (index, field, value) => {
    setForm((prev) => {
      const filieres = [...prev.filieres];
      filieres[index] = { ...filieres[index], [field]: value };
      return { ...prev, filieres };
    });
  };

  const toggleSerie = (index, serie) => {
    setForm((prev) => {
      const filieres = [...prev.filieres];
      const current = filieres[index].seriesAcceptees || [];
      filieres[index] = {
        ...filieres[index],
        seriesAcceptees: current.includes(serie) ? current.filter((s) => s !== serie) : [...current, serie],
      };
      return { ...prev, filieres };
    });
  };

  const buildPayload = () => ({
    titre: form.titre.trim(),
    anneeAcademique: form.anneeAcademique.trim(),
    dateOuverture: form.dateOuverture,
    dateCloture: form.dateCloture,
    description: form.description.trim() || null,
    filieres: form.filieres
      .filter((f) => f.filiereId)
      .map((f) => ({
        filiereId: f.filiereId,
        fraisDossier: Number(f.fraisDossier),
        placesDisponibles: f.placesDisponibles !== '' ? Number(f.placesDisponibles) : null,
        criteresSelection: f.criteresSelection?.trim() || null,
        seriesAcceptees: f.seriesAcceptees,
      })),
  });

  const handleSave = async (publierApres = false) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = buildPayload();
      let campagneId = id;
      if (isEdit) {
        await campagneAdminService.modifier(id, payload);
      } else {
        const created = await campagneAdminService.creer(payload);
        campagneId = created.campagne?.id;
      }
      if (publierApres && campagneId) {
        await campagneAdminService.publier(campagneId);
      }
      navigate('/admin-etablissement/campagnes');
    } catch (err) {
      setError(err.message || 'Erreur enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminEtablissementLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </AdminEtablissementLayout>
    );
  }

  return (
    <AdminEtablissementLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <button type="button" onClick={() => navigate('/admin-etablissement/campagnes')} className="text-sm text-teal-900 hover:underline mb-2">← Retour</button>
          <h1 className="text-2xl font-black text-gray-900">{isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}</h1>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <BentoCard className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
            <input required value={form.titre} onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Année académique</label>
              <input required value={form.anneeAcademique} onChange={(e) => setForm((p) => ({ ...p, anneeAcademique: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="2025-2026" />
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date d&apos;ouverture</label>
              <input required type="date" value={form.dateOuverture} onChange={(e) => setForm((p) => ({ ...p, dateOuverture: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de clôture</label>
              <input required type="date" value={form.dateCloture} onChange={(e) => setForm((p) => ({ ...p, dateCloture: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </BentoCard>

        <BentoCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Filières recrutées</h2>
            <button type="button" onClick={() => setForm((p) => ({ ...p, filieres: [...p.filieres, EMPTY_FILIERE()] }))} className="text-sm font-semibold text-teal-900 hover:underline">+ Ajouter une filière</button>
          </div>

          {form.filieres.map((f, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Filière {index + 1}</span>
                {form.filieres.length > 1 && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, filieres: p.filieres.filter((_, i) => i !== index) }))} className="text-xs text-red-600 hover:underline">Supprimer</button>
                )}
              </div>
              <select required value={f.filiereId} onChange={(e) => updateFiliere(index, 'filiereId', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Choisir une filière</option>
                {filieresDispo.map((fd) => (
                  <option key={fd.id} value={fd.id}>{fd.nom} ({fd.niveau})</option>
                ))}
              </select>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Frais dossier (FCFA)</label>
                  <input required type="number" min="0" value={f.fraisDossier} onChange={(e) => updateFiliere(index, 'fraisDossier', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Places disponibles</label>
                  <input type="number" min="0" value={f.placesDisponibles} onChange={(e) => updateFiliere(index, 'placesDisponibles', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Séries BAC acceptées</label>
                <div className="flex flex-wrap gap-2">
                  {SERIES.map((s) => (
                    <label key={s} className="inline-flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={f.seriesAcceptees.includes(s)} onChange={() => toggleSerie(index, s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Critères de sélection</label>
                <textarea rows={2} value={f.criteresSelection} onChange={(e) => updateFiliere(index, 'criteresSelection', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
          ))}
        </BentoCard>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={submitting} onClick={() => handleSave(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
            {submitting ? 'Enregistrement…' : 'Enregistrer en brouillon'}
          </button>
          <button type="button" disabled={submitting} onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-lg bg-teal-900 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60">
            {submitting ? 'Enregistrement…' : 'Enregistrer et publier'}
          </button>
        </div>
      </div>
    </AdminEtablissementLayout>
  );
}
