// src/pages/GestionConcours.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { concoursService, etablissementService, dgesService } from '../services/api';
import { PiecesConfiguration } from '../components/PiecesConfiguration';
import GestionCentresConcours from '../components/concours/GestionCentresConcours';
import DGESLayout from '../components/DGESLayout';
import { getDefaultPiecesRequises, validatePiecesConfiguration, convertLegacyId, DOSSIER_PERSONNEL_FIELDS } from '../constants/pieces';

function extractPiecesRequises(concours) {
  if (!concours?.piecesRequises) return [];
  const pr = concours.piecesRequises;
  if (Array.isArray(pr)) return pr;
  if (Array.isArray(pr.pieces)) return pr.pieces;
  return [];
}

function getCriteresEligibiliteFromConcours(concours) {
  const rootCriteres = concours?.criteresEligibilite;
  const nestedCriteres = concours?.piecesRequises?.criteresEligibilite;
  const source = rootCriteres || nestedCriteres;
  if (!source) return [];
  const raw = Array.isArray(source) ? source : (Array.isArray(source?.criteres) ? source.criteres : []);
  return raw
    .map((item) => {
      if (typeof item === 'string') return { titre: item, description: '' };
      return { titre: item?.titre || '', description: item?.description || '' };
    })
    .filter((item) => item.titre.trim() !== '');
}

function formatDateInput(value) {
  return value ? value.split('T')[0] : '';
}

function getConcoursEtablissementLabel(concours) {
  return concours?.etablissementOrganisateur?.nom || concours?.etablissement || '-';
}

function getConcoursEtablissementKey(concours) {
  if (concours?.etablissementId) return concours.etablissementId;
  return `libre:${(concours?.etablissement || '').trim().toLowerCase()}`;
}

export default function GestionConcours() {
  const [concours, setConcours] = useState([]);
  const [publicEtablissements, setPublicEtablissements] = useState([]);
  const [filterEtablissement, setFilterEtablissement] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConcours, setEditingConcours] = useState(null);
  const [formData, setFormData] = useState({
    libelle: '',
    etablissementId: '',
    etablissement: '',
    useEtablissementLibre: false,
    description: '',
    fraisParticipation: '',
    seriesAcceptees: [],
    matieres: [],
    piecesRequises: [],
    criteresEligibilite: [],
    dateDebutDepot: '',
    dateFinDepot: '',
    dateDebutComposition: '',
    dateFinComposition: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [newMatiere, setNewMatiere] = useState('');
  const [etudeBusyId, setEtudeBusyId] = useState(null);

  useEffect(() => {
    loadConcours();
    etablissementService
      .getPublics()
      .then((data) => setPublicEtablissements(data.etablissements || []))
      .catch(() => setPublicEtablissements([]));
  }, []);

  const loadConcours = async () => {
    try {
      setLoading(true);
      const data = await concoursService.getAll();
      setConcours(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingConcours(null);
    setFormData({
      libelle: '',
      etablissementId: '',
      etablissement: '',
      useEtablissementLibre: false,
      description: '',
      fraisParticipation: '',
      seriesAcceptees: [],
      matieres: [],
      piecesRequises: getDefaultPiecesRequises(),
      criteresEligibilite: [],
      dateDebutDepot: '',
      dateFinDepot: '',
      dateDebutComposition: '',
      dateFinComposition: '',
    });
    setValidationErrors({});
    setNewMatiere('');
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingConcours(c);

    const piecesRequises = extractPiecesRequises(c);
    const criteresEligibilite = getCriteresEligibiliteFromConcours(c);

    const linkedEtab = c.etablissementOrganisateur;
    const useEtablissementLibre = !c.etablissementId;

    setFormData({
      libelle: c.libelle,
      etablissementId: c.etablissementId || '',
      etablissement: linkedEtab?.nom || c.etablissement || '',
      useEtablissementLibre,
      description: c.description || '',
      fraisParticipation: c.fraisParticipation || '',
      seriesAcceptees: c.seriesAcceptees || [],
      matieres: Array.isArray(c.matieres) ? c.matieres : [],
      piecesRequises: piecesRequises.length > 0 ? piecesRequises : getDefaultPiecesRequises(),
      criteresEligibilite,
      dateDebutDepot: formatDateInput(c.dateDebutDepot || c.dateDebut),
      dateFinDepot: formatDateInput(c.dateFinDepot || c.dateFin),
      dateDebutComposition: formatDateInput(c.dateDebutComposition || c.dateComposition),
      dateFinComposition: formatDateInput(c.dateFinComposition),
    });
    setValidationErrors({});
    setNewMatiere('');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    // Champs obligatoires
    if (!formData.libelle || formData.libelle.trim() === '') {
      errors.libelle = 'Le libellé est obligatoire';
    }
    if (formData.useEtablissementLibre) {
      if (!formData.etablissement || formData.etablissement.trim() === '') {
        errors.etablissement = "L'établissement est obligatoire";
      }
    } else if (!formData.etablissementId) {
      errors.etablissement = 'Sélectionnez un établissement public ou utilisez le texte libre';
    }
    if (!formData.dateDebutDepot) {
      errors.dateDebutDepot = 'La date de début de dépôt est obligatoire';
    }
    if (!formData.dateFinDepot) {
      errors.dateFinDepot = 'La date de fin de dépôt est obligatoire';
    }
    if (!formData.dateDebutComposition) {
      errors.dateDebutComposition = 'La date de début de composition est obligatoire';
    }
    if (!formData.dateFinComposition) {
      errors.dateFinComposition = 'La date de fin de composition est obligatoire';
    }
    if (!formData.fraisParticipation) {
      errors.fraisParticipation = 'Les frais de participation sont obligatoires';
    }
    if (!formData.seriesAcceptees || formData.seriesAcceptees.length === 0) {
      errors.seriesAcceptees = 'Au moins une série doit être sélectionnée';
    }

    const matieresNettoyees = (formData.matieres || [])
      .map((m) => (typeof m === 'string' ? m : '').trim())
      .filter(Boolean);
    if (matieresNettoyees.length === 0) {
      errors.matieres = 'Au moins une matière à composer est requise';
    }

    // Validation des dates de dépôt
    if (formData.dateDebutDepot && formData.dateFinDepot) {
      const debut = new Date(formData.dateDebutDepot);
      const fin = new Date(formData.dateFinDepot);
      if (fin <= debut) {
        errors.dateFinDepot = 'La date de fin de dépôt doit être postérieure à la date de début';
      }
    }

    // Validation des dates de composition
    if (formData.dateDebutComposition && formData.dateFinComposition) {
      const debut = new Date(formData.dateDebutComposition);
      const fin = new Date(formData.dateFinComposition);
      if (fin <= debut) {
        errors.dateFinComposition = 'La date de fin de composition doit être postérieure à la date de début';
      }
    }

    // Validation cohérence dépôt/composition
    if (formData.dateFinDepot && formData.dateDebutComposition) {
      const finDepot = new Date(formData.dateFinDepot);
      const debutCompo = new Date(formData.dateDebutComposition);
      if (debutCompo <= finDepot) {
        errors.dateDebutComposition = 'La date de début de composition doit être postérieure à la date de fin de dépôt';
      }
    }

    // Validation des pièces
    if (!formData.piecesRequises || formData.piecesRequises.length === 0) {
      errors.piecesRequises = 'Au moins une pièce doit être sélectionnée';
    } else {
      // ✅ Utiliser validatePiecesConfiguration pour validation complète
      const { valid, errors: pieceErrors } = validatePiecesConfiguration(formData.piecesRequises);
      if (!valid) {
        errors.piecesRequises = pieceErrors.join(', ');
      }
    }

    if (Array.isArray(formData.criteresEligibilite)) {
      const emptyCritere = formData.criteresEligibilite.find(
        (critere) => !critere?.titre || critere.titre.trim() === ''
      );
      if (emptyCritere) {
        errors.criteresEligibilite = 'Chaque critère d éligibilité doit avoir un titre';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    
    // Validation côté client
    if (!validateForm()) {
      document.getElementById('concours-modal-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const selectedEtab = publicEtablissements.find((e) => e.id === formData.etablissementId);
    const payload = {
      libelle: formData.libelle,
      etablissement: formData.useEtablissementLibre
        ? formData.etablissement.trim()
        : (selectedEtab?.nom || formData.etablissement.trim()),
      description: formData.description,
      fraisParticipation: formData.fraisParticipation,
      seriesAcceptees: formData.seriesAcceptees,
      matieres: (formData.matieres || [])
        .map((m) => (typeof m === 'string' ? m : '').trim())
        .filter(Boolean),
      piecesRequises: formData.piecesRequises.map((piece) => ({
        ...piece,
        id: convertLegacyId(piece.id),
        formats: (piece.formats || []).map((f) => (f === 'JPG' ? 'JPEG' : f)),
        sourceDossier: piece.sourceDossier || null,
      })),
      criteresEligibilite: formData.criteresEligibilite,
      dateDebutDepot: formData.dateDebutDepot,
      dateFinDepot: formData.dateFinDepot,
      dateDebutComposition: formData.dateDebutComposition,
      dateFinComposition: formData.dateFinComposition,
    };

    if (formData.useEtablissementLibre) {
      payload.etablissementId = null;
    } else if (formData.etablissementId) {
      payload.etablissementId = formData.etablissementId;
    }

    setSubmitting(true);

    try {
      if (editingConcours) {
        const response = await concoursService.update(editingConcours.id, payload);
        // Afficher un avertissement si présent
        if (response.warning) {
          alert(response.warning);
        }
      } else {
        await concoursService.create(payload);
      }
      setShowModal(false);
      loadConcours();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addCritereEligibilite = () => {
    setFormData((prev) => ({
      ...prev,
      criteresEligibilite: [...(prev.criteresEligibilite || []), { titre: '', description: '' }],
    }));
  };

  const updateCritereEligibilite = (index, key, value) => {
    setFormData((prev) => {
      const next = [...(prev.criteresEligibilite || [])];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return { ...prev, criteresEligibilite: next };
    });
  };

  const removeCritereEligibilite = (index) => {
    setFormData((prev) => ({
      ...prev,
      criteresEligibilite: (prev.criteresEligibilite || []).filter((_, i) => i !== index),
    }));
  };

  const addMatiere = () => {
    const libelle = newMatiere.trim();
    if (!libelle) return;

    const exists = (formData.matieres || []).some(
      (m) => m.trim().toLowerCase() === libelle.toLowerCase()
    );
    if (exists) {
      setValidationErrors((prev) => ({
        ...prev,
        matieres: 'Cette matière est déjà dans la liste',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      matieres: [...(prev.matieres || []), libelle],
    }));
    setNewMatiere('');
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.matieres;
      return next;
    });
  };

  const updateMatiere = (index, value) => {
    setFormData((prev) => {
      const matieres = [...(prev.matieres || [])];
      matieres[index] = value;
      return { ...prev, matieres };
    });
  };

  const removeMatiere = (index) => {
    setFormData((prev) => ({
      ...prev,
      matieres: (prev.matieres || []).filter((_, i) => i !== index),
    }));
  };

  const updatePiece = (index, field, value) => {
    setFormData((prev) => {
      const piece = prev.piecesRequises[index];
      if (!piece) return prev;
      if (piece.predefined && (field === 'obligatoire' || field === 'sourceDossier')) {
        return prev;
      }
      const piecesRequises = [...prev.piecesRequises];
      piecesRequises[index] = { ...piecesRequises[index], [field]: value };
      return { ...prev, piecesRequises };
    });
  };

  const getDossierFieldLabel = (key) =>
    DOSSIER_PERSONNEL_FIELDS.find((field) => field.key === key)?.label ?? key;

  const handleDelete = async (id, libelle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le concours "${libelle}" ?`)) return;

    try {
      await concoursService.delete(id);
      loadConcours();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleEtude = async (c) => {
    const cloture = Boolean(c.etudeCloturee);
    if (cloture) {
      if (!confirm(`Rouvrir l'étude des dossiers pour « ${c.libelle} » ?\nLes examinateurs et contrôleurs pourront à nouveau modifier les dossiers.`)) {
        return;
      }
    } else if (!confirm(
      `Clôturer l'étude des dossiers pour « ${c.libelle} » ?\nPlus aucune modification (verdicts / décisions) ne sera possible tant que l'étude reste clôturée.`,
    )) {
      return;
    }

    try {
      setEtudeBusyId(c.id);
      setError('');
      const data = cloture
        ? await dgesService.rouvrirEtudeConcours(c.id)
        : await dgesService.cloturerEtudeConcours(c.id);
      const updated = data?.concours;
      setConcours((prev) => prev.map((row) => (
        row.id === c.id
          ? {
            ...row,
            etudeCloturee: updated?.etudeCloturee ?? !cloture,
            etudeClotureeAt: updated?.etudeClotureeAt ?? null,
          }
          : row
      )));
    } catch (err) {
      setError(err.message || 'Action impossible');
    } finally {
      setEtudeBusyId(null);
    }
  };

  const etablissementFilterOptions = Array.from(
    concours.reduce((map, item) => {
      const key = getConcoursEtablissementKey(item);
      if (!map.has(key)) {
        map.set(key, getConcoursEtablissementLabel(item));
      }
      return map;
    }, new Map())
  ).sort((a, b) => a[1].localeCompare(b[1], 'fr'));

  const filteredConcours = filterEtablissement
    ? concours.filter((c) => getConcoursEtablissementKey(c) === filterEtablissement)
    : concours;

  if (loading) return (
    <DGESLayout>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement...</p>
        </div>
      </div>
    </DGESLayout>
  );

  return (
    <DGESLayout>
      <div className='max-w-6xl mx-auto px-4 py-6 space-y-6'>
        {/* HEADER SECTION */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-black text-gray-800'>Gestion des concours</h1>
              <p className='text-sm text-gray-500 mt-1'>{concours.length} concours au total</p>
            </div>
            <button
              type='button'
              onClick={openCreateModal}
              className='flex shrink-0 items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition shadow-sm w-full sm:w-auto'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Nouveau concours
            </button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
            <label className='text-sm font-medium text-gray-600 shrink-0' htmlFor='filter-etablissement'>
              Filtrer par établissement
            </label>
            <select
              id='filter-etablissement'
              value={filterEtablissement}
              onChange={(e) => setFilterEtablissement(e.target.value)}
              className='w-full sm:max-w-md rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white'
            >
              <option value=''>Tous les établissements</option>
              {etablissementFilterOptions.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
            {error}
          </div>
        )}

        {/* LISTE DES CONCOURS */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[640px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Libellé</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Établissement</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Dépôt début</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Dépôt fin</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Composition</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Étude</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Frais</th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {filteredConcours.length === 0 ? (
                  <tr>
                    <td colSpan='8' className='px-4 py-10 text-center text-gray-400'>
                      {concours.length === 0
                        ? 'Aucun concours créé. Cliquez sur "Nouveau concours" pour commencer.'
                        : 'Aucun concours pour cet établissement.'}
                    </td>
                  </tr>
                ) : (
                  filteredConcours.map((c) => (
                    <tr key={c.id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3 font-medium text-gray-800'>{c.libelle}</td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>{getConcoursEtablissementLabel(c)}</td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {new Date(c.dateDebutDepot || c.dateDebut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {new Date(c.dateFinDepot || c.dateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {c.dateDebutComposition && c.dateFinComposition
                          ? `${new Date(c.dateDebutComposition).toLocaleDateString('fr-FR')} → ${new Date(c.dateFinComposition).toLocaleDateString('fr-FR')}`
                          : c.dateComposition
                            ? new Date(c.dateComposition).toLocaleDateString('fr-FR')
                            : '-'}
                      </td>
                      <td className='px-4 py-3'>
                        {c.etudeCloturee ? (
                          <span className='inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700'>
                            Clôturée
                          </span>
                        ) : (
                          <span className='inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700'>
                            Ouverte
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-gray-700 font-semibold'>
                        {c.fraisParticipation ? `${c.fraisParticipation} FCFA` : '-'}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-center gap-2 flex-wrap'>
                          <button
                            type='button'
                            onClick={() => handleToggleEtude(c)}
                            disabled={etudeBusyId === c.id}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                              c.etudeCloturee
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                            }`}
                            title={c.etudeCloturee ? 'Rouvrir l\'étude' : 'Clôturer l\'étude'}
                          >
                            {etudeBusyId === c.id
                              ? '…'
                              : (c.etudeCloturee ? 'Rouvrir l\'étude' : 'Clôturer l\'étude')}
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition'
                            title='Modifier'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.libelle)}
                            className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition'
                            title='Supprimer'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CRÉATION/ÉDITION — portail vers body pour éviter le double sidebar */}
        {showModal && createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div id='concours-modal-scroll' className='relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10'>
              <h2 className='text-lg font-bold text-gray-800'>
                {editingConcours ? 'Modifier le concours' : 'Nouveau concours'}
              </h2>
              <button
                type='button'
                onClick={() => setShowModal(false)}
                className='p-1 hover:bg-gray-100 rounded-lg transition'
                aria-label='Fermer'
              >
                <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='p-6 space-y-4'>
              {/* Erreurs de validation globales */}
              {Object.keys(validationErrors).length > 0 && (
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
                  <p className='font-semibold mb-1'>Veuillez corriger les erreurs suivantes :</p>
                  <ul className='list-disc list-inside space-y-1'>
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Libellé <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.libelle ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder='Ex: Concours ENS 2026'
                />
                {validationErrors.libelle && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.libelle}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Établissement organisateur <span className='text-red-500'>*</span>
                </label>
                {!formData.useEtablissementLibre ? (
                  <select
                    value={formData.etablissementId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = publicEtablissements.find((etab) => etab.id === id);
                      setFormData((prev) => ({
                        ...prev,
                        etablissementId: id,
                        etablissement: selected?.nom || '',
                      }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      validationErrors.etablissement ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value=''>— Sélectionner un établissement public —</option>
                    {publicEtablissements.map((etab) => (
                      <option key={etab.id} value={etab.id}>
                        {etab.nom} — {etab.ville}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type='text'
                    required
                    value={formData.etablissement}
                    onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      validationErrors.etablissement ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Ex: EPAC - Université d'Abomey-Calavi"
                  />
                )}
                <button
                  type='button'
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    useEtablissementLibre: !prev.useEtablissementLibre,
                    etablissementId: '',
                    etablissement: prev.useEtablissementLibre ? '' : prev.etablissement,
                  }))}
                  className='mt-2 text-xs font-semibold text-blue-900 hover:text-orange-500 transition'
                >
                  {formData.useEtablissementLibre
                    ? '← Choisir dans la liste des établissements publics'
                    : 'Aucun établissement ne correspond ? Saisir en texte libre'}
                </button>
                {validationErrors.etablissement && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.etablissement}</p>
                )}
              </div>

              {/* Dates de dépôt */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>Période de dépôt des dossiers</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date début dépôt <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateDebutDepot}
                      onChange={(e) => setFormData({ ...formData, dateDebutDepot: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateDebutDepot ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateDebutDepot && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateDebutDepot}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date fin dépôt <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateFinDepot}
                      onChange={(e) => setFormData({ ...formData, dateFinDepot: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateFinDepot ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateFinDepot && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateFinDepot}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates de composition */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>Période de composition</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date début composition <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateDebutComposition}
                      onChange={(e) => setFormData({ ...formData, dateDebutComposition: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateDebutComposition ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateDebutComposition && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateDebutComposition}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date fin composition <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateFinComposition}
                      onChange={(e) => setFormData({ ...formData, dateFinComposition: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateFinComposition ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateFinComposition && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateFinComposition}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Frais de participation (FCFA) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  min='0'
                  required
                  value={formData.fraisParticipation}
                  onChange={(e) => setFormData({ ...formData, fraisParticipation: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.fraisParticipation ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder='Ex: 5000'
                />
                {validationErrors.fraisParticipation && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.fraisParticipation}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Séries acceptées <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-4 gap-2'>
                  {['A', 'B', 'C', 'D', 'E', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3'].map(serie => (
                    <label key={serie} className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formData.seriesAcceptees.includes(serie)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, seriesAcceptees: [...formData.seriesAcceptees, serie] });
                          } else {
                            setFormData({ ...formData, seriesAcceptees: formData.seriesAcceptees.filter(s => s !== serie) });
                          }
                        }}
                        className='w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500'
                      />
                      <span className='text-sm font-medium text-gray-700'>Série {serie}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.seriesAcceptees && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.seriesAcceptees}</p>
                )}
              </div>

              {/* Matières à composer */}
              <div className='border-t pt-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <div>
                    <h3 className='text-sm font-bold text-gray-800'>
                      Matières à composer <span className='text-red-500'>*</span>
                    </h3>
                    <p className='text-xs text-gray-500 mt-1'>
                      Épreuves du concours — affichées sur la convocation et utilisées pour la saisie des notes.
                    </p>
                  </div>
                </div>

                <div className='flex gap-2 mb-3'>
                  <input
                    type='text'
                    value={newMatiere}
                    onChange={(e) => setNewMatiere(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMatiere();
                      }
                    }}
                    className='flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm'
                    placeholder='Ex: Mathématiques, Physique-Chimie, Français...'
                  />
                  <button
                    type='button'
                    onClick={addMatiere}
                    className='rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 whitespace-nowrap'
                  >
                    + Ajouter
                  </button>
                </div>

                {(formData.matieres || []).length === 0 ? (
                  <p className='text-xs text-gray-500 rounded-xl border border-dashed border-gray-200 px-4 py-3'>
                    Aucune matière configurée. Ajoutez les épreuves que les candidats composeront.
                  </p>
                ) : (
                  <div className='space-y-2'>
                    {(formData.matieres || []).map((matiere, index) => (
                      <div
                        key={`${matiere}-${index}`}
                        className='flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2'
                      >
                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-500 border border-gray-200'>
                          {index + 1}
                        </span>
                        <input
                          type='text'
                          value={matiere}
                          onChange={(e) => updateMatiere(index, e.target.value)}
                          className='flex-1 bg-transparent border-0 text-sm text-gray-800 focus:ring-0 focus:outline-none'
                        />
                        <button
                          type='button'
                          onClick={() => removeMatiere(index)}
                          className='text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1'
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {validationErrors.matieres && (
                  <p className='mt-2 text-xs text-red-600'>{validationErrors.matieres}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  rows='3'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none'
                  placeholder='Description du concours...'
                />
              </div>

              <GestionCentresConcours
                concoursId={editingConcours?.id}
                concoursLibelle={formData.libelle || editingConcours?.libelle}
              />

              {/* Configuration des pièces */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>
                  Pièces requises <span className='text-red-500'>*</span>
                </h3>
                <PiecesConfiguration
                  piecesRequises={formData.piecesRequises}
                  onChange={(pieces) => setFormData((prev) => ({ ...prev, piecesRequises: pieces }))}
                />
                {formData.piecesRequises.length > 0 && (
                  <div className='mt-4 space-y-3'>
                    <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                      Options par pièce
                    </p>
                    {formData.piecesRequises.map((piece, index) => (
                      <div
                        key={`${piece.id}-${index}`}
                        className='rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3'
                      >
                        <p className='text-sm font-medium text-gray-800'>{piece.nom}</p>

                        <label className='flex items-center gap-2 cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={piece.obligatoire !== false}
                            disabled={piece.predefined === true}
                            onChange={(e) => updatePiece(index, 'obligatoire', e.target.checked)}
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed'
                          />
                          <span className={`text-sm ${piece.predefined ? 'text-gray-500' : 'text-gray-700'}`}>
                            Pièce obligatoire
                          </span>
                        </label>

                        {piece.predefined && piece.sourceDossier ? (
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full'>
                              Auto-rempli depuis le dossier personnel
                            </span>
                            <span className='text-xs text-gray-500'>
                              ({getDossierFieldLabel(piece.sourceDossier)})
                            </span>
                          </div>
                        ) : !piece.predefined ? (
                          <div className='flex flex-col gap-1'>
                            <label className='text-sm font-medium text-gray-700'>
                              Correspond à (dossier personnel)
                            </label>
                            <select
                              value={piece.sourceDossier || ''}
                              onChange={(e) => updatePiece(index, 'sourceDossier', e.target.value || null)}
                              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                              <option value=''>— Aucune correspondance (upload requis) —</option>
                              {DOSSIER_PERSONNEL_FIELDS.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                            <p className='text-xs text-gray-400'>
                              Si cette pièce existe dans le dossier personnel du candidat, elle sera auto-remplie.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                {validationErrors.piecesRequises && (
                  <p className='mt-2 text-xs text-red-600'>{validationErrors.piecesRequises}</p>
                )}
              </div>

              {/* Critères d'éligibilité */}
              <div className='border-t pt-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <h3 className='text-sm font-bold text-gray-800'>Critères d éligibilité</h3>
                  <button
                    type='button'
                    onClick={addCritereEligibilite}
                    className='rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100'
                  >
                    + Ajouter un critère
                  </button>
                </div>
                {(formData.criteresEligibilite || []).length === 0 && (
                  <p className='text-xs text-gray-500'>
                    Aucun critère configuré. Vous pouvez ajouter des conditions comme l âge, la série, le diplôme requis, etc.
                  </p>
                )}
                {(formData.criteresEligibilite || []).map((critere, index) => (
                  <div key={index} className='mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3'>
                    <div className='mb-2 flex items-center justify-between'>
                      <p className='text-xs font-semibold text-gray-600'>Critère #{index + 1}</p>
                      <button
                        type='button'
                        onClick={() => removeCritereEligibilite(index)}
                        className='text-xs font-semibold text-red-600 hover:text-red-700'
                      >
                        Supprimer
                      </button>
                    </div>
                    <div className='grid gap-2'>
                      <input
                        type='text'
                        value={critere.titre}
                        onChange={(e) => updateCritereEligibilite(index, 'titre', e.target.value)}
                        className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                        placeholder='Ex: Série C ou D obligatoire'
                      />
                      <textarea
                        rows='2'
                        value={critere.description}
                        onChange={(e) => updateCritereEligibilite(index, 'description', e.target.value)}
                        className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                        placeholder='Détail optionnel du critère'
                      />
                    </div>
                  </div>
                ))}
                {validationErrors.criteresEligibilite && (
                  <p className='mt-2 text-xs text-red-600'>{validationErrors.criteresEligibilite}</p>
                )}
              </div>

              <div className='flex gap-3 pt-4 border-t'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition'
                >
                  Annuler
                </button>
                <button
                  type='button'
                  onClick={handleSubmit}
                  disabled={submitting}
                  className='flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50'
                >
                  {submitting ? 'Enregistrement...' : editingConcours ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>,
          document.body
        )}
      </div>
    </DGESLayout>
  );
}
