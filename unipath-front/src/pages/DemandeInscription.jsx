// Gère le dépôt de dossier (Application) pour les établissements privés.
// Ne pas confondre avec le service inscriptionAcadService qui gère les inscriptions académiques effectives.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  applicationService,
  candidatService,
  etablissementService,
  filiereService,
  inscriptionAcadService,
  preinscriptionEtablissementService,
} from '../services/api';
import { handleSessionError } from '../utils/auth';
import { getApplicationStatus, PREINSCRIPTION_STATUS } from '../utils/adminParcoursInscription';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';
import { ROUTES } from '../constants/routes';

const NIVEAUX = [
  { value: '1', label: 'Licence 1' },
  { value: '2', label: 'Licence 2' },
  { value: '3', label: 'Licence 3' },
];

const STATUS_ORDER = ['DRAFT', 'DOSSIER_FEES_PAID', 'PENDING_DOCUMENTS', 'READY_FOR_PREINSCRIPTION', 'FICHE_GENERATED'];

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition';
const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-700';

const DEFAULT_DOSSIER_FEES = 5000;

function formatFcfa(value) {
  if (value == null) return '—';
  return `${Number(value).toLocaleString('fr-FR')} FCFA`;
}

function resolveFraisDossierFromForm(etablissements, form) {
  if (!form.filiereId) return null;

  if (form.campagneFiliereId) {
    for (const etab of etablissements) {
      for (const campagne of etab.campagnes || []) {
        const cf = (campagne.filieres || []).find((item) => item.id === form.campagneFiliereId);
        if (cf?.fraisDossier != null) return cf.fraisDossier;
      }
    }
  }

  const etab = etablissements.find((e) => e.id === form.etablissementId);
  if (etab) {
    for (const campagne of etab.campagnes || []) {
      const cf = (campagne.filieres || []).find(
        (item) => item.filiereId === form.filiereId || item.filiere?.id === form.filiereId,
      );
      if (cf?.fraisDossier != null) return cf.fraisDossier;
    }
  }

  return DEFAULT_DOSSIER_FEES;
}

async function fetchFiliereById(filiereId, etablissementId) {
  if (etablissementId) {
    const data = await filiereService.getByEtablissement(etablissementId);
    const found = (data.filieres || []).find((f) => f.id === filiereId);
    if (found) return found;
  }

  const data = await filiereService.getAll();
  return (data.filieres || []).find((f) => f.id === filiereId) || null;
}

function filiereHasRecapFields(filiere) {
  if (!filiere) return false;
  return (
    filiere.fraisInscriptionEffective != null ||
    filiere.fraisScolariteAnnuels != null ||
    Boolean(filiere.fraisAutres)
  );
}

function RecapitulatifFrais({ fraisDossier, filiere }) {
  if (fraisDossier == null) return null;

  const fraisInscription = filiere?.fraisInscriptionEffective ?? null;
  const totalPrevu = fraisDossier + (fraisInscription ?? 0);

  return (
    <div className='rounded-xl border border-amber-200 bg-amber-50/40 p-4'>
      <h3 className='mb-3 text-sm font-bold text-gray-900'>Récapitulatif des frais</h3>
      <div className='overflow-x-auto rounded-lg border border-amber-100 bg-white'>
        <table className='w-full text-sm'>
          <tbody className='divide-y divide-gray-100'>
            <tr>
              <td className='px-4 py-2.5 text-gray-700'>Frais de dossier</td>
              <td className='px-4 py-2.5 text-right font-medium text-gray-900'>{formatFcfa(fraisDossier)}</td>
            </tr>
            <tr>
              <td className='px-4 py-2.5 text-gray-700'>Frais d&apos;inscription</td>
              <td className='px-4 py-2.5 text-right font-medium text-gray-900'>{formatFcfa(fraisInscription)}</td>
            </tr>
            <tr>
              <td className='px-4 py-2.5 text-gray-700'>Scolarité annuelle</td>
              <td className='px-4 py-2.5 text-right font-medium text-gray-900'>
                {formatFcfa(filiere?.fraisScolariteAnnuels)}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-2.5 text-gray-700'>Autres frais</td>
              <td className='px-4 py-2.5 text-right text-gray-700'>{filiere?.fraisAutres || '—'}</td>
            </tr>
            <tr className='bg-amber-50/80'>
              <td className='px-4 py-2.5 font-bold text-gray-900'>TOTAL À PRÉVOIR</td>
              <td className='px-4 py-2.5 text-right font-bold text-gray-900'>{formatFcfa(totalPrevu)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className='mt-3 text-xs leading-relaxed text-amber-900/80'>
        * Les frais de dossier sont à régler maintenant. Les frais d&apos;inscription et de scolarité seront exigés
        après acceptation de votre dossier.
      </p>
    </div>
  );
}

const APPLICATION_ACTION_MESSAGES = {
  DRAFT: 'Votre dossier est en brouillon. Cliquez pour continuer.',
  DOSSIER_FEES_PAID: 'Paiement reçu — complétez les pièces de votre dossier.',
  PENDING_DOCUMENTS: 'Votre dossier est incomplet — action de votre part requise.',
  READY_FOR_PREINSCRIPTION: 'Votre dossier est complet — vous pouvez le finaliser.',
  FICHE_GENERATED: 'Votre fiche a été générée. En attente de réponse de l\'école.',
};

const PREINSCRIPTION_ACTION_MESSAGES = {
  EN_ATTENTE: 'L\'école examine votre dossier.',
  VALIDE: 'Félicitations ! Votre dossier a été accepté.',
  SOUS_RESERVE: 'Action requise : une ou plusieurs pièces de votre dossier ne sont pas conformes.',
  REJETE: 'Votre dossier n\'a pas été retenu.',
};

const INSCRIPTION_ACAD_BADGES = {
  EN_COURS: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
  EN_ATTENTE_QUITTANCE: { label: 'Quittance à soumettre', className: 'bg-orange-100 text-orange-800' },
  QUITTANCE_SOUMISE: { label: 'Quittance en vérification', className: 'bg-yellow-100 text-yellow-800' },
  VALIDE: { label: 'Inscrit(e)', className: 'bg-green-100 text-green-800' },
  REDOUBLANT: { label: 'Redoublant', className: 'bg-gray-100 text-gray-700' },
  ABANDONNE: { label: 'Abandonné', className: 'bg-red-100 text-red-800' },
};

function tabButtonClass(active) {
  return `px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${
    active
      ? 'border-orange-500 text-blue-900'
      : 'border-transparent text-gray-500 hover:text-blue-900 hover:border-gray-300'
  }`;
}

const STATUS_CARD_STYLES = {
  application: {
    DRAFT: { border: 'border-l-4 border-amber-400', badge: 'bg-amber-100 text-amber-800' },
    FICHE_GENERATED: { border: 'border-l-4 border-blue-400', badge: 'bg-blue-100 text-blue-800' },
  },
  preinscription: {
    EN_ATTENTE: { border: 'border-l-4 border-orange-400', badge: 'bg-orange-100 text-orange-800' },
    VALIDE: { border: 'border-l-4 border-green-400', badge: 'bg-green-100 text-green-800' },
    REJETE: { border: 'border-l-4 border-red-400', badge: 'bg-red-100 text-red-800' },
    SOUS_RESERVE: { border: 'border-l-4 border-amber-500', badge: 'bg-amber-100 text-amber-900' },
  },
};

function getStatusCardStyle(status, type = 'application') {
  return STATUS_CARD_STYLES[type]?.[status] || { border: '', badge: null };
}

function parseDocumentsCompl(documentsCompl) {
  if (documentsCompl?.pieces && Array.isArray(documentsCompl.pieces)) {
    return documentsCompl.pieces;
  }
  return [];
}

function getPiecesACorrigerCodes(piecesACorriger) {
  if (!Array.isArray(piecesACorriger)) return [];
  return piecesACorriger
    .map((p) => (typeof p === 'string' ? p.trim() : String(p?.code || '').trim()))
    .filter(Boolean);
}

function getPieceLabel(piecesACorriger, code, fallbackDoc) {
  if (Array.isArray(piecesACorriger)) {
    const entry = piecesACorriger.find((p) => (typeof p === 'string' ? p : p?.code) === code);
    if (entry && typeof entry === 'object' && entry.label) return entry.label;
  }
  return fallbackDoc?.label || code;
}

function statusIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function AlertBanner({ type, children, onDismiss }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p>{children}</p>
      {onDismiss && (
        <button type='button' onClick={onDismiss} className='shrink-0 opacity-60 hover:opacity-100' aria-label='Fermer'>
          ✕
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status, type = 'application', badgeClass }) {
  const info =
    type === 'application'
      ? getApplicationStatus(status)
      : PREINSCRIPTION_STATUS[status] || { label: status, badge: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass || info.badge}`}>
      {info.label}
    </span>
  );
}

function WorkflowStepper({ status }) {
  const steps = [
    { label: 'Paiement', min: 1 },
    { label: 'Pièces', min: 2 },
    { label: 'Finalisation', min: 4 },
  ];
  const current = statusIndex(status);

  return (
    <div className='flex flex-wrap items-center gap-2 sm:gap-0'>
      {steps.map((step, i) => {
        const done = current >= step.min;
        const active = !done && (i === 0 ? current < 1 : current >= steps[i - 1].min && current < step.min);

        return (
          <div key={step.label} className='flex items-center'>
            <div className='flex items-center gap-2'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : active
                      ? 'bg-blue-900 text-white ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-semibold sm:text-sm ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 hidden h-0.5 w-8 sm:block md:w-16 ${current > step.min ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DemandeInscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};
  const hasPrefill = Boolean(prefill.etablissementId || prefill.filiereId);

  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(hasPrefill ? 'nouvelle' : 'dossiers');
  const [candidat, setCandidat] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
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
  const [preinscriptions, setPreinscriptions] = useState([]);
  const [loadingPreinscriptions, setLoadingPreinscriptions] = useState(true);
  const [docModal, setDocModal] = useState({ open: false, preinscriptionId: null });
  const [docFichier, setDocFichier] = useState(null);
  const [preinBusy, setPreinBusy] = useState(false);
  const [preinMessage, setPreinMessage] = useState('');
  const [preinError, setPreinError] = useState('');
  /** @type {[Record<string, { applicationId: string, documents: any[] }>, Function]} */
  const [correctionBundles, setCorrectionBundles] = useState({});
  const [correctionFiles, setCorrectionFiles] = useState({});
  const [correctionBusyCode, setCorrectionBusyCode] = useState('');

  const [inscriptionsAcad, setInscriptionsAcad] = useState([]);
  const [loadingInscriptionsAcad, setLoadingInscriptionsAcad] = useState(true);
  const [acadUploadModal, setAcadUploadModal] = useState({ open: false, inscriptionId: null, label: '' });
  const [acadFichier, setAcadFichier] = useState(null);
  const [acadUploadBusy, setAcadUploadBusy] = useState(false);
  const [acadUploadMessage, setAcadUploadMessage] = useState('');
  const [acadUploadError, setAcadUploadError] = useState('');

  const [recapFiliere, setRecapFiliere] = useState(null);
  const [confirmedFraisDossier, setConfirmedFraisDossier] = useState(null);

  const [form, setForm] = useState({
    etablissementId: prefill.etablissementId || '',
    filiereId: prefill.filiereId || '',
    anneeAcademique: prefill.anneeAcademique || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    niveau: prefill.niveau || '',
    campagneFiliereId: prefill.campagneFiliereId || '',
  });

  const selectedApplication = useMemo(
    () => applications.find((a) => a.id === selectedApplicationId) || null,
    [applications, selectedApplicationId],
  );

  const providedCount = useMemo(() => requirements.filter((r) => r.provided).length, [requirements]);

  const fraisDossierMontant = useMemo(() => {
    const montant = applicationDetail?.campagneFiliere?.fraisDossier;
    return montant != null ? montant : DEFAULT_DOSSIER_FEES;
  }, [applicationDetail]);

  const fraisDossierPreview = useMemo(
    () => resolveFraisDossierFromForm(etablissements, form),
    [etablissements, form],
  );

  const recapFiliereId = useMemo(() => {
    if (activeTab === 'nouvelle') return form.filiereId || '';
    return applicationDetail?.filiereId || applicationDetail?.filiere?.id || '';
  }, [activeTab, form.filiereId, applicationDetail]);

  const recapEtablissementId = useMemo(() => {
    if (activeTab === 'nouvelle') return form.etablissementId || '';
    return applicationDetail?.etablissementId || applicationDetail?.etablissement?.id || '';
  }, [activeTab, form.etablissementId, applicationDetail]);

  const fraisDossierAffiche = useMemo(() => {
    if (confirmedFraisDossier != null) return confirmedFraisDossier;
    const paid = applicationDetail?.payments?.find(
      (p) => p.paymentType === 'DOSSIER_FEES' && p.status === 'CONFIRMED',
    );
    if (paid?.amount != null) return paid.amount;
    return fraisDossierMontant;
  }, [confirmedFraisDossier, applicationDetail, fraisDossierMontant]);

  const fraisDossierRecap = activeTab === 'nouvelle' ? fraisDossierPreview : fraisDossierAffiche;

  const dossierFeesPaid = useMemo(
    () =>
      Boolean(
        applicationDetail?.payments?.some(
          (p) => p.paymentType === 'DOSSIER_FEES' && p.status === 'CONFIRMED',
        ),
      ),
    [applicationDetail],
  );

  useEffect(() => {
    setConfirmedFraisDossier(null);
  }, [selectedApplicationId]);

  useEffect(() => {
    if (!recapFiliereId) {
      setRecapFiliere(null);
      return undefined;
    }

    const fromList = filieres.find((f) => f.id === recapFiliereId);
    if (filiereHasRecapFields(fromList)) {
      setRecapFiliere(fromList);
      return undefined;
    }

    let cancelled = false;

    fetchFiliereById(recapFiliereId, recapEtablissementId)
      .then((detail) => {
        if (!cancelled) setRecapFiliere(detail || fromList || null);
      })
      .catch(() => {
        if (!cancelled) setRecapFiliere(fromList || null);
      });

    return () => {
      cancelled = true;
    };
  }, [recapFiliereId, recapEtablissementId, filieres]);

  const loadPreinscriptions = useCallback(async () => {
    setLoadingPreinscriptions(true);
    try {
      const data = await preinscriptionEtablissementService.getMesPreinscriptions();
      setPreinscriptions(data.preinscriptions || []);
    } catch (err) {
      setPreinError(err.message || 'Erreur chargement réponses de l\'école');
    } finally {
      setLoadingPreinscriptions(false);
    }
  }, []);

  const loadCorrectionBundles = useCallback(async (preinsList, appsList) => {
    const sousReserve = (preinsList || []).filter((p) => p.statut === 'SOUS_RESERVE');
    if (sousReserve.length === 0) {
      setCorrectionBundles({});
      return;
    }
    const next = {};
    await Promise.all(
      sousReserve.map(async (p) => {
        const app =
          (appsList || []).find((a) => a.preinscriptionId === p.id) ||
          (appsList || []).find(
            (a) =>
              a.etablissementId === p.etablissementId &&
              a.filiereId === p.filiereId &&
              a.anneeAcademique === p.anneeAcademique,
          );
        if (!app?.id) return;
        try {
          const data = await applicationService.getById(app.id);
          next[p.id] = {
            applicationId: app.id,
            documents: data.application?.documents || [],
          };
        } catch {
          next[p.id] = { applicationId: app.id, documents: [] };
        }
      }),
    );
    setCorrectionBundles(next);
  }, []);

  useEffect(() => {
    if (!preinscriptions.length || !applications.length) return;
    loadCorrectionBundles(preinscriptions, applications);
  }, [preinscriptions, applications, loadCorrectionBundles]);

  const loadInscriptionsAcad = useCallback(async () => {
    setLoadingInscriptionsAcad(true);
    try {
      const data = await inscriptionAcadService.getMesInscriptions();
      setInscriptionsAcad(data.inscriptions || []);
    } catch (err) {
      setError(err.message || 'Erreur chargement inscriptions');
    } finally {
      setLoadingInscriptionsAcad(false);
    }
  }, []);

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
        const [profil, data] = await Promise.all([candidatService.getProfil(), etablissementService.getPrives()]);
        setCandidat(profil);
        const saved = localStorage.getItem(`photoProfil_${profil.id}`);
        if (saved) setPhotoUrl(saved);
        setEtablissements((data.etablissements || []).filter((e) => e.type === 'PRIVE'));
        const appId = await loadApplications();
        if (appId) await loadApplicationDetails(appId);
        await loadPreinscriptions();
        await loadInscriptionsAcad();
      } catch (err) {
        if (handleSessionError(err, navigate)) return;
        setError(err.message || 'Erreur de chargement initial');
        setLoadingList(false);
      } finally {
        setInitialLoading(false);
      }
    };
    bootstrap();
  }, [loadApplicationDetails, loadApplications, loadInscriptionsAcad, loadPreinscriptions, navigate]);

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
        setError(err.message || 'Erreur de chargement des filières');
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
      ...(name === 'etablissementId'
        ? { filiereId: '', campagneFiliereId: '' }
        : name === 'filiereId'
          ? { campagneFiliereId: '' }
          : {}),
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
      if (form.campagneFiliereId) {
        payload.campagneFiliereId = form.campagneFiliereId;
      }
      const data = await applicationService.creer(payload);
      const appId = data?.application?.id || '';
      const chosenId = await loadApplications(appId);
      if (chosenId) await loadApplicationDetails(chosenId);
      setMessage(data.message || 'Dossier créé avec succès');
      setActiveTab('dossiers');
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
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
      if (data.amount != null) {
        setConfirmedFraisDossier(data.amount);
      }
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Paiement confirmé');
    } catch (err) {
      setError(err.message || 'Erreur paiement frais dossier');
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
      setMessage(data.message || 'Document ajouté');
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
      setMessage(data.message || 'Fiche générée');
    } catch (err) {
      setError(err.message || 'Erreur finalisation dossier');
    } finally {
      setActionBusy(false);
    }
  };

  const ajouterDocumentCompl = async () => {
    if (!docModal.preinscriptionId || !docFichier) return;
    try {
      setPreinBusy(true);
      setPreinError('');
      setPreinMessage('');
      const formData = new FormData();
      formData.append('fichier', docFichier);
      const data = await preinscriptionEtablissementService.ajouterDocumentCompl(docModal.preinscriptionId, formData);
      setPreinMessage(data.message || 'Document ajouté');
      setDocFichier(null);
      setDocModal({ open: false, preinscriptionId: null });
      await loadPreinscriptions();
    } catch (err) {
      setPreinError(err.message || 'Erreur upload document');
    } finally {
      setPreinBusy(false);
    }
  };

  const resoumettreDossier = async (id) => {
    if (!window.confirm('Confirmer la resoumission de votre dossier ?')) return;
    try {
      setPreinBusy(true);
      setPreinError('');
      setPreinMessage('');
      const data = await preinscriptionEtablissementService.resoumettre(id);
      setPreinMessage(data.message || 'Dossier resoumis');
      await loadPreinscriptions();
      await loadApplications();
    } catch (err) {
      setPreinError(err.message || 'Erreur resoumission');
    } finally {
      setPreinBusy(false);
    }
  };

  const uploadPieceCorrection = async (preinscriptionId, code) => {
    const bundle = correctionBundles[preinscriptionId];
    const file = correctionFiles[`${preinscriptionId}:${code}`];
    if (!bundle?.applicationId || !file) return;
    try {
      setCorrectionBusyCode(code);
      setPreinError('');
      setPreinMessage('');
      await applicationService.uploadDocument(bundle.applicationId, code, file);
      setCorrectionFiles((prev) => {
        const next = { ...prev };
        delete next[`${preinscriptionId}:${code}`];
        return next;
      });
      setPreinMessage('Pièce corrigée avec succès');
      await loadCorrectionBundles(preinscriptions, applications);
    } catch (err) {
      setPreinError(err.message || 'Erreur upload de la pièce');
    } finally {
      setCorrectionBusyCode('');
    }
  };

  const ouvrirUploadAcad = (inscription) => {
    setAcadUploadModal({
      open: true,
      inscriptionId: inscription.id,
      label: `${inscription.etablissement?.nom || 'Établissement'} — ${inscription.filiere?.nom || 'Filière'}`,
    });
    setAcadFichier(null);
    setAcadUploadMessage('');
    setAcadUploadError('');
  };

  const fermerUploadAcad = () => {
    setAcadUploadModal({ open: false, inscriptionId: null, label: '' });
    setAcadFichier(null);
    setAcadUploadMessage('');
    setAcadUploadError('');
  };

  const soumettreQuittanceAcad = async () => {
    if (!acadUploadModal.inscriptionId || !acadFichier) return;
    try {
      setAcadUploadBusy(true);
      setAcadUploadError('');
      setAcadUploadMessage('');
      const formData = new FormData();
      formData.append('fichier', acadFichier);
      const data = await inscriptionAcadService.soumettreQuittance(acadUploadModal.inscriptionId, formData);
      setAcadUploadMessage(data.message || 'Quittance soumise avec succès');
      await loadInscriptionsAcad();
      setTimeout(() => fermerUploadAcad(), 1200);
    } catch (err) {
      setAcadUploadError(err.message || 'Erreur lors de la soumission');
    } finally {
      setAcadUploadBusy(false);
    }
  };

  if (initialLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-blue-900 border-t-orange-500' />
      </div>
    );
  }

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20' />

      <div className='mx-auto max-w-5xl animate-slide-up space-y-6 px-2 sm:px-0'>
        <div>
          <h1 className='text-2xl font-black text-gray-900 md:text-3xl'>Mes dossiers</h1>
          <p className='mt-2 max-w-2xl text-sm text-gray-600 md:text-base'>
            Suivez vos demandes et inscriptions dans les écoles privées
          </p>
        </div>

        {error && <AlertBanner type='error' onDismiss={() => setError('')}>{error}</AlertBanner>}
        {message && <AlertBanner type='success' onDismiss={() => setMessage('')}>{message}</AlertBanner>}

        <div className='flex flex-wrap gap-1 border-b border-gray-200'>
          <button type='button' className={tabButtonClass(activeTab === 'dossiers')} onClick={() => setActiveTab('dossiers')}>
            Mes dossiers
          </button>
          <button type='button' className={tabButtonClass(activeTab === 'nouvelle')} onClick={() => setActiveTab('nouvelle')}>
            Nouvelle demande
          </button>
        </div>

        {activeTab === 'dossiers' && (
          <div className='space-y-6'>
            <BentoCard size='full' variant='solid' className='!min-h-0 !p-0 overflow-hidden !bg-white dark:!bg-white'>
              <div className='flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-orange-50/80 to-white px-6 py-4'>
                <div>
                  <h2 className='text-lg font-bold text-gray-900'>Mes dossiers</h2>
                  <p className='mt-1 text-sm text-gray-500'>
                    {applications.length > 0
                      ? `${applications.length} dossier${applications.length > 1 ? 's' : ''} en cours`
                      : 'Aucun dossier pour le moment'}
                  </p>
                </div>
              </div>

              <div className='p-4'>
                {loadingList && (
                  <div className='flex justify-center py-10'>
                    <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-orange-500' />
                  </div>
                )}

                {!loadingList && applications.length === 0 && (
                  <div className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center'>
                    <p className='text-sm font-medium text-gray-700'>
                      Vous n&apos;avez pas encore déposé de dossier.
                    </p>
                    <p className='mt-2 text-sm text-gray-500'>
                      Commencez par parcourir les{' '}
                      <Link to={ROUTES.parcours.etablissements} className='font-semibold text-blue-900 hover:underline'>
                        écoles privées
                      </Link>
                      .
                    </p>
                  </div>
                )}

                {!loadingList && applications.length > 0 && (
                  <div className='space-y-3'>
                    {applications.map((a) => {
                      const isSelected = a.id === selectedApplicationId;
                      const cardStyle = getStatusCardStyle(a.status, 'application');
                      const actionMessage = APPLICATION_ACTION_MESSAGES[a.status];

                      return (
                        <div
                          key={a.id}
                          className={`rounded-2xl border p-4 transition ${cardStyle.border} ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-600/20'
                              : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
                          }`}
                        >
                          <div className='flex flex-wrap items-start justify-between gap-2'>
                            <div>
                              <p className='font-semibold text-gray-900'>{a.etablissement?.nom || 'Établissement'}</p>
                              <p className='mt-0.5 text-sm text-gray-600'>{a.filiere?.nom || 'Filière'}</p>
                              <p className='mt-2 font-mono text-xs text-gray-400'>{a.numeroApplication}</p>
                            </div>
                            <StatusBadge status={a.status} badgeClass={cardStyle.badge} />
                          </div>
                          {actionMessage && (
                            <p className='mt-3 text-sm text-gray-700'>{actionMessage}</p>
                          )}
                          <button
                            type='button'
                            onClick={() => setSelectedApplicationId(isSelected ? null : a.id)}
                            className='mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50'
                          >
                            {isSelected ? 'Masquer le détail' : 'Voir le détail'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </BentoCard>

            {selectedApplicationId && (
              <BentoCard size='full' variant='solid' className='!min-h-0 !p-0 overflow-hidden !bg-white dark:!bg-white'>
                <div className='border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white px-6 py-5'>
                  <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                      <h2 className='text-lg font-bold text-gray-900'>Suivi du dossier</h2>
                      {selectedApplication ? (
                        <p className='mt-1 text-sm text-gray-600'>
                          {selectedApplication.etablissement?.nom} — {selectedApplication.filiere?.nom}
                        </p>
                      ) : (
                        <p className='mt-1 text-sm text-gray-500'>Chargement…</p>
                      )}
                    </div>
                    {applicationDetail && (
                      <StatusBadge
                        status={applicationDetail.status}
                        badgeClass={getStatusCardStyle(applicationDetail.status, 'application').badge}
                      />
                    )}
                  </div>
                  {applicationDetail && (
                    <div className='mt-5'>
                      <WorkflowStepper status={applicationDetail.status} />
                    </div>
                  )}
                </div>

                <div className='p-6'>
                  {loadingDetail && (
                    <div className='flex justify-center py-12'>
                      <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-orange-500' />
                    </div>
                  )}

                  {!loadingDetail && applicationDetail && (
                    <div className='space-y-6'>
                      <RecapitulatifFrais fraisDossier={fraisDossierRecap} filiere={recapFiliere} />

                      <div className='grid gap-4 md:grid-cols-3'>
                        <div className='rounded-2xl border border-blue-100 bg-blue-50/50 p-4'>
                          <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white'>
                            <span className='text-lg'>💳</span>
                          </div>
                          <h3 className='font-semibold text-gray-900'>Frais de dossier</h3>
                          <p className='mt-1 text-xs text-gray-600'>
                            {dossierFeesPaid ? 'Paiement confirmé' : 'Paiement simulé'} —{' '}
                            {fraisDossierAffiche.toLocaleString('fr-FR')} FCFA
                          </p>
                          <button
                            type='button'
                            onClick={payDossierFees}
                            disabled={actionBusy || applicationDetail.status !== 'DRAFT'}
                            className='mt-4 w-full rounded-xl bg-blue-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            Payer (mock)
                          </button>
                        </div>

                        <div className='rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4'>
                          <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white'>
                            <span className='text-lg'>🏦</span>
                          </div>
                          <h3 className='font-semibold text-gray-900'>Quittance bancaire</h3>
                          <p className='mt-2 text-xs leading-relaxed text-indigo-900/80'>
                            Votre quittance bancaire sera demandée uniquement après acceptation de votre dossier.
                          </p>
                          <p className='mt-2 text-xs text-gray-500'>
                            Vous pourrez la déposer depuis{' '}
                            <Link to={ROUTES.parcours.mesInscriptions} className='font-semibold text-indigo-700 underline'>
                              Mes inscriptions académiques
                            </Link>
                            .
                          </p>
                        </div>

                        <div className='rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4'>
                          <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white'>
                            <span className='text-lg'>📄</span>
                          </div>
                          <h3 className='font-semibold text-gray-900'>Finalisation</h3>
                          <p className='mt-1 text-xs text-gray-600'>Génère votre fiche pour l&apos;école</p>
                          <button
                            type='button'
                            onClick={finalizeApplication}
                            disabled={actionBusy || applicationDetail.status !== 'READY_FOR_PREINSCRIPTION'}
                            className='mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            Finaliser mon dossier
                          </button>
                        </div>
                      </div>

                      <div className='rounded-2xl border border-gray-200 bg-gray-50/50 p-5'>
                        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                          <div>
                            <h3 className='font-bold text-gray-900'>Pièces requises</h3>
                            {requirements.length > 0 && (
                              <p className='mt-1 text-sm text-gray-500'>
                                {providedCount}/{requirements.length} pièce{requirements.length > 1 ? 's' : ''} complétée
                                {requirements.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <button
                            type='button'
                            onClick={() => applicationService.telechargerFiche(selectedApplicationId)}
                            className='rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50'
                          >
                            Télécharger la fiche
                          </button>
                        </div>

                        {requirements.length > 0 && (
                          <div className='mb-4 h-2 overflow-hidden rounded-full bg-gray-200'>
                            <div
                              className='h-full rounded-full bg-gradient-to-r from-blue-900 to-emerald-500 transition-all duration-500'
                              style={{ width: `${Math.round((providedCount / requirements.length) * 100)}%` }}
                            />
                          </div>
                        )}

                        {requirements.length === 0 && (
                          <p className='text-sm text-gray-500'>Aucune exigence configurée pour cet établissement.</p>
                        )}

                        {requirements.length > 0 && (
                          <div className='space-y-3'>
                            {requirements.map((req) => (
                              <div
                                key={req.code}
                                className={`rounded-xl border p-4 transition ${
                                  req.provided ? 'border-emerald-200 bg-emerald-50/60' : 'border-white bg-white shadow-sm'
                                }`}
                              >
                                <div className='flex flex-wrap items-start justify-between gap-2'>
                                  <div>
                                    <p className='text-sm font-semibold text-gray-900'>{req.label}</p>
                                    <p className='mt-1 text-xs text-gray-500'>
                                      {req.provided
                                        ? '✓ Fourni'
                                        : req.requirementType === 'PROFILE_FIELD'
                                          ? 'Attendu depuis votre profil'
                                          : 'Upload requis'}
                                    </p>
                                  </div>
                                  {req.provided && (
                                    <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800'>
                                      OK
                                    </span>
                                  )}
                                </div>
                                {req.requirementType === 'DOCUMENT_UPLOAD' && !req.provided && (
                                  <div className='mt-3 flex flex-wrap items-center gap-2'>
                                    <label className='cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:border-blue-300'>
                                      {uploadFiles[req.code]?.name || 'Choisir un fichier'}
                                      <input
                                        type='file'
                                        accept='application/pdf,image/png,image/jpeg'
                                        onChange={(e) =>
                                          setUploadFiles((prev) => ({ ...prev, [req.code]: e.target.files?.[0] || null }))
                                        }
                                        className='hidden'
                                      />
                                    </label>
                                    <button
                                      type='button'
                                      onClick={() => uploadRequiredDocument(req.code)}
                                      disabled={actionBusy || !uploadFiles[req.code]}
                                      className='rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50'
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
              </BentoCard>
            )}

            <BentoCard size='full' variant='solid' className='!min-h-0 !p-0 overflow-hidden !bg-white dark:!bg-white'>
              <div className='border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white px-6 py-5'>
                <h2 className='text-lg font-bold text-gray-900'>Réponse de l&apos;école</h2>
                <p className='mt-1 text-sm text-gray-500'>Décisions de l&apos;établissement sur votre dossier.</p>
              </div>

              <div className='p-6'>
                {preinError && (
                  <div className='mb-4'>
                    <AlertBanner type='error' onDismiss={() => setPreinError('')}>
                      {preinError}
                    </AlertBanner>
                  </div>
                )}
                {preinMessage && (
                  <div className='mb-4'>
                    <AlertBanner type='success' onDismiss={() => setPreinMessage('')}>
                      {preinMessage}
                    </AlertBanner>
                  </div>
                )}

                {loadingPreinscriptions && (
                  <div className='flex justify-center py-10'>
                    <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-orange-500' />
                  </div>
                )}

                {!loadingPreinscriptions && preinscriptions.length === 0 && (
                  <div className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center'>
                    <p className='text-sm font-medium text-gray-700'>Aucune réponse de l&apos;école pour le moment.</p>
                    <p className='mt-1 text-sm text-gray-500'>
                      Finalisez votre dossier pour recevoir une réponse de l&apos;école.
                    </p>
                  </div>
                )}

                {!loadingPreinscriptions && preinscriptions.length > 0 && (
                  <div className='grid gap-4 md:grid-cols-2'>
                    {preinscriptions.map((p) => {
                      const cardStyle = getStatusCardStyle(p.statut, 'preinscription');
                      const actionMessage = PREINSCRIPTION_ACTION_MESSAGES[p.statut];
                      const codesACorriger = getPiecesACorrigerCodes(p.piecesACorriger);
                      const bundle = correctionBundles[p.id];
                      const docs = bundle?.documents || [];
                      const docsByCode = Object.fromEntries(docs.map((d) => [d.code, d]));
                      const allTargetedProvided =
                        codesACorriger.length > 0 &&
                        codesACorriger.every((code) => docsByCode[code]?.status === 'PROVIDED');
                      const displayDocs =
                        docs.length > 0
                          ? docs.filter((d) => d.source !== 'PROFILE_AUTO')
                          : codesACorriger.map((code) => ({
                              code,
                              label: getPieceLabel(p.piecesACorriger, code),
                              status: 'A_CORRIGER',
                            }));

                      return (
                        <div
                          key={p.id}
                          className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md ${cardStyle.border}`}
                        >
                          <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                              <p className='font-bold text-gray-900'>{p.etablissement?.nom}</p>
                              <p className='mt-1 text-sm text-gray-600'>
                                {p.filiere?.nom} — {p.anneeAcademique}
                              </p>
                              <p className='mt-2 font-mono text-xs text-gray-400'>{p.numeroPreinscription}</p>
                            </div>
                            <StatusBadge status={p.statut} type='preinscription' badgeClass={cardStyle.badge} />
                          </div>

                          {actionMessage && (
                            <p className='mt-3 text-sm text-gray-700'>{actionMessage}</p>
                          )}

                          {p.statut === 'SOUS_RESERVE' && (
                            <div className='mt-4 space-y-3'>
                              <div className='rounded-xl border border-amber-200 bg-amber-50 p-4'>
                                <p className='text-sm font-semibold text-amber-900'>Conditions / motif</p>
                                <p className='mt-1 whitespace-pre-wrap text-sm text-amber-800'>
                                  {p.commentaireAdmin || 'Veuillez corriger les pièces indiquées ci-dessous.'}
                                </p>
                              </div>

                              <div>
                                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                                  Pièces du dossier
                                </p>
                                <ul className='space-y-3'>
                                  {displayDocs.map((doc) => {
                                    const targeted = codesACorriger.includes(doc.code);
                                    const fileKey = `${p.id}:${doc.code}`;
                                    const chosen = correctionFiles[fileKey];
                                    return (
                                      <li
                                        key={doc.id || doc.code}
                                        className={`rounded-xl border p-3 ${
                                          targeted ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100 bg-gray-50'
                                        }`}
                                      >
                                        <div className='flex flex-wrap items-start justify-between gap-2'>
                                          <div>
                                            <p className='text-sm font-medium text-gray-900'>
                                              {doc.label || doc.code}
                                            </p>
                                            <p className='text-xs text-gray-400 font-mono'>{doc.code}</p>
                                          </div>
                                          <div className='flex flex-wrap items-center gap-2'>
                                            {targeted && (
                                              <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900'>
                                                à corriger
                                              </span>
                                            )}
                                            <span className='rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200'>
                                              {doc.status || '—'}
                                            </span>
                                          </div>
                                        </div>

                                        {targeted ? (
                                          <div className='mt-3 flex flex-wrap items-center gap-2'>
                                            <label className='cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50'>
                                              {chosen ? chosen.name : 'Choisir un fichier'}
                                              <input
                                                type='file'
                                                accept='application/pdf,image/png,image/jpeg'
                                                className='hidden'
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0] || null;
                                                  setCorrectionFiles((prev) => ({ ...prev, [fileKey]: file }));
                                                }}
                                              />
                                            </label>
                                            <button
                                              type='button'
                                              onClick={() => uploadPieceCorrection(p.id, doc.code)}
                                              disabled={preinBusy || correctionBusyCode === doc.code || !chosen}
                                              className='rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50'
                                            >
                                              {correctionBusyCode === doc.code ? 'Envoi…' : 'Remplacer'}
                                            </button>
                                          </div>
                                        ) : (
                                          <p className='mt-2 text-xs text-gray-500'>
                                            Pièce verrouillée — non modifiable
                                          </p>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>

                              <button
                                type='button'
                                onClick={() => resoumettreDossier(p.id)}
                                disabled={preinBusy || !allTargetedProvided}
                                className='rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50'
                                title={
                                  !allTargetedProvided
                                    ? 'Corrigez toutes les pièces marquées « à corriger » avant de resoumettre'
                                    : undefined
                                }
                              >
                                Resoumettre le dossier
                              </button>
                              {!allTargetedProvided && (
                                <p className='text-xs text-amber-800'>
                                  Bouton actif uniquement lorsque toutes les pièces ciblées sont en statut PROVIDED.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </BentoCard>

            {!loadingInscriptionsAcad && inscriptionsAcad.length > 0 && (
              <div className='space-y-4'>
                <div>
                  <h2 className='text-lg font-bold text-gray-900'>Mes inscriptions</h2>
                  <p className='mt-1 text-sm text-gray-500'>
                    Vos inscriptions effectives dans les établissements privés.
                  </p>
                </div>
                <div className='space-y-4'>
                  {inscriptionsAcad.map((ins) => {
                    const badgeInfo = INSCRIPTION_ACAD_BADGES[ins.statut] || {
                      label: ins.statut,
                      className: 'bg-gray-100 text-gray-700',
                    };

                    return (
                      <BentoCard key={ins.id} className='p-5 !bg-white dark:!bg-white'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                          <div>
                            <h3 className='text-lg font-bold text-gray-900'>
                              {ins.etablissement?.nom || 'Établissement'}
                            </h3>
                            <p className='mt-0.5 text-sm text-gray-600'>{ins.filiere?.nom || 'Filière'}</p>
                            <p className='mt-1 text-xs text-gray-400'>
                              Année {ins.anneeAcademique} — Niveau L{ins.niveau}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeInfo.className}`}
                          >
                            {badgeInfo.label}
                          </span>
                        </div>

                        <div className='mt-4 space-y-3'>
                          {ins.statut === 'EN_ATTENTE_QUITTANCE' && (
                            <p className='rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900'>
                              Votre dossier a été accepté. Déposez votre quittance bancaire pour finaliser votre inscription.
                            </p>
                          )}

                          {['EN_COURS', 'EN_ATTENTE_QUITTANCE'].includes(ins.statut) && (
                            <button
                              type='button'
                              onClick={() => ouvrirUploadAcad(ins)}
                              className='rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800'
                            >
                              Soumettre ma quittance bancaire
                            </button>
                          )}

                          {ins.statut === 'QUITTANCE_SOUMISE' && (
                            <p className='rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800'>
                              Votre quittance est en cours de vérification par l&apos;établissement.
                            </p>
                          )}

                          {ins.statut === 'VALIDE' && ins.matricule && (
                            <div className='rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3'>
                              <p className='mb-1 text-xs font-medium text-green-700'>Votre matricule</p>
                              <p className='font-mono text-lg font-bold text-green-900'>{ins.matricule}</p>
                            </div>
                          )}
                        </div>
                      </BentoCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nouvelle' && (
          <BentoCard size='full' variant='solid' className='!min-h-0 !p-0 overflow-hidden !bg-white dark:!bg-white'>
            <div className='border-b border-gray-100 bg-gradient-to-r from-orange-50/80 to-white px-6 py-4'>
              <h2 className='text-lg font-bold text-gray-900'>Nouvelle demande</h2>
              <p className='mt-1 text-sm text-gray-500'>Choisissez l&apos;établissement et la filière visés.</p>
            </div>
            <form className='space-y-5 p-6' onSubmit={handleCreateApplication}>
              <div>
                <label htmlFor='etablissementId' className={labelClass}>
                  Établissement privé
                </label>
                <select
                  id='etablissementId'
                  name='etablissementId'
                  value={form.etablissementId}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value=''>Sélectionner…</option>
                  {etablissements.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor='filiereId' className={labelClass}>
                  Filière
                </label>
                <select
                  id='filiereId'
                  name='filiereId'
                  value={form.filiereId}
                  onChange={handleChange}
                  className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                  required
                  disabled={!form.etablissementId}
                >
                  <option value=''>Sélectionner…</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label htmlFor='anneeAcademique' className={labelClass}>
                    Année académique
                  </label>
                  <input
                    id='anneeAcademique'
                    name='anneeAcademique'
                    value={form.anneeAcademique}
                    onChange={handleChange}
                    placeholder='2025-2026'
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor='niveau' className={labelClass}>
                    Niveau
                  </label>
                  <select
                    id='niveau'
                    name='niveau'
                    value={form.niveau}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value=''>Sélectionner…</option>
                    {NIVEAUX.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <RecapitulatifFrais fraisDossier={fraisDossierPreview} filiere={recapFiliere} />

              <button
                type='submit'
                disabled={loadingCreate}
                className='w-full rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60'
              >
                {loadingCreate ? 'Création en cours…' : 'Créer un nouveau dossier'}
              </button>
            </form>
          </BentoCard>
        )}
      </div>

      {docModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl'>
            <div className='border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-4'>
              <h3 className='font-bold text-gray-900'>Document complémentaire</h3>
              <p className='mt-1 text-sm text-gray-500'>PDF ou image (PNG, JPEG)</p>
            </div>
            <div className='px-6 py-5'>
              <label className='flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center hover:border-blue-400'>
                <span className='text-3xl'>📎</span>
                <span className='mt-2 text-sm font-medium text-gray-700'>
                  {docFichier ? docFichier.name : 'Cliquez pour choisir un fichier'}
                </span>
                <input
                  type='file'
                  accept='application/pdf,image/png,image/jpeg'
                  onChange={(e) => setDocFichier(e.target.files?.[0] || null)}
                  className='hidden'
                />
              </label>
            </div>
            <div className='flex justify-end gap-3 border-t border-gray-100 px-6 py-4'>
              <button
                type='button'
                onClick={() => setDocModal({ open: false, preinscriptionId: null })}
                className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50'
              >
                Annuler
              </button>
              <button
                type='button'
                onClick={ajouterDocumentCompl}
                disabled={preinBusy || !docFichier}
                className='rounded-xl bg-blue-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60'
              >
                {preinBusy ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {acadUploadModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-in'>
            <div className='border-b border-gray-100 px-6 py-4'>
              <h3 className='font-semibold text-gray-900'>Soumettre ma quittance bancaire</h3>
              <p className='mt-1 text-xs text-gray-500'>{acadUploadModal.label}</p>
            </div>
            <div className='space-y-4 px-6 py-5'>
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Fichier PDF <span className='text-red-600'>*</span>
                </label>
                <input
                  type='file'
                  accept='application/pdf'
                  onChange={(e) => setAcadFichier(e.target.files?.[0] || null)}
                  className='w-full text-sm'
                />
              </div>
              {acadUploadError && <p className='text-sm text-red-600'>{acadUploadError}</p>}
              {acadUploadMessage && <p className='text-sm text-green-700'>{acadUploadMessage}</p>}
            </div>
            <div className='flex justify-end gap-3 border-t border-gray-100 px-6 py-4'>
              <button
                type='button'
                onClick={fermerUploadAcad}
                disabled={acadUploadBusy}
                className='rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50'
              >
                Annuler
              </button>
              <button
                type='button'
                onClick={soumettreQuittanceAcad}
                disabled={acadUploadBusy || !acadFichier}
                className='rounded-lg bg-blue-900 px-5 py-2 text-sm text-white transition hover:bg-blue-800 disabled:opacity-60'
              >
                {acadUploadBusy ? 'Envoi…' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CandidatLayout>
  );
}
