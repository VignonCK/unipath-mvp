// src/pages/GestionConcours.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { concoursService, etablissementService, centreCompositionService, decService } from '../services/api';
import { PiecesConfiguration } from '../components/PiecesConfiguration';
import GestionCentresConcours from '../components/concours/GestionCentresConcours';
import DECLayout from '../components/DECLayout';
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

function normalizeEtablissementText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Associe un libellé libre Concours.etablissement à un établissement public (sigle). */
function resolvePublicEtablissement(concours, publicEtablissements = []) {
  if (concours?.etablissementOrganisateur) return concours.etablissementOrganisateur;
  if (concours?.etablissementId) {
    const byId = publicEtablissements.find((e) => e.id === concours.etablissementId);
    if (byId) return byId;
  }

  const label = normalizeEtablissementText(concours?.etablissement);
  if (!label || publicEtablissements.length === 0) return null;

  const ordered = [...publicEtablissements].sort((a, b) => b.nom.length - a.nom.length);
  for (const etab of ordered) {
    const nom = normalizeEtablissementText(etab.nom);
    if (!nom) continue;
    const escaped = nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (
      label === nom
      || new RegExp(`\\(${escaped}\\)`, 'i').test(label)
      || new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(label)
    ) {
      return etab;
    }
  }
  return null;
}

export default function GestionConcours() {
  const [concours, setConcours] = useState([]);
  const [publicEtablissements, setPublicEtablissements] = useState([]);
  const [etudeStatuses, setEtudeStatuses] = useState({});
  const [annees, setAnnees] = useState([]);
  const [filterAnnee, setFilterAnnee] = useState('en-cours');
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
    centreIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [newMatiere, setNewMatiere] = useState('');
  const [catalogueCentres, setCatalogueCentres] = useState([]);
  const [numerosModal, setNumerosModal] = useState(null);
  const [generatingNumeros, setGeneratingNumeros] = useState(false);
  const [affectationModal, setAffectationModal] = useState(null);
  const [membresCommission, setMembresCommission] = useState([]);
  const [affectationForm, setAffectationForm] = useState({ examinateurs: [], controleurs: [] });
  const [savingAffectation, setSavingAffectation] = useState(false);
  const [postEtudeBusy, setPostEtudeBusy] = useState(false);
  const [detailsConcours, setDetailsConcours] = useState(null);

  const anneeQueryParams = () => {
    if (filterAnnee === 'toutes') return { toutesAnnees: true };
    if (filterAnnee === 'en-cours') {
      const enCours = annees.find((a) => a.enCours);
      return enCours ? { anneeAcademiqueId: enCours.id } : {};
    }
    return { anneeAcademiqueId: filterAnnee };
  };

  useEffect(() => {
    decService
      .listerAnneesAcademiques()
      .then((data) => {
        const list = data.annees || [];
        setAnnees(list);
        const enCours = data.anneeEnCours || list.find((a) => a.enCours);
        if (enCours) setFilterAnnee((prev) => (prev === 'en-cours' ? enCours.id : prev));
      })
      .catch(() => setAnnees([]));
    etablissementService
      .getPublics()
      .then((data) => setPublicEtablissements(data.etablissements || []))
      .catch(() => setPublicEtablissements([]));
    centreCompositionService
      .lister({ actif: 'true' })
      .then((data) => setCatalogueCentres(Array.isArray(data) ? data : []))
      .catch(() => setCatalogueCentres([]));
  }, []);

  useEffect(() => {
    loadConcours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAnnee, annees.length]);

  const loadConcours = async () => {
    try {
      setLoading(true);
      const params = anneeQueryParams();
      const [data, etudeRes] = await Promise.all([
        concoursService.getAll(params),
        decService.getEtudeDossiersStatuses(params).catch(() => ({ statuses: {} })),
      ]);
      setConcours(Array.isArray(data) ? data : []);
      setEtudeStatuses(etudeRes.statuses || {});
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLancerEtude = async (c) => {
    try {
      const res = await decService.lancerEtude(c.id);
      setEtudeStatuses((prev) => ({
        ...prev,
        [c.id]: res.status,
      }));
    } catch (err) {
      setError(err.message || "Erreur lors du lancement de l'étude");
    }
  };

  /** TEMP — tests uniquement : force la fin des inscriptions */
  const handleCloturerInscriptionsTest = async (c) => {
    if (!window.confirm(
      `[TEST] Clôturer immédiatement les inscriptions de « ${c.libelle} » ?\n`
      + 'La date de fin de dépôt sera avancée à maintenant.\n'
      + 'Ce bouton est temporaire et sera retiré avant le déploiement.'
    )) {
      return;
    }
    try {
      const res = await decService.cloturerInscriptionsTest(c.id);
      setEtudeStatuses((prev) => ({
        ...prev,
        [c.id]: res.status,
      }));
      if (res.concours?.dateFinDepot) {
        setConcours((prev) =>
          prev.map((item) =>
            item.id === c.id
              ? {
                  ...item,
                  dateFinDepot: res.concours.dateFinDepot,
                  dateFin: res.concours.dateFin || res.concours.dateFinDepot,
                }
              : item
          )
        );
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la clôture des inscriptions (test)');
    }
  };

  const handleCloturerEtude = async (c) => {
    if (!window.confirm(`Clôturer l'étude des dossiers pour « ${c.libelle} » ? Les examinateurs et contrôleurs n'y auront plus accès.`)) {
      return;
    }
    try {
      const res = await decService.cloturerEtude(c.id);
      setEtudeStatuses((prev) => ({
        ...prev,
        [c.id]: res.status,
      }));
      if (res.alerte?.incomplete) {
        window.alert(
          `Attention : ${res.alerte.dossiersNonEtudies} dossier(s) sur ${res.alerte.totalDossiers} `
          + `n'ont pas encore été examinés pour « ${c.libelle} ».\n\n`
          + 'Une notification a été envoyée à la DEC. Vous pourrez relancer l\'étude plus tard.'
        );
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la clôture');
    }
  };

  const handleGenererNumerosTable = async (c) => {
    if (!window.confirm(
      `Générer les numéros de table pour les retenus de « ${c.libelle} » ?\n`
      + 'Format : AA + code commune + code concours + rang alpha par centre.\n'
      + 'Les numéros déjà attribués pour ce concours seront recalculés.'
    )) {
      return;
    }
    setGeneratingNumeros(true);
    setError('');
    try {
      const res = await decService.genererNumerosTable(c.id, true);
      setNumerosModal(res);
      if (res?.concours?.code) {
        setConcours((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, code: res.concours.code } : item))
        );
        setDetailsConcours((prev) =>
          prev && prev.id === c.id ? { ...prev, code: res.concours.code } : prev
        );
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération des numéros de table');
    } finally {
      setGeneratingNumeros(false);
    }
  };

  const openAffectationModal = async (c) => {
    setError('');
    try {
      const [membres, aff] = await Promise.all([
        decService.listerMembresCommission(),
        decService.getAffectationsConcours(c.id),
      ]);
      setMembresCommission(Array.isArray(membres) ? membres : []);
      setAffectationForm({
        examinateurs: (aff.examinateurs || []).map((m) => m.id),
        controleurs: (aff.controleurs || []).map((m) => m.id),
      });
      setAffectationModal(c);
    } catch (err) {
      setError(err.message || 'Impossible de charger les affectations');
    }
  };

  const toggleAffectation = (role, membreId) => {
    setAffectationForm((prev) => {
      const key = role === 'EXAMINATEUR' ? 'examinateurs' : 'controleurs';
      const otherKey = role === 'EXAMINATEUR' ? 'controleurs' : 'examinateurs';
      const selected = new Set(prev[key]);
      const other = new Set(prev[otherKey]);

      if (selected.has(membreId)) {
        selected.delete(membreId);
      } else {
        selected.add(membreId);
        other.delete(membreId); // un seul rôle par concours
      }

      return {
        ...prev,
        [key]: [...selected],
        [otherKey]: [...other],
      };
    });
  };

  const saveAffectations = async () => {
    if (!affectationModal) return;
    setSavingAffectation(true);
    setError('');
    try {
      await decService.setAffectationsConcours(affectationModal.id, affectationForm);
      setAffectationModal(null);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement des affectations');
    } finally {
      setSavingAffectation(false);
    }
  };

  const handleExportListe = async (c, format) => {
    setPostEtudeBusy(true);
    setError('');
    try {
      if (format === 'pdf') await decService.telechargerListeRetenusPdf(c.id);
      else await decService.telechargerListeRetenusExcel(c.id);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export de la liste des retenus');
    } finally {
      setPostEtudeBusy(false);
    }
  };

  const handleEnvoyerConvocations = async (c) => {
    if (!window.confirm(
      `Envoyer les convocations par e-mail à tous les candidats admis (VALIDE) de « ${c.libelle} » ?\n`
      + 'Les numéros de table seront régénérés avant l\'envoi.'
    )) {
      return;
    }
    setPostEtudeBusy(true);
    setError('');
    try {
      const res = await decService.envoyerConvocationsRetenus(c.id, true);
      window.alert(res.message || 'Envoi des convocations lancé.');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi des convocations');
    } finally {
      setPostEtudeBusy(false);
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
      centreIds: [],
    });
    setValidationErrors({});
    setNewMatiere('');
    setShowModal(true);
  };

  const openEditModal = async (c) => {
    setEditingConcours(c);

    const piecesRequises = extractPiecesRequises(c);
    const criteresEligibilite = getCriteresEligibiliteFromConcours(c);

    const linkedEtab = c.etablissementOrganisateur;
    const useEtablissementLibre = !c.etablissementId;

    let centreIds = (c.centresActifs || []).map((l) => l.centreId).filter(Boolean);
    try {
      const liens = await centreCompositionService.getConcoursCentres(c.id, { tous: '1' });
      centreIds = (Array.isArray(liens) ? liens : [])
        .filter((l) => l.estActif !== false)
        .map((l) => l.centreId);
    } catch {
      /* keep from concours if any */
    }

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
      centreIds,
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

    // Dates dans l'année académique du concours (en cours à la création, ou année du concours à l'édition)
    const anneeCible =
      (editingConcours?.annee?.libelle && annees.find((a) => a.libelle === editingConcours.annee.libelle))
      || (editingConcours?.anneeAcademiqueId && annees.find((a) => a.id === editingConcours.anneeAcademiqueId))
      || annees.find((a) => a.enCours);
    if (anneeCible?.libelle) {
      const [y1, y2] = anneeCible.libelle.split('-').map(Number);
      const okYear = (value) => {
        if (!value) return true;
        const y = new Date(value).getFullYear();
        return y === y1 || y === y2;
      };
      const msg = `Doit être en ${y1} ou ${y2} (année ${anneeCible.libelle})`;
      if (!okYear(formData.dateDebutDepot)) errors.dateDebutDepot = msg;
      if (!okYear(formData.dateFinDepot)) errors.dateFinDepot = msg;
      if (!okYear(formData.dateDebutComposition)) errors.dateDebutComposition = msg;
      if (!okYear(formData.dateFinComposition)) errors.dateFinComposition = msg;
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
      centreIds: formData.centreIds || [],
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

  const etablissementFilterOptions = Array.from(
    concours.reduce((map, item) => {
      const resolved = resolvePublicEtablissement(item, publicEtablissements);
      const key = resolved?.id || getConcoursEtablissementKey(item);
      const label = resolved?.nom || getConcoursEtablissementLabel(item);
      if (!map.has(key)) {
        map.set(key, label);
      }
      return map;
    }, new Map())
  ).sort((a, b) => a[1].localeCompare(b[1], 'fr'));

  const filteredConcours = filterEtablissement
    ? concours.filter((c) => {
        const resolved = resolvePublicEtablissement(c, publicEtablissements);
        const key = resolved?.id || getConcoursEtablissementKey(c);
        return key === filterEtablissement;
      })
    : concours;

  if (loading) return (
    <DECLayout>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement...</p>
        </div>
      </div>
    </DECLayout>
  );

  return (
    <DECLayout>
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
          <div className='flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-[220px]'>
              <label className='text-sm font-medium text-gray-600 shrink-0' htmlFor='filter-annee'>
                Année académique
              </label>
              <select
                id='filter-annee'
                value={filterAnnee}
                onChange={(e) => setFilterAnnee(e.target.value)}
                className='w-full sm:max-w-xs rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white'
              >
                <option value='toutes'>Toutes (archives)</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}{a.enCours ? ' — en cours' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-[220px]'>
              <label className='text-sm font-medium text-gray-600 shrink-0' htmlFor='filter-etablissement'>
                Établissement
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
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Code</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Établissement</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Dépôt début</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Dépôt fin</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Composition</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Matières</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Frais</th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {filteredConcours.length === 0 ? (
                  <tr>
                    <td colSpan='9' className='px-4 py-10 text-center text-gray-400'>
                      {concours.length === 0
                        ? 'Aucun concours créé. Cliquez sur "Nouveau concours" pour commencer.'
                        : 'Aucun concours pour cet établissement.'}
                    </td>
                  </tr>
                ) : (
                  filteredConcours.map((c) => (
                    <tr key={c.id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3 font-medium text-gray-800'>{c.libelle}</td>
                      <td className='px-4 py-3 text-gray-700 text-xs font-mono font-semibold'>
                        {c.code || '—'}
                      </td>
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
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {Array.isArray(c.matieres) && c.matieres.length > 0
                          ? `${c.matieres.length} matière${c.matieres.length > 1 ? 's' : ''}`
                          : '-'}
                      </td>
                      <td className='px-4 py-3 text-gray-700 font-semibold'>
                        {c.fraisParticipation ? `${c.fraisParticipation} FCFA` : '-'}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex flex-col items-stretch justify-center gap-2 min-w-[10.5rem]'>
                          {(() => {
                            const status = etudeStatuses[c.id] || {};

                            const anneeCourante =
                              status.anneeEnCours === true
                              || c.annee?.enCours === true
                              || annees.find((a) => a.id === c.anneeAcademiqueId)?.enCours === true;

                            return (
                              <>
                                {status.periodeActive || status.peutCloturerEtude ? (
                                  <button
                                    type='button'
                                    disabled={!anneeCourante || !status.peutCloturerEtude}
                                    onClick={() => handleCloturerEtude(c)}
                                    title={
                                      !anneeCourante
                                        ? "Indisponible hors de l'année académique en cours"
                                        : "Clôturer l'étude des dossiers"
                                    }
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                                      !anneeCourante || !status.peutCloturerEtude
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                    }`}
                                  >
                                    Clôturer l&apos;étude des dossiers
                                  </button>
                                ) : (() => {
                                  const disabled = !anneeCourante || !status.peutLancerEtude;
                                  const isRelance = status.peutRelancerEtude || (anneeCourante && status.periodeTerminee);
                                  const label = isRelance
                                    ? "Relancer l'étude des dossiers"
                                    : "Lancer l'étude des dossiers";

                                  return (
                                    <button
                                      type='button'
                                      disabled={disabled}
                                      onClick={() => handleLancerEtude(c)}
                                      title={
                                        disabled
                                          ? !anneeCourante
                                            ? "Indisponible hors de l'année académique en cours (archives)"
                                            : status.periodeTerminee && status.tousEtudies
                                              ? 'Étude clôturée — tous les dossiers ont été étudiés'
                                              : 'Disponible uniquement après la clôture des inscriptions'
                                          : isRelance
                                            ? `${status.dossiersNonEtudies || 0} dossier(s) sans verdict / non finalisé(s) — relancer l'étude`
                                            : "Ouvre immédiatement l'accès aux dossiers pour les examinateurs et contrôleurs"
                                      }
                                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                                        disabled
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                          : isRelance
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })()}
                              </>
                            );
                          })()}
                          <button
                            type='button'
                            disabled={postEtudeBusy}
                            onClick={() => handleEnvoyerConvocations(c)}
                            title='Envoyer les convocations par e-mail aux admis'
                            className='px-2 py-1.5 rounded-lg text-[11px] font-semibold transition bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50'
                          >
                            Convocations
                          </button>
                          <button
                            type='button'
                            onClick={() => setDetailsConcours(c)}
                            title='Voir les détails et actions du concours'
                            className='px-2 py-1.5 rounded-lg text-[11px] font-semibold transition bg-blue-600 text-white hover:bg-blue-700'
                          >
                            Détails
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

        {detailsConcours && createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
              <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800'>Détails du concours</h2>
                  <p className='text-xs text-gray-500 mt-1'>{detailsConcours.libelle}</p>
                </div>
                <button type='button' onClick={() => setDetailsConcours(null)} className='p-1 hover:bg-gray-100 rounded-lg' aria-label='Fermer'>✕</button>
              </div>
              <div className='px-6 py-4 space-y-4'>
                <div className='grid grid-cols-2 gap-3 text-xs text-gray-600'>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Code</p>
                    <p className='font-mono font-semibold text-gray-800'>{detailsConcours.code || '—'}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Établissement</p>
                    <p className='font-medium text-gray-800'>{getConcoursEtablissementLabel(detailsConcours)}</p>
                  </div>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Dépôt</p>
                    <p>
                      {new Date(detailsConcours.dateDebutDepot || detailsConcours.dateDebut).toLocaleDateString('fr-FR')}
                      {' → '}
                      {new Date(detailsConcours.dateFinDepot || detailsConcours.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Composition</p>
                    <p>
                      {detailsConcours.dateDebutComposition && detailsConcours.dateFinComposition
                        ? `${new Date(detailsConcours.dateDebutComposition).toLocaleDateString('fr-FR')} → ${new Date(detailsConcours.dateFinComposition).toLocaleDateString('fr-FR')}`
                        : detailsConcours.dateComposition
                          ? new Date(detailsConcours.dateComposition).toLocaleDateString('fr-FR')
                          : '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Frais</p>
                    <p className='font-semibold text-gray-800'>
                      {detailsConcours.fraisParticipation
                        ? `${detailsConcours.fraisParticipation} FCFA`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Matières</p>
                    <p>
                      {Array.isArray(detailsConcours.matieres) && detailsConcours.matieres.length > 0
                        ? `${detailsConcours.matieres.length} matière(s)`
                        : '—'}
                    </p>
                  </div>
                  <div className='col-span-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2'>
                    <p className='text-gray-400 uppercase tracking-wide mb-0.5'>Candidats inscrits</p>
                    <p className='text-base font-bold text-slate-800'>
                      {typeof detailsConcours.nombreInscrits === 'number'
                        ? detailsConcours.nombreInscrits
                        : (etudeStatuses[detailsConcours.id]?.totalDossiers ?? '—')}
                      <span className='ml-1 text-xs font-normal text-gray-500'>
                        candidat{(detailsConcours.nombreInscrits ?? etudeStatuses[detailsConcours.id]?.totalDossiers ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>Actions</p>
                  <div className='flex flex-col gap-2'>
                    {(etudeStatuses[detailsConcours.id]?.anneeEnCours === true
                      || detailsConcours.annee?.enCours === true)
                      && etudeStatuses[detailsConcours.id]?.inscriptionsCloses === false && (
                      <button
                        type='button'
                        onClick={() => handleCloturerInscriptionsTest(detailsConcours)}
                        title='[TEMP TEST] Avance la date de fin des inscriptions pour tester le lancement de l’étude'
                        className='w-full px-3 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 ring-2 ring-orange-300'
                      >
                        Clôturer les inscriptions (test)
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={() => openAffectationModal(detailsConcours)}
                      className='w-full px-3 py-2 rounded-lg text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800'
                    >
                      Affecter la commission
                    </button>
                    <button
                      type='button'
                      disabled={generatingNumeros || postEtudeBusy}
                      onClick={() => handleGenererNumerosTable(detailsConcours)}
                      className='w-full px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                    >
                      Générer les N° de table
                    </button>
                    <div className='flex gap-2'>
                      <button
                        type='button'
                        disabled={postEtudeBusy}
                        onClick={() => handleExportListe(detailsConcours, 'pdf')}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50'
                      >
                        Liste PDF
                      </button>
                      <button
                        type='button'
                        disabled={postEtudeBusy}
                        onClick={() => handleExportListe(detailsConcours, 'excel')}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
                      >
                        Liste Excel
                      </button>
                    </div>
                    <div className='flex gap-2 pt-1'>
                      <button
                        type='button'
                        onClick={() => {
                          const c = detailsConcours;
                          setDetailsConcours(null);
                          openEditModal(c);
                        }}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-blue-200 text-blue-700 hover:bg-blue-50'
                      >
                        Modifier
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          const c = detailsConcours;
                          setDetailsConcours(null);
                          handleDelete(c.id, c.libelle);
                        }}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50'
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {affectationModal && createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800'>Affecter la commission</h2>
                  <p className='text-xs text-gray-500 mt-1'>{affectationModal.libelle}</p>
                  <p className='text-[11px] text-amber-700 mt-1'>
                    Un membre ne peut être que examinateur ou contrôleur pour ce concours, pas les deux.
                  </p>
                </div>
                <button type='button' onClick={() => setAffectationModal(null)} className='p-1 hover:bg-gray-100 rounded-lg'>✕</button>
              </div>
              <div className='px-6 py-4 grid sm:grid-cols-2 gap-4'>
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Examinateurs</h3>
                  <div className='space-y-1 max-h-72 overflow-y-auto border border-gray-100 rounded-lg p-2'>
                    {membresCommission.length === 0 && (
                      <p className='text-xs text-gray-400 p-2'>Aucun membre commission en base.</p>
                    )}
                    {membresCommission.map((m) => (
                      <label key={`ex-${m.id}`} className='flex items-start gap-2 text-xs p-1.5 hover:bg-gray-50 rounded cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={affectationForm.examinateurs.includes(m.id)}
                          onChange={() => toggleAffectation('EXAMINATEUR', m.id)}
                        />
                        <span>
                          <span className='font-medium'>{m.nom} {m.prenom}</span>
                          <span className='block text-gray-400'>{m.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-2'>Contrôleurs</h3>
                  <div className='space-y-1 max-h-72 overflow-y-auto border border-gray-100 rounded-lg p-2'>
                    {membresCommission.map((m) => (
                      <label key={`ct-${m.id}`} className='flex items-start gap-2 text-xs p-1.5 hover:bg-gray-50 rounded cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={affectationForm.controleurs.includes(m.id)}
                          onChange={() => toggleAffectation('CONTROLEUR', m.id)}
                        />
                        <span>
                          <span className='font-medium'>{m.nom} {m.prenom}</span>
                          <span className='block text-gray-400'>{m.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className='px-6 py-4 border-t border-gray-100 flex justify-end gap-2'>
                <button type='button' onClick={() => setAffectationModal(null)} className='px-3 py-2 text-sm rounded-lg border border-gray-200'>Annuler</button>
                <button
                  type='button'
                  disabled={savingAffectation}
                  onClick={saveAffectations}
                  className='px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
                >
                  {savingAffectation ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {numerosModal && createPortal(
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
              <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-lg font-bold text-gray-800'>Numéros de table générés</h2>
                  <p className='text-xs text-gray-500 mt-1'>
                    {numerosModal.concours?.libelle}
                    {numerosModal.concours?.code ? ` — code concours ${numerosModal.concours.code}` : ''}
                    {numerosModal.concours?.anneeComposition
                      ? ` — année ${numerosModal.concours.anneeComposition}`
                      : ''}
                    {' · '}
                    {numerosModal.totalGeneres} numéro(s)
                  </p>
                  <p className='text-[11px] text-gray-400 mt-1 font-mono'>
                    Format : AA + commune + concours + rang (ex. 260140601)
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setNumerosModal(null)}
                  className='p-1 hover:bg-gray-100 rounded-lg'
                  aria-label='Fermer'
                >
                  ✕
                </button>
              </div>
              <div className='px-6 py-4 space-y-4'>
                {(numerosModal.retenusSansCentre > 0 || (numerosModal.erreursCentres || []).length > 0) && (
                  <div className='text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>
                    {numerosModal.retenusSansCentre > 0 && (
                      <p>{numerosModal.retenusSansCentre} retenu(s) sans centre — non numérotés.</p>
                    )}
                    {(numerosModal.erreursCentres || []).map((e) => (
                      <p key={e.centreId}>{e.error}</p>
                    ))}
                  </div>
                )}
                {(numerosModal.centres || []).map((centre) => (
                  <div key={centre.centreId} className='border border-gray-100 rounded-xl overflow-hidden'>
                    <div className='bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700'>
                      {centre.ville} ({centre.communeCode}) — {centre.centreNom}
                      <span className='text-gray-400 font-normal ml-2'>{centre.total} candidat(s)</span>
                    </div>
                    <table className='w-full text-xs'>
                      <thead>
                        <tr className='border-b border-gray-100 text-gray-500'>
                          <th className='px-3 py-2 text-left'>Rang</th>
                          <th className='px-3 py-2 text-left'>Candidat</th>
                          <th className='px-3 py-2 text-left'>N° de table</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {centre.candidats.map((row) => (
                          <tr key={row.inscriptionId}>
                            <td className='px-3 py-2'>{String(row.ordre).padStart(3, '0')}</td>
                            <td className='px-3 py-2'>
                              {row.candidat?.nom} {row.candidat?.prenom}
                            </td>
                            <td className='px-3 py-2 font-mono font-semibold'>{row.numeroTable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

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
                <h3 className='text-sm font-bold text-gray-800 mb-1'>Période de dépôt des dossiers</h3>
                <p className='text-xs text-gray-500 mb-3'>
                  {(() => {
                    const enCours = annees.find((a) => a.enCours);
                    if (!enCours) return 'Les dates doivent appartenir à l’année académique du concours.';
                    const [y1, y2] = enCours.libelle.split('-');
                    return `Année académique en cours : ${enCours.libelle}. Toutes les dates doivent être en ${y1} ou ${y2}.`;
                  })()}
                </p>
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

              <div className='border-t pt-4 space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h3 className='text-sm font-bold text-gray-800'>
                    Centres de composition
                  </h3>
                  <p className='text-xs text-gray-500'>
                    Sélectionnez les lieux où les candidats pourront composer
                  </p>
                </div>
                {catalogueCentres.length === 0 ? (
                  <p className='text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>
                    Aucun centre dans le catalogue. Créez-en un ci-dessous après enregistrement, ou via « Créer un nouveau centre ».
                  </p>
                ) : (
                  <div className='max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2'>
                    {catalogueCentres.map((centre) => {
                      const checked = (formData.centreIds || []).includes(centre.id);
                      return (
                        <label key={centre.id} className='flex items-start gap-2 cursor-pointer text-sm'>
                          <input
                            type='checkbox'
                            className='mt-1'
                            checked={checked}
                            onChange={(e) => {
                              setFormData((prev) => {
                                const current = prev.centreIds || [];
                                return {
                                  ...prev,
                                  centreIds: e.target.checked
                                    ? [...current, centre.id]
                                    : current.filter((id) => id !== centre.id),
                                };
                              });
                            }}
                          />
                          <span>
                            <span className='font-medium text-gray-900'>{centre.nom}</span>
                            <span className='text-gray-500'> — {centre.ville}</span>
                            {centre.adresse ? (
                              <span className='block text-xs text-gray-400'>{centre.adresse}</span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {(formData.centreIds || []).length > 0 && (
                  <p className='text-xs text-green-700'>
                    {(formData.centreIds || []).length} centre(s) sélectionné(s)
                  </p>
                )}
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
    </DECLayout>
  );
}
