import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campagneAdminService, filiereService, dgesService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { PiecesConfiguration } from '../../components/PiecesConfiguration';
import {
  getDefaultPiecesCampagne,
  validatePiecesConfiguration,
  convertLegacyId,
  DOSSIER_PERSONNEL_FIELDS,
} from '../../constants/pieces';

const SERIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const LIST_PATH = '/admin-etablissement/campagnes';

const EMPTY_FILIERE = () => ({
  filiereId: '',
  fraisDossier: '',
  criteresSelection: '',
  seriesAcceptees: [],
});

const extractPieces = (campagne) => {
  if (!campagne?.piecesRequises) return [];
  const pr = campagne.piecesRequises;
  if (Array.isArray(pr)) return pr;
  if (Array.isArray(pr.pieces)) return pr.pieces;
  return [];
};

const getDossierFieldLabel = (key) =>
  DOSSIER_PERSONNEL_FIELDS.find((f) => f.key === key)?.label || key;

/** A1 depuis « A1-A2 » (ex. 2025-2026 → 2025). */
const anneeA1FromLibelle = (libelle) => {
  const match = String(libelle || '').trim().match(/^(\d{4})-\d{4}$/);
  return match ? Number(match[1]) : null;
};

export default function CampagneForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const user = getUser();

  const [filieresDispo, setFilieresDispo] = useState([]);
  const [anneeLibelle, setAnneeLibelle] = useState('');
  const [anneeA1, setAnneeA1] = useState(null);
  const [statut, setStatut] = useState('BROUILLON');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState(null); // 'draft' | 'publish'
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titre: '',
    dateOuverture: '',
    dateCloture: '',
    description: '',
    filieres: [EMPTY_FILIERE()],
    piecesRequises: getDefaultPiecesCampagne(),
  });

  const canPublish = !isEdit || statut === 'BROUILLON';

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieresDispo(data.filieres || []);
    }).catch(() => {});
  }, [user?.etablissementId]);

  useEffect(() => {
    let cancelled = false;

    const resolveAnneeEnCours = async () => {
      try {
        const enCoursData = await dgesService.getAnneeEnCours();
        const fromEnCours = enCoursData?.annee?.libelle || '';
        if (fromEnCours) return fromEnCours;
      } catch {
        // fallback liste
      }
      try {
        const anneesData = await dgesService.listerAnneesAcademiques();
        return (
          anneesData.anneeEnCours?.libelle
          || (anneesData.annees || []).find((a) => a.enCours || a.enCoursDges)?.libelle
          || ''
        );
      } catch {
        return '';
      }
    };

    const charger = async () => {
      setLoading(true);
      setError('');
      try {
        const enCoursLibelle = await resolveAnneeEnCours();
        if (cancelled) return;

        if (isEdit) {
          const data = await campagneAdminService.getById(id);
          if (cancelled) return;
          const c = data.campagne;
          const libelle = c.anneeAcademique || enCoursLibelle;
          setStatut(c.statut || 'BROUILLON');
          setAnneeLibelle(libelle);
          setAnneeA1(anneeA1FromLibelle(libelle));
          setForm({
            titre: c.titre || '',
            dateOuverture: c.dateOuverture ? String(c.dateOuverture).slice(0, 10) : '',
            dateCloture: c.dateCloture ? String(c.dateCloture).slice(0, 10) : '',
            description: c.description || '',
            filieres: (c.filieres || []).length
              ? (c.filieres || []).map((cf) => ({
                filiereId: cf.filiereId,
                fraisDossier: String(cf.fraisDossier ?? ''),
                criteresSelection: cf.criteresSelection || '',
                seriesAcceptees: Array.isArray(cf.seriesAcceptees) ? cf.seriesAcceptees : [],
              }))
              : [EMPTY_FILIERE()],
            piecesRequises: (() => {
              const pieces = extractPieces(c).map((p) => ({
                ...p,
                id: convertLegacyId(p.id) || p.id,
                formats: [...(p.formats || [])],
              }));
              return pieces.length > 0 ? pieces : getDefaultPiecesCampagne();
            })(),
          });
        } else {
          setStatut('BROUILLON');
          setAnneeLibelle(enCoursLibelle);
          setAnneeA1(anneeA1FromLibelle(enCoursLibelle));
          setForm((prev) => ({ ...prev, piecesRequises: getDefaultPiecesCampagne() }));
          if (!enCoursLibelle) {
            setError('Aucune année académique en cours définie par la DGES. Impossible de créer une campagne pour le moment.');
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    charger();
    return () => { cancelled = true; };
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

  const filieresValides = () => form.filieres.filter((f) => f.filiereId && f.fraisDossier !== '');

  const buildPayload = () => ({
    titre: form.titre.trim(),
    dateOuverture: form.dateOuverture,
    dateCloture: form.dateCloture,
    description: form.description.trim() || null,
    piecesRequises: {
      pieces: form.piecesRequises.map((piece) => ({
        id: piece.id,
        nom: piece.nom,
        formats: piece.formats || [],
        obligatoire: piece.obligatoire !== false,
        predefined: Boolean(piece.predefined),
        sourceDossier: piece.sourceDossier || null,
        description: piece.description || null,
      })),
    },
    filieres: filieresValides().map((f) => ({
      filiereId: f.filiereId,
      fraisDossier: Number(f.fraisDossier),
      criteresSelection: f.criteresSelection?.trim() || null,
      seriesAcceptees: f.seriesAcceptees || [],
    })),
  });

  const updatePiece = (index, field, value) => {
    setForm((prev) => {
      const piecesRequises = [...prev.piecesRequises];
      piecesRequises[index] = { ...piecesRequises[index], [field]: value };
      return { ...prev, piecesRequises };
    });
  };

  const validerFormulaire = (publierApres) => {
    if (!form.titre.trim()) return 'Le titre est obligatoire.';
    if (!form.dateOuverture || !form.dateCloture) {
      return 'Les dates d\'ouverture et de clôture sont obligatoires.';
    }
    if (form.dateCloture <= form.dateOuverture) {
      return 'La date de clôture doit être postérieure à la date d\'ouverture.';
    }
    if (anneeA1) {
      const yOuv = Number(String(form.dateOuverture).slice(0, 4));
      const yClo = Number(String(form.dateCloture).slice(0, 4));
      if (yOuv !== anneeA1 || yClo !== anneeA1) {
        return `Les dates d'ouverture et de clôture doivent être en ${anneeA1} (A1 de ${anneeLibelle}).`;
      }
    } else if (!isEdit) {
      return 'Aucune année académique en cours définie par la DGES.';
    }

    const filieres = filieresValides();
    if (publierApres && filieres.length === 0) {
      return 'Ajoutez au moins une filière (avec frais de dossier) avant de publier.';
    }
    for (const f of filieres) {
      if (!Number.isFinite(Number(f.fraisDossier)) || Number(f.fraisDossier) < 0) {
        return 'Les frais de dossier doivent être un nombre ≥ 0.';
      }
    }
    const ids = filieres.map((f) => f.filiereId);
    if (new Set(ids).size !== ids.length) {
      return 'Une même filière ne peut pas apparaître plusieurs fois dans la campagne.';
    }
    if (!form.piecesRequises || form.piecesRequises.length === 0) {
      return 'Sélectionnez au moins une pièce requise pour le dossier.';
    }
    const { valid, errors: pieceErrors } = validatePiecesConfiguration(form.piecesRequises, {
      requireQuittance: false,
    });
    if (!valid) {
      return pieceErrors.join(' ') || 'Configuration des pièces invalide.';
    }
    return '';
  };

  const handleSave = async (publierApres = false) => {
    const validation = validerFormulaire(publierApres);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setSubmitMode(publierApres ? 'publish' : 'draft');
    setError('');
    try {
      const payload = buildPayload();
      let campagneId = id;

      if (isEdit) {
        await campagneAdminService.modifier(id, payload);
      } else {
        const created = await campagneAdminService.creer(payload);
        campagneId = created.campagne?.id;
        if (!campagneId) {
          throw new Error('La campagne a été créée mais son identifiant est manquant.');
        }
      }

      if (publierApres && canPublish && campagneId) {
        await campagneAdminService.publier(campagneId);
      }

      navigate(LIST_PATH);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
      setSubmitMode(null);
    }
  };

  const dateMin = anneeA1 ? `${anneeA1}-01-01` : undefined;
  const dateMax = anneeA1 ? `${anneeA1}-12-31` : undefined;

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
          <button type="button" onClick={() => navigate(LIST_PATH)} className="text-sm text-teal-900 hover:underline mb-2">
            ← Retour
          </button>
          <h1 className="text-2xl font-black text-gray-900">
            {isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Année académique : {anneeLibelle || '—'}
            {anneeA1 ? ` (dates en ${anneeA1})` : ''}.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input
              value={form.titre}
              onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date d&apos;ouverture *</label>
              <input
                type="date"
                min={dateMin}
                max={dateMax}
                value={form.dateOuverture}
                onChange={(e) => setForm((p) => ({ ...p, dateOuverture: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de clôture *</label>
              <input
                type="date"
                min={dateMin}
                max={dateMax}
                value={form.dateCloture}
                onChange={(e) => setForm((p) => ({ ...p, dateCloture: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {anneeA1 && (
            <p className="text-[11px] text-gray-400">
              Les deux dates doivent être situées en {anneeA1} (A1 de l&apos;année académique {anneeLibelle}).
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </BentoCard>

        <BentoCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Filières recrutées</h2>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, filieres: [...p.filieres, EMPTY_FILIERE()] }))}
              className="text-sm font-semibold text-teal-900 hover:underline"
            >
              + Ajouter une filière
            </button>
          </div>

          {filieresDispo.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Aucune filière validée pour votre établissement. Demandez d&apos;abord l&apos;ajout d&apos;une filière à la DGES.
            </p>
          )}

          {form.filieres.map((f, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Filière {index + 1}</span>
                {form.filieres.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, filieres: p.filieres.filter((_, i) => i !== index) }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <select
                value={f.filiereId}
                onChange={(e) => updateFiliere(index, 'filiereId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Choisir une filière</option>
                {filieresDispo.map((fd) => (
                  <option key={fd.id} value={fd.id}>{fd.nom} ({fd.niveau})</option>
                ))}
              </select>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frais dossier (FCFA) *</label>
                <input
                  type="number"
                  min="0"
                  value={f.fraisDossier}
                  onChange={(e) => updateFiliere(index, 'fraisDossier', e.target.value)}
                  className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Séries BAC acceptées</label>
                <div className="flex flex-wrap gap-2">
                  {SERIES.map((s) => (
                    <label key={s} className="inline-flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={(f.seriesAcceptees || []).includes(s)}
                        onChange={() => toggleSerie(index, s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Critères de sélection</label>
                <textarea
                  rows={2}
                  value={f.criteresSelection}
                  onChange={(e) => updateFiliere(index, 'criteresSelection', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ))}
        </BentoCard>

        <BentoCard className="p-6 space-y-4">
          <div>
            <h2 className="font-bold text-gray-900">Pièces requises pour le dossier *</h2>
            <p className="text-xs text-gray-500 mt-1">
              Comme pour un concours : choisissez les documents que le candidat doit fournir.
              La quittance des frais de dossier est demandée séparément lors du dépôt.
              {' '}
              <span className="font-medium text-gray-700">
                Note : pour toute inscription en niveau supérieur à la 1ʳᵉ année, le relevé de notes
                ou les bulletins de l&apos;année antérieure sont toujours exigés automatiquement.
              </span>
            </p>
          </div>
          <PiecesConfiguration
            piecesRequises={form.piecesRequises}
            excludeQuittance
            onChange={(pieces) => setForm((prev) => ({ ...prev, piecesRequises: pieces }))}
          />
          {form.piecesRequises.length > 0 && (
            <div className="mt-2 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Options par pièce
              </p>
              {form.piecesRequises.map((piece, index) => (
                <div
                  key={`${piece.id}-${index}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                >
                  <p className="text-sm font-medium text-gray-800">{piece.nom}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={piece.obligatoire !== false}
                      disabled={piece.predefined === true}
                      onChange={(e) => updatePiece(index, 'obligatoire', e.target.checked)}
                      className="w-4 h-4 text-teal-700 border-gray-300 rounded focus:ring-teal-600 disabled:opacity-60"
                    />
                    <span className={`text-sm ${piece.predefined ? 'text-gray-500' : 'text-gray-700'}`}>
                      Pièce obligatoire
                    </span>
                  </label>
                  {piece.predefined && piece.sourceDossier ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-teal-800 bg-teal-50 px-2 py-1 rounded-full">
                        Auto-rempli depuis le dossier personnel
                      </span>
                      <span className="text-xs text-gray-500">
                        ({getDossierFieldLabel(piece.sourceDossier)})
                      </span>
                    </div>
                  ) : !piece.predefined ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Correspond à (dossier personnel)
                      </label>
                      <select
                        value={piece.sourceDossier || ''}
                        onChange={(e) => updatePiece(index, 'sourceDossier', e.target.value || null)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">— Aucune correspondance (upload requis) —</option>
                        {DOSSIER_PERSONNEL_FIELDS.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            {submitting && submitMode === 'draft'
              ? 'Enregistrement…'
              : isEdit && statut === 'PUBLIEE'
                ? 'Enregistrer'
                : 'Enregistrer en brouillon'}
          </button>

          {canPublish && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 rounded-lg bg-teal-900 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting && submitMode === 'publish' ? 'Publication…' : 'Enregistrer et publier'}
            </button>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={() => navigate(LIST_PATH)}
            className="px-5 py-2.5 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      </div>
    </AdminEtablissementLayout>
  );
}
