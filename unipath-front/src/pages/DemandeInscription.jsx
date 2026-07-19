// Gère le dépôt de dossier (Application) pour les établissements privés.
// Ne pas confondre avec le service inscriptionAcadService qui gère les inscriptions académiques effectives.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  applicationService,
  candidatService,
  dgesService,
  etablissementService,
  filiereService,
  inscriptionAcadService,
  preinscriptionEtablissementService,
} from '../services/api';
import { handleSessionError } from '../utils/auth';
import { getApplicationStatus, PREINSCRIPTION_STATUS } from '../utils/adminParcoursInscription';
import { labelNiveauEtude, NIVEAUX_ETUDE } from '../utils/niveaux-etude';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';
import { ROUTES } from '../constants/routes';

const NIVEAUX = NIVEAUX_ETUDE.map((n) => ({ value: String(n.value), label: n.label }));

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
        * Réglez les frais de dossier hors plateforme, puis déposez la quittance avec vos pièces
        (comme pour un concours). Les frais d&apos;inscription et de scolarité seront exigés après
        acceptation de votre dossier.
      </p>
    </div>
  );
}

const APPLICATION_ACTION_MESSAGES = {
  DRAFT: 'Déposez votre quittance et vos pièces, puis soumettez le dossier.',
  DOSSIER_FEES_PAID: 'Quittance reçue — complétez les pièces manquantes.',
  PENDING_DOCUMENTS: 'Votre dossier est incomplet — action de votre part requise.',
  READY_FOR_PREINSCRIPTION: 'Dossier complet — vous pouvez le soumettre à l\'école.',
  FICHE_GENERATED: 'Dossier soumis. En attente de réponse de l\'école.',
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
  ABANDONNE: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
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
    { label: 'Quittance', min: 1 },
    { label: 'Pièces', min: 2 },
    { label: 'Soumission', min: 4 },
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
  const etablissementLocked = Boolean(prefill.etablissementId);
  const filiereLocked = Boolean(prefill.filiereId);

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
  const [quittanceFichier, setQuittanceFichier] = useState(null);
  const [preinscriptions, setPreinscriptions] = useState([]);
  const [loadingPreinscriptions, setLoadingPreinscriptions] = useState(true);
  const [correctionById, setCorrectionById] = useState({});
  const [correctionBusyId, setCorrectionBusyId] = useState(null);
  const [pieceFiles, setPieceFiles] = useState({});
  const [preinBusy, setPreinBusy] = useState(false);
  const [preinMessage, setPreinMessage] = useState('');
  const [preinError, setPreinError] = useState('');

  const [inscriptionsAcad, setInscriptionsAcad] = useState([]);
  const [needsConfirmationChoice, setNeedsConfirmationChoice] = useState(false);
  const [loadingInscriptionsAcad, setLoadingInscriptionsAcad] = useState(true);
  const [confirmBusyId, setConfirmBusyId] = useState(null);
  const [acadUploadModal, setAcadUploadModal] = useState({ open: false, inscriptionId: null, label: '' });
  const [acadFichier, setAcadFichier] = useState(null);
  const [acadUploadBusy, setAcadUploadBusy] = useState(false);
  const [acadUploadMessage, setAcadUploadMessage] = useState('');
  const [acadUploadError, setAcadUploadError] = useState('');
  const [contrainteNiveau, setContrainteNiveau] = useState(null);
  const [niveauxAutorises, setNiveauxAutorises] = useState(() => NIVEAUX.map((n) => Number(n.value)));

  const [recapFiliere, setRecapFiliere] = useState(null);
  const [confirmedFraisDossier, setConfirmedFraisDossier] = useState(null);

  const [form, setForm] = useState({
    etablissementId: prefill.etablissementId || '',
    filiereId: prefill.filiereId || '',
    anneeAcademique: '',
    niveau: prefill.niveau || '',
    campagneFiliereId: prefill.campagneFiliereId || '',
  });

  useEffect(() => {
    dgesService
      .getAnneeEnCours()
      .then((data) => {
        const libelle = data?.annee?.libelle;
        if (libelle) {
          setForm((p) => (p.anneeAcademique === libelle ? p : { ...p, anneeAcademique: libelle }));
        }
      })
      .catch(() => {});
  }, []);

  // Reprendre le contexte si l'étudiant clique « Déposer un dossier » depuis une autre offre
  useEffect(() => {
    if (!prefill.etablissementId && !prefill.filiereId && !prefill.campagneFiliereId) return;
    setForm((p) => ({
      ...p,
      etablissementId: prefill.etablissementId || p.etablissementId,
      filiereId: prefill.filiereId || (prefill.etablissementId ? '' : p.filiereId),
      niveau: prefill.niveau || p.niveau,
      campagneFiliereId: prefill.campagneFiliereId || '',
      ...(prefill.anneeAcademique ? { anneeAcademique: prefill.anneeAcademique } : {}),
    }));
    setActiveTab('nouvelle');
  }, [
    prefill.etablissementId,
    prefill.filiereId,
    prefill.campagneFiliereId,
    prefill.niveau,
    prefill.anneeAcademique,
  ]);

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
        )
        || applicationDetail?.documents?.some(
          (d) => d.code === 'quittance_frais_dossier' && d.status === 'PROVIDED',
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

  const loadInscriptionsAcad = useCallback(async () => {
    setLoadingInscriptionsAcad(true);
    try {
      const data = await inscriptionAcadService.getMesInscriptions();
      setInscriptionsAcad(data.inscriptions || []);
      setNeedsConfirmationChoice(Boolean(data.needsConfirmationChoice));
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

  const loadCorrectionContext = useCallback(async (preinscriptionId) => {
    try {
      const data = await preinscriptionEtablissementService.getContexteCorrection(preinscriptionId);
      setCorrectionById((prev) => ({
        ...prev,
        [preinscriptionId]: {
          niveau: String(data.preinscription?.niveau || ''),
          pieces: data.pieces || [],
          motifDecision: data.preinscription?.motifDecision || '',
        },
      }));
    } catch (err) {
      setPreinError(err.message || 'Erreur chargement correction');
    }
  }, []);

  const loadPreinscriptions = useCallback(async () => {
    setLoadingPreinscriptions(true);
    try {
      const data = await preinscriptionEtablissementService.getMesPreinscriptions();
      const list = data.preinscriptions || [];
      setPreinscriptions(list);
      const sousReserve = list.filter((p) => p.statut === 'SOUS_RESERVE');
      await Promise.all(sousReserve.map((p) => loadCorrectionContext(p.id)));
    } catch (err) {
      setPreinError(err.message || 'Erreur chargement pré-inscriptions');
    } finally {
      setLoadingPreinscriptions(false);
    }
  }, [loadCorrectionContext]);

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

  useEffect(() => {
    if (!form.etablissementId || !form.filiereId) {
      setContrainteNiveau(null);
      setNiveauxAutorises(NIVEAUX.map((n) => Number(n.value)));
      return;
    }
    let cancelled = false;
    applicationService
      .getNiveauAutorise({
        filiereId: form.filiereId,
        etablissementId: form.etablissementId,
      })
      .then((data) => {
        if (cancelled) return;
        const autorises = (data.niveauxAutorises || []).map(Number);
        setContrainteNiveau(data.contrainte || null);
        setNiveauxAutorises(autorises.length ? autorises : NIVEAUX.map((n) => Number(n.value)));
        setForm((prev) => {
          const current = Number(prev.niveau);
          if (prev.niveau && autorises.length && !autorises.includes(current)) {
            return { ...prev, niveau: String(autorises[0]) };
          }
          return prev;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setContrainteNiveau(null);
        setNiveauxAutorises(NIVEAUX.map((n) => Number(n.value)));
      });
    return () => {
      cancelled = true;
    };
  }, [form.etablissementId, form.filiereId]);

  const niveauxDisponibles = useMemo(
    () => NIVEAUX.filter((n) => niveauxAutorises.includes(Number(n.value))),
    [niveauxAutorises]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'etablissementId' && etablissementLocked) return;
    if (name === 'filiereId' && filiereLocked) return;
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
      if (!form.anneeAcademique) {
        setError('Année académique en cours indisponible. Réessayez dans un instant.');
        setLoadingCreate(false);
        return;
      }
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
      navigate(location.pathname, { replace: true, state: {} });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoadingCreate(false);
    }
  };

  const uploadQuittanceFraisDossier = async () => {
    if (!selectedApplicationId || !quittanceFichier) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.uploadQuittanceFraisDossier(
        selectedApplicationId,
        quittanceFichier,
      );
      if (data.payment?.amount != null) {
        setConfirmedFraisDossier(data.payment.amount);
      }
      setQuittanceFichier(null);
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      setMessage(data.message || 'Quittance enregistrée');
    } catch (err) {
      setError(err.message || 'Erreur upload quittance');
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

  const soumettreDossier = async () => {
    if (!selectedApplicationId) return;
    try {
      setActionBusy(true);
      setError('');
      const data = await applicationService.finaliser(selectedApplicationId);
      await loadApplicationDetails(selectedApplicationId);
      await loadApplications(selectedApplicationId);
      await loadPreinscriptions();
      setMessage(data.message || 'Dossier soumis avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setActionBusy(false);
    }
  };

  const remplacerPieceSousReserve = async (preinscriptionId, code) => {
    const fileKey = `${preinscriptionId}:${code}`;
    const fichier = pieceFiles[fileKey];
    if (!fichier) return;
    try {
      setCorrectionBusyId(preinscriptionId);
      setPreinError('');
      setPreinMessage('');
      const data = await preinscriptionEtablissementService.remplacerPiece(preinscriptionId, code, fichier);
      setPieceFiles((prev) => ({ ...prev, [fileKey]: null }));
      setPreinMessage(data.message || 'Pièce remplacée');
      await loadCorrectionContext(preinscriptionId);
      await loadPreinscriptions();
    } catch (err) {
      setPreinError(err.message || 'Erreur remplacement pièce');
    } finally {
      setCorrectionBusyId(null);
    }
  };

  const modifierNiveauSousReserve = async (preinscriptionId) => {
    const ctx = correctionById[preinscriptionId];
    if (!ctx?.niveau) return;
    try {
      setCorrectionBusyId(preinscriptionId);
      setPreinError('');
      setPreinMessage('');
      const data = await preinscriptionEtablissementService.modifierNiveau(preinscriptionId, ctx.niveau);
      setPreinMessage(data.message || 'Niveau mis à jour');
      await loadCorrectionContext(preinscriptionId);
      await loadPreinscriptions();
    } catch (err) {
      setPreinError(err.message || 'Erreur modification niveau');
    } finally {
      setCorrectionBusyId(null);
    }
  };

  const resoumettreDossier = async (id) => {
    if (!window.confirm('Confirmer la resoumission de votre dossier après correction ?')) return;
    try {
      setPreinBusy(true);
      setPreinError('');
      setPreinMessage('');
      const data = await preinscriptionEtablissementService.resoumettre(id);
      setPreinMessage(data.message || 'Dossier resoumis');
      setCorrectionById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadPreinscriptions();
    } catch (err) {
      setPreinError(err.message || 'Erreur resoumission');
    } finally {
      setPreinBusy(false);
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

  const confirmerInscriptionAcad = async (inscription) => {
    if (!inscription?.id || !inscription.canConfirm) return;
    const label = `${inscription.etablissement?.nom || 'cet établissement'} — ${inscription.filiere?.nom || 'cette filière'}`;
    const ok = window.confirm(
      `Confirmer votre inscription à ${label} ?\n\nVos autres inscriptions validées pour l'année ${inscription.anneeAcademique} seront définitivement annulées.`
    );
    if (!ok) return;
    setConfirmBusyId(inscription.id);
    setError('');
    try {
      const data = await inscriptionAcadService.confirmer(inscription.id);
      setMessage(data.message || 'Inscription confirmée.');
      await loadInscriptionsAcad();
    } catch (err) {
      setError(err.message || 'Impossible de confirmer cette inscription');
    } finally {
      setConfirmBusyId(null);
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

                      <div className='grid gap-4 md:grid-cols-2'>
                        <div className='rounded-2xl border border-blue-100 bg-blue-50/50 p-4'>
                          <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white'>
                            <span className='text-lg'>🧾</span>
                          </div>
                          <h3 className='font-semibold text-gray-900'>Quittance frais de dossier</h3>
                          <p className='mt-1 text-xs text-gray-600'>
                            {dossierFeesPaid ? 'Quittance déposée' : 'À régler hors plateforme, puis déposer ici'} —{' '}
                            {fraisDossierAffiche.toLocaleString('fr-FR')} FCFA
                          </p>
                          {dossierFeesPaid ? (
                            <div className='mt-4 space-y-2'>
                              <p className='rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800'>
                                {applicationDetail.status === 'FICHE_GENERATED'
                                  ? '✓ Quittance enregistrée'
                                  : '✓ Quittance enregistrée — vous pouvez la remplacer si besoin'}
                              </p>
                              {applicationDetail.status !== 'FICHE_GENERATED' && (
                                <>
                                  <label className='block cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-blue-300'>
                                    {quittanceFichier?.name || 'Choisir un nouveau fichier'}
                                    <input
                                      type='file'
                                      accept='application/pdf,image/png,image/jpeg'
                                      onChange={(e) => setQuittanceFichier(e.target.files?.[0] || null)}
                                      className='hidden'
                                      disabled={actionBusy}
                                    />
                                  </label>
                                  <button
                                    type='button'
                                    onClick={uploadQuittanceFraisDossier}
                                    disabled={actionBusy || !quittanceFichier}
                                    className='w-full rounded-xl bg-blue-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
                                  >
                                    Remplacer la quittance
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className='mt-4 space-y-2'>
                              <label className='block cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-blue-300'>
                                {quittanceFichier?.name || 'Choisir PDF / image'}
                                <input
                                  type='file'
                                  accept='application/pdf,image/png,image/jpeg'
                                  onChange={(e) => setQuittanceFichier(e.target.files?.[0] || null)}
                                  className='hidden'
                                  disabled={actionBusy || applicationDetail.status === 'FICHE_GENERATED'}
                                />
                              </label>
                              <button
                                type='button'
                                onClick={uploadQuittanceFraisDossier}
                                disabled={
                                  actionBusy
                                  || !quittanceFichier
                                  || applicationDetail.status === 'FICHE_GENERATED'
                                }
                                className='w-full rounded-xl bg-blue-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50'
                              >
                                Déposer la quittance
                              </button>
                            </div>
                          )}
                        </div>

                        <div className='rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4'>
                          <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white'>
                            <span className='text-lg'>🏦</span>
                          </div>
                          <h3 className='font-semibold text-gray-900'>Quittance bancaire (après acceptation)</h3>
                          <p className='mt-2 text-xs leading-relaxed text-indigo-900/80'>
                            Les droits d&apos;inscription / scolarité se déposent uniquement après acceptation
                            de votre dossier, depuis{' '}
                            <Link to={ROUTES.parcours.mesInscriptions} className='font-semibold text-indigo-700 underline'>
                              Mes inscriptions académiques
                            </Link>
                            .
                          </p>
                        </div>
                      </div>

                      {['DRAFT', 'DOSSIER_FEES_PAID', 'PENDING_DOCUMENTS', 'READY_FOR_PREINSCRIPTION'].includes(
                        applicationDetail.status,
                      ) && (
                        <div className='rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4'>
                          <h3 className='font-semibold text-gray-900'>Soumettre mon dossier</h3>
                          <p className='mt-1 text-xs text-gray-600'>
                            Une fois la quittance et toutes les pièces déposées, soumettez votre dossier à l&apos;école
                            (comme pour un concours).
                          </p>
                          <button
                            type='button'
                            onClick={soumettreDossier}
                            disabled={actionBusy || applicationDetail.status !== 'READY_FOR_PREINSCRIPTION'}
                            className='mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            Soumettre mon dossier
                          </button>
                        </div>
                      )}

                      {applicationDetail.status === 'FICHE_GENERATED' && (
                        <div className='rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-950'>
                          <p className='font-semibold'>Dossier soumis avec succès.</p>
                          <p className='mt-1 text-xs text-blue-900/80'>
                            Votre fiche de préinscription est disponible. L&apos;école examine maintenant votre dossier.
                          </p>
                          <button
                            type='button'
                            onClick={() => applicationService.telechargerFiche(selectedApplicationId)}
                            className='mt-3 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50'
                          >
                            Télécharger la fiche
                          </button>
                        </div>
                      )}

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
                          {applicationDetail.status === 'FICHE_GENERATED' && (
                            <button
                              type='button'
                              onClick={() => applicationService.telechargerFiche(selectedApplicationId)}
                              className='rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50'
                            >
                              Télécharger la fiche
                            </button>
                          )}
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
                            {requirements.map((req) => {
                              const dossierLocked = applicationDetail.status === 'FICHE_GENERATED';
                              return (
                              <div
                                key={req.code}
                                className={`rounded-xl border p-4 transition ${
                                  req.provided ? 'border-emerald-200 bg-emerald-50/60' : 'border-white bg-white shadow-sm'
                                }`}
                              >
                                <div className='flex flex-wrap items-start justify-between gap-2'>
                                  <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-semibold text-gray-900'>{req.label}</p>
                                    <p className='mt-1 text-xs text-gray-500'>
                                      {req.provided
                                        ? (dossierLocked
                                          ? '✓ Fourni'
                                          : '✓ Fourni — vous pouvez le remplacer si besoin')
                                        : req.requirementType === 'PROFILE_FIELD'
                                          ? 'À fournir (dossier personnel ou dépôt ici)'
                                          : 'Upload requis'}
                                    </p>
                                  </div>
                                  {req.provided && (
                                    <span className='shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800'>
                                      OK
                                    </span>
                                  )}
                                </div>
                                {!dossierLocked && (
                                  <div className='mt-3 flex flex-wrap items-center gap-2'>
                                    <label className='cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-blue-300'>
                                      {uploadFiles[req.code]?.name
                                        || (req.provided ? 'Choisir un nouveau fichier' : 'Choisir un fichier')}
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
                                      {req.provided ? 'Remplacer' : 'Envoyer'}
                                    </button>
                                  </div>
                                )}
                                {dossierLocked && (
                                  <p className='mt-2 text-[11px] text-gray-400'>
                                    Dossier soumis : modification impossible ici. En cas de sous réserve, corrigez depuis la section réponses de l&apos;école.
                                  </p>
                                )}
                              </div>
                              );
                            })}
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
                            <div className='mt-4 space-y-4'>
                              <div className='rounded-xl border border-amber-200 bg-amber-50 p-4'>
                                <p className='text-sm font-semibold text-amber-900'>Action requise</p>
                                <p className='mt-1 whitespace-pre-wrap text-sm text-amber-800'>
                                  {correctionById[p.id]?.motifDecision
                                    || p.motifDecision
                                    || 'Veuillez corriger les pièces et/ou le niveau d\'étude, puis resoumettre.'}
                                </p>
                              </div>

                              <div>
                                <label className='mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500'>
                                  Niveau d&apos;étude
                                </label>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <select
                                    value={correctionById[p.id]?.niveau || String(p.niveau || '')}
                                    onChange={(e) =>
                                      setCorrectionById((prev) => ({
                                        ...prev,
                                        [p.id]: {
                                          ...(prev[p.id] || { pieces: [] }),
                                          niveau: e.target.value,
                                        },
                                      }))
                                    }
                                    className='rounded-lg border border-gray-300 px-3 py-2 text-sm'
                                  >
                                    {niveauxDisponibles.map((n) => (
                                      <option key={n.value} value={n.value}>
                                        {n.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type='button'
                                    onClick={() => modifierNiveauSousReserve(p.id)}
                                    disabled={correctionBusyId === p.id}
                                    className='rounded-lg border border-teal-800 px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60'
                                  >
                                    Enregistrer le niveau
                                  </button>
                                </div>
                                {contrainteNiveau?.constrained && contrainteNiveau?.message && (
                                  <p className='mt-2 text-xs text-blue-900'>{contrainteNiveau.message}</p>
                                )}
                                {Number(correctionById[p.id]?.niveau || p.niveau) > 1 && (
                                  <p className='mt-2 text-xs text-amber-800'>
                                    Au-delà de la 1ʳᵉ année, le relevé / bulletins de l&apos;année antérieure est obligatoire.
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                                  Vos pièces téléversées
                                </p>
                                <p className='mb-3 text-xs text-gray-500'>
                                  Consultez chaque fichier déposé et remplacez ceux qui doivent être corrigés.
                                </p>
                                <div className='space-y-3'>
                                  {(correctionById[p.id]?.pieces || []).map((piece) => {
                                    const fileKey = `${p.id}:${piece.code}`;
                                    const hasFile = Boolean(piece.document?.documentUrl);
                                    const docUrl = hasFile
                                      ? `/${String(piece.document.documentUrl).replace(/^\//, '')}`
                                      : null;
                                    return (
                                      <div
                                        key={piece.code}
                                        className={`rounded-xl border p-3 ${
                                          hasFile
                                            ? 'border-emerald-200 bg-emerald-50/40'
                                            : 'border-amber-200 bg-amber-50/40'
                                        }`}
                                      >
                                        <div className='flex flex-wrap items-start justify-between gap-2'>
                                          <div className='min-w-0 flex-1'>
                                            <p className='text-sm font-semibold text-gray-900'>{piece.label}</p>
                                            <p className='mt-0.5 text-xs text-gray-600'>
                                              {hasFile
                                                ? piece.document?.source === 'PROFILE_AUTO'
                                                  ? 'Issu du dossier personnel — vous pouvez le remplacer par un nouveau fichier'
                                                  : 'Fichier déjà téléversé'
                                                : 'Aucun fichier pour le moment — à fournir'}
                                            </p>
                                          </div>
                                          {docUrl && (
                                            <a
                                              href={docUrl}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50'
                                            >
                                              Voir le fichier
                                            </a>
                                          )}
                                        </div>
                                        <div className='mt-3 flex flex-wrap items-center gap-2'>
                                          <label className='cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-blue-400'>
                                            {pieceFiles[fileKey]?.name || (hasFile ? 'Choisir un nouveau fichier' : 'Choisir un fichier')}
                                            <input
                                              type='file'
                                              accept='application/pdf,image/png,image/jpeg'
                                              className='hidden'
                                              onChange={(e) =>
                                                setPieceFiles((prev) => ({
                                                  ...prev,
                                                  [fileKey]: e.target.files?.[0] || null,
                                                }))
                                              }
                                            />
                                          </label>
                                          <button
                                            type='button'
                                            onClick={() => remplacerPieceSousReserve(p.id, piece.code)}
                                            disabled={correctionBusyId === p.id || !pieceFiles[fileKey]}
                                            className='rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50'
                                          >
                                            {hasFile ? 'Remplacer' : 'Déposer'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {!correctionById[p.id]?.pieces?.length && (
                                    <p className='text-xs text-gray-500'>Chargement des pièces…</p>
                                  )}
                                </div>
                              </div>

                              <button
                                type='button'
                                onClick={() => resoumettreDossier(p.id)}
                                disabled={preinBusy || correctionBusyId === p.id}
                                className='rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60'
                              >
                                Resoumettre mon dossier
                              </button>
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

                {needsConfirmationChoice && (
                  <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950'>
                    Vous avez plusieurs dossiers validés. Choisissez <strong>une seule</strong> inscription
                    via le bouton <strong>Confirmé</strong> : les autres seront annulées.
                  </div>
                )}

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
                              Année {ins.anneeAcademique} — {labelNiveauEtude(ins.niveau)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeInfo.className}`}
                          >
                            {badgeInfo.label}
                          </span>
                        </div>

                        <div className='mt-4 space-y-3'>
                          {ins.canConfirm && (
                            <div className='rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-3 space-y-2'>
                              <p className='text-sm text-teal-950'>
                                Cette admission est en concurrence avec d&apos;autres. Confirmez-la pour
                                conserver uniquement cette inscription.
                              </p>
                              <button
                                type='button'
                                disabled={Boolean(confirmBusyId)}
                                onClick={() => confirmerInscriptionAcad(ins)}
                                className='rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50'
                              >
                                {confirmBusyId === ins.id ? 'Confirmation…' : 'Confirmé'}
                              </button>
                            </div>
                          )}

                          {ins.statut === 'ABANDONNE' && (
                            <p className='rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800'>
                              Inscription annulée suite au choix d&apos;une autre filière ou d&apos;un autre établissement.
                            </p>
                          )}

                          {ins.statut === 'EN_ATTENTE_QUITTANCE' && (
                            <p className='rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900'>
                              Votre dossier a été accepté. Déposez votre quittance bancaire pour finaliser votre inscription.
                            </p>
                          )}

                          {['EN_COURS', 'EN_ATTENTE_QUITTANCE'].includes(ins.statut) && !ins.canConfirm && (
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

                          {ins.confirmeeAt && ins.statut !== 'ABANDONNE' && (
                            <p className='text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2'>
                              Inscription confirmée — vos autres choix pour cette année ont été annulés.
                            </p>
                          )}

                          {ins.statut === 'VALIDE' && ins.matricule && (
                            <div className='rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3'>
                              <p className='mb-1 text-xs font-medium text-green-700'>Votre matricule</p>
                              <p className='font-mono text-lg font-bold text-green-900'>{ins.matricule}</p>
                            </div>
                          )}

                          {(ins.ficheInscriptionUrl || ['EN_COURS', 'VALIDE', 'EN_ATTENTE_QUITTANCE', 'QUITTANCE_SOUMISE'].includes(ins.statut)) && (
                            <button
                              type='button'
                              onClick={() => inscriptionAcadService.telechargerFicheInscription(ins.id)}
                              className='rounded-lg border border-teal-800 px-4 py-2 text-sm font-semibold text-teal-900 transition hover:bg-teal-50'
                            >
                              Télécharger ma fiche d&apos;inscription
                            </button>
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
              <p className='mt-1 text-sm text-gray-500'>
                {etablissementLocked || filiereLocked
                  ? 'Établissement et filière sont fixés selon l’offre choisie. Pour changer, déposez un dossier depuis une autre offre.'
                  : 'Choisissez l’établissement et la filière visés.'}
              </p>
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
                  className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-700`}
                  required
                  disabled={etablissementLocked}
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
                  className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-700 disabled:opacity-100`}
                  required
                  disabled={!form.etablissementId || filiereLocked}
                >
                  <option value=''>Sélectionner…</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom} ({f.code})
                    </option>
                  ))}
                </select>
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
                  {niveauxDisponibles.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                {contrainteNiveau?.constrained && contrainteNiveau?.message && (
                  <p className='mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900'>
                    {contrainteNiveau.message}
                  </p>
                )}
                {Number(form.niveau) > 1 && (
                  <p className='mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                    Pour une inscription au-delà de la 1ʳᵉ année, vous devrez fournir le relevé de notes
                    ou les bulletins de l&apos;année antérieure dans votre dossier.
                  </p>
                )}
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
