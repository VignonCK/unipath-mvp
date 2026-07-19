import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import {
  applicationService,
  preinscriptionEtablissementService,
  filiereService,
  dgesService,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import ParcoursInscriptionGuide from '../../components/admin-etablissement/ParcoursInscriptionGuide';
import { BentoCard } from '../../components/AcademicLayout';
import {
  getCandidatureDisplayStatus,
  needsPreinscriptionDecision,
  isVerdictLocked,
  PREINSCRIPTION_STATUS,
} from '../../utils/adminParcoursInscription';
import { buildUnifiedPieces } from '../../utils/application-pieces';
import { NIVEAUX_ETUDE, codeNiveauEtude } from '../../utils/niveaux-etude';

const EMPTY_FILTERS = {
  filiere: '',
  annee: '',
  niveau: '',
  sexe: '',
  statut: '',
};

function normalizeSexe(sexe) {
  const s = String(sexe || '').trim().toUpperCase();
  if (s === 'M' || s === 'H' || s === 'MASCULIN') return 'M';
  if (s === 'F' || s === 'FEMININ' || s === 'FÉMININ') return 'F';
  return '';
}

function applyLocalFilters(list, filters) {
  return (list || []).filter((app) => {
    if (filters.filiere && app.filiereId !== filters.filiere && app.filiere?.id !== filters.filiere) {
      return false;
    }
    if (filters.annee && String(app.anneeAcademique) !== String(filters.annee)) {
      return false;
    }
    if (filters.niveau !== '' && filters.niveau != null) {
      const niveau = app.preinscription?.niveau ?? app.niveau;
      if (Number(niveau) !== Number(filters.niveau)) return false;
    }
    if (filters.sexe === 'M' || filters.sexe === 'F') {
      if (normalizeSexe(app.candidat?.sexe) !== filters.sexe) return false;
    }
    if (filters.statut) {
      if (String(app.preinscription?.statut || '') !== filters.statut) return false;
    }
    return true;
  });
}

function buildExportParams(filters) {
  const params = {};
  if (filters.filiere) params.filiere = filters.filiere;
  if (filters.annee) params.annee = filters.annee;
  if (filters.niveau !== '' && filters.niveau != null) params.niveau = filters.niveau;
  if (filters.sexe) params.sexe = filters.sexe;
  if (filters.statut) params.statut = filters.statut;
  return params;
}

export default function CandidaturesAdmin() {
  const user = getUser();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [anneeEnCoursLibelle, setAnneeEnCoursLibelle] = useState('');
  const [anneesReady, setAnneesReady] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => ({ ...EMPTY_FILTERS }));
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...EMPTY_FILTERS }));
  const [exportReady, setExportReady] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detailById, setDetailById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [sousReserveModal, setSousReserveModal] = useState({
    open: false,
    preinscriptionId: null,
    applicationId: null,
    commentaire: '',
  });

  const refreshExportReadiness = useCallback(async (annee) => {
    try {
      const data = await applicationService.getExportReadiness(
        annee ? { annee } : {}
      );
      setExportReady(Boolean(data.exportReady));
      setExportMessage(data.message || '');
    } catch {
      setExportReady(false);
      setExportMessage('Impossible de vérifier la disponibilité des exports.');
    }
  }, []);

  const charger = useCallback((filtersToUse) => {
    setLoading(true);
    setError('');
    applicationService
      .getDemandesEtablissement()
      .then((appsData) => {
        const raw = appsData.applications || [];
        setApplications(raw);
        setFilteredApplications(applyLocalFilters(raw, filtersToUse || appliedFilters));
      })
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [appliedFilters]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieres(data.filieres || []);
    });
  }, [user?.etablissementId]);

  useEffect(() => {
    let cancelled = false;
    dgesService
      .listerAnneesAcademiques()
      .then((data) => {
        if (cancelled) return;
        const list = data.annees || [];
        const enCours =
          data.anneeEnCours?.libelle
          || list.find((a) => a.enCours)?.libelle
          || '';
        setAnnees(list);
        setAnneeEnCoursLibelle(enCours);
        const withAnnee = { ...EMPTY_FILTERS, annee: enCours };
        setDraftFilters({ ...withAnnee });
        setAppliedFilters({ ...withAnnee });
        setAnneesReady(true);
        charger(withAnnee);
        refreshExportReadiness(enCours || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les années académiques');
          setAnneesReady(true);
          charger(EMPTY_FILTERS);
          refreshExportReadiness(null);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount / etab change
  }, [user?.etablissementId]);

  const pendingCount = useMemo(
    () => applications.filter((app) => needsPreinscriptionDecision(app)).length,
    [applications]
  );

  const appliquerFiltres = () => {
    const next = { ...draftFilters };
    setAppliedFilters(next);
    setFilteredApplications(applyLocalFilters(applications, next));
    refreshExportReadiness(next.annee || null);
  };

  const reinitialiserFiltres = () => {
    const reset = { ...EMPTY_FILTERS, annee: anneeEnCoursLibelle || '' };
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setFilteredApplications(applyLocalFilters(applications, reset));
    refreshExportReadiness(reset.annee || null);
  };

  const loadDetail = async (applicationId) => {
    if (detailById[applicationId]?.application) return;
    setDetailLoadingId(applicationId);
    try {
      const data = await applicationService.getById(applicationId);
      setDetailById((prev) => ({
        ...prev,
        [applicationId]: {
          application: data.application,
          completion: data.completion || null,
        },
      }));
    } catch (err) {
      setError(err.message || 'Impossible de charger le dossier');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const toggleExpand = async (applicationId) => {
    if (expandedId === applicationId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(applicationId);
    await loadDetail(applicationId);
  };

  const decider = async (preinscriptionId, applicationId, statut, extra = {}) => {
    if (!preinscriptionId) {
      setError('Aucune pré-inscription liée à ce dossier.');
      return;
    }
    const app = applications.find((a) => a.id === applicationId);
    const currentStatut = app?.preinscription?.statut
      || detailById[applicationId]?.application?.preinscription?.statut;
    if (currentStatut && currentStatut !== 'EN_ATTENTE') {
      setError(
        currentStatut === 'SOUS_RESERVE'
          ? 'Dossier sous réserve : attendez la resoumission du candidat avant un nouveau verdict.'
          : 'Cette décision est définitive et ne peut plus être modifiée.'
      );
      return;
    }
    setError('');
    setSuccess('');
    setDecisionBusyId(preinscriptionId);
    try {
      await preinscriptionEtablissementService.decider(preinscriptionId, { statut, ...extra });
      if (statut === 'VALIDE') {
        setSuccess('Candidat validé — il apparaîtra dans la liste Étudiants.');
      } else if (statut === 'SOUS_RESERVE') {
        setSuccess('Décision enregistrée : sous réserve. Le candidat a été notifié.');
      } else {
        setSuccess('Dossier rejeté.');
      }
      setDetailById((prev) => {
        const next = { ...prev };
        delete next[applicationId];
        return next;
      });
      setExpandedId(null);
      charger(appliedFilters);
      refreshExportReadiness(appliedFilters.annee || null);
    } catch (err) {
      setError(err.message || 'Décision impossible');
    } finally {
      setDecisionBusyId(null);
    }
  };

  const demanderRejet = async (preinscriptionId, applicationId) => {
    const motifDecision = window.prompt('Motif du rejet :', '') || '';
    if (!motifDecision.trim()) return;
    await decider(preinscriptionId, applicationId, 'REJETE', {
      motifDecision: motifDecision.trim(),
    });
  };

  const confirmerSousReserve = async () => {
    if (!sousReserveModal.commentaire.trim() || !sousReserveModal.preinscriptionId) return;
    await decider(
      sousReserveModal.preinscriptionId,
      sousReserveModal.applicationId,
      'SOUS_RESERVE',
      { motifDecision: sousReserveModal.commentaire.trim() }
    );
    setSousReserveModal({ open: false, preinscriptionId: null, applicationId: null, commentaire: '' });
  };

  const openPiece = (url) => {
    if (!url) {
      setError('Fichier introuvable pour cette pièce.');
      return;
    }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      setError('Le navigateur a bloqué l\'ouverture du fichier. Autorisez les pop-ups.');
    }
  };

  const genererPdf = async () => {
    if (!exportReady) return;
    setExportingPdf(true);
    setError('');
    try {
      await applicationService.telechargerExportPdf(buildExportParams(appliedFilters));
    } catch (err) {
      setError(err.message || 'Échec de la génération PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const genererExcel = async () => {
    if (!exportReady) return;
    setExportingExcel(true);
    setError('');
    try {
      await applicationService.telechargerExportExcel(buildExportParams(appliedFilters));
    } catch (err) {
      setError(err.message || 'Échec de la génération Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Candidatures</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez les pièces du dossier et donnez votre verdict (valider, sous réserve ou rejeter) sans changer de page.
          </p>
        </div>

        <ParcoursInscriptionGuide active="candidatures" pendingCount={pendingCount} />

        {pendingCount > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <strong>{pendingCount}</strong> dossier{pendingCount > 1 ? 's' : ''} en attente de décision —
            ouvrez le dossier ci-dessous pour consulter les pièces puis décider.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <BentoCard className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
              <select
                value={draftFilters.filiere}
                onChange={(e) => setDraftFilters((p) => ({ ...p, filiere: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Toutes</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année académique</label>
              <select
                value={draftFilters.annee}
                onChange={(e) => setDraftFilters((p) => ({ ...p, annee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                disabled={annees.length === 0 && !anneesReady}
              >
                <option value="">Toutes</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.libelle}>
                    {a.libelle}
                    {a.enCours || a.libelle === anneeEnCoursLibelle ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Niveau d&apos;étude</label>
              <select
                value={draftFilters.niveau}
                onChange={(e) => setDraftFilters((p) => ({ ...p, niveau: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tous</option>
                {NIVEAUX_ETUDE.map((n) => (
                  <option key={n.value} value={String(n.value)}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sexe</label>
              <select
                value={draftFilters.sexe}
                onChange={(e) => setDraftFilters((p) => ({ ...p, sexe: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tous</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Décision</label>
              <select
                value={draftFilters.statut}
                onChange={(e) => setDraftFilters((p) => ({ ...p, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Toutes</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDE">Validée</option>
                <option value="SOUS_RESERVE">Sous réserve</option>
                <option value="REJETE">Rejetée</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={appliquerFiltres}
              disabled={loading || !anneesReady}
              className="rounded-lg bg-teal-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Appliquer les filtres
            </button>
            <button
              type="button"
              onClick={reinitialiserFiltres}
              disabled={loading || !anneesReady}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Réinitialiser
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={genererPdf}
                disabled={!exportReady || exportingPdf || exportingExcel}
                title={exportReady ? 'Générer le PDF selon les filtres appliqués' : exportMessage}
                className="rounded-lg border border-teal-800 bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exportingPdf ? 'Génération…' : 'Générer PDF'}
              </button>
              <button
                type="button"
                onClick={genererExcel}
                disabled={!exportReady || exportingPdf || exportingExcel}
                title={exportReady ? 'Générer Excel selon les filtres appliqués' : exportMessage}
                className="rounded-lg bg-teal-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {exportingExcel ? 'Génération…' : 'Générer Excel'}
              </button>
            </div>
          </div>

          {!exportReady && exportMessage && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {exportMessage}
            </p>
          )}
          {exportReady && (
            <p className="text-xs text-gray-500">
              {exportMessage?.includes('antérieure')
                ? exportMessage
                : 'Exports activés : le PDF et l\'Excel respectent les filtres actuellement appliqués'}
              {' '}
              ({filteredApplications.length} dossier{filteredApplications.length !== 1 ? 's' : ''}).
            </p>
          )}
        </BentoCard>

        {loading || !anneesReady ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">
            {applications.length === 0
              ? 'Aucune candidature pour le moment.'
              : 'Aucune candidature ne correspond aux filtres.'}
          </BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">N° demande</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Candidat</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Avancement</th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((app) => {
                    const statusInfo = getCandidatureDisplayStatus(app);
                    const awaitingDecision = needsPreinscriptionDecision(app);
                    const verdictLocked = isVerdictLocked(app);
                    const prein = app.preinscription;
                    const preinInfo = prein?.statut ? PREINSCRIPTION_STATUS[prein.statut] : null;
                    const isExpanded = expandedId === app.id;
                    const detail = detailById[app.id];
                    const pieces = detail?.application
                      ? buildUnifiedPieces(detail.application)
                      : [];
                    const preinscriptionId = prein?.id || detail?.application?.preinscription?.id;
                    const decisionBusy = decisionBusyId === preinscriptionId;

                    return (
                      <Fragment key={app.id}>
                        <tr className={isExpanded ? 'bg-teal-50/40' : 'hover:bg-gray-50/50'}>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {app.numeroApplication}
                            {prein?.numeroPreinscription && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                Pré-insc. {prein.numeroPreinscription}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>{app.candidat?.prenom} {app.candidat?.nom}</div>
                            <div className="text-xs text-gray-500">{app.candidat?.email}</div>
                          </td>
                          <td className="px-6 py-4">{app.filiere?.nom || '—'}</td>
                          <td className="px-6 py-4">
                            {app.anneeAcademique}
                            {(prein?.niveau != null || app.niveau != null) && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {codeNiveauEtude(prein?.niveau ?? app.niveau)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
                              {statusInfo.label}
                            </span>
                            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">{statusInfo.hint}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => toggleExpand(app.id)}
                              className="px-3 py-1.5 text-xs font-semibold border border-teal-200 text-teal-900 rounded-lg hover:bg-teal-50"
                            >
                              {isExpanded ? 'Masquer' : awaitingDecision ? 'Voir & décider' : 'Voir le dossier'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={6} className="px-6 py-5">
                              {detailLoadingId === app.id || !detail ? (
                                <div className="flex justify-center py-8">
                                  <div className="w-8 h-8 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
                                </div>
                              ) : (
                                <div className="space-y-5 max-w-3xl">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {detail.application.candidat?.prenom}{' '}
                                        {detail.application.candidat?.nom}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {detail.application.candidat?.email}
                                        {detail.application.candidat?.telephone
                                          ? ` · ${detail.application.candidat.telephone}`
                                          : ''}
                                      </p>
                                      {detail.completion && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Complétude :{' '}
                                          <strong>
                                            {detail.completion.percentage
                                              ?? detail.completion.pourcentage
                                              ?? (detail.completion.isComplete ? 100 : 0)}
                                            %
                                          </strong>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Pièces du dossier</h3>
                                    {pieces.length === 0 ? (
                                      <p className="text-xs text-gray-400">Aucune pièce enregistrée.</p>
                                    ) : (
                                      <ul className="space-y-2 rounded-xl border border-gray-100 bg-white p-3">
                                        {pieces.map((piece) => (
                                          <li
                                            key={piece.key}
                                            className="flex items-center justify-between gap-3 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                                          >
                                            <span className="text-gray-700">{piece.label}</span>
                                            {piece.openUrl ? (
                                              <button
                                                type="button"
                                                onClick={() => openPiece(piece.openUrl)}
                                                className="text-teal-800 font-semibold text-xs hover:underline"
                                              >
                                                Consulter
                                              </button>
                                            ) : (
                                              <span className="text-xs text-gray-400">
                                                {piece.status === 'PROVIDED'
                                                  ? 'Fichier non disponible'
                                                  : (piece.status || 'Manquant')}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  {awaitingDecision && preinscriptionId ? (
                                    <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 space-y-3">
                                      <p className="text-sm font-semibold text-orange-950">
                                        Décision d&apos;admission
                                      </p>
                                      <p className="text-xs text-orange-800">
                                        Valider crée l&apos;inscription académique et envoie la fiche au candidat.
                                        Une fois rendue, la décision ne pourra plus être modifiée
                                        (sauf nouveau passage en attente après sous réserve).
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          disabled={decisionBusy}
                                          onClick={() => decider(preinscriptionId, app.id, 'VALIDE')}
                                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                          Valider
                                        </button>
                                        <button
                                          type="button"
                                          disabled={decisionBusy}
                                          onClick={() =>
                                            setSousReserveModal({
                                              open: true,
                                              preinscriptionId,
                                              applicationId: app.id,
                                              commentaire: '',
                                            })
                                          }
                                          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                                        >
                                          Sous réserve
                                        </button>
                                        <button
                                          type="button"
                                          disabled={decisionBusy}
                                          onClick={() => demanderRejet(preinscriptionId, app.id)}
                                          className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                        >
                                          Rejeter
                                        </button>
                                      </div>
                                    </div>
                                  ) : verdictLocked ? (
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
                                      <p className="text-sm font-semibold text-gray-900">
                                        Verdict : {preinInfo?.label || prein?.statut}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {prein?.statut === 'SOUS_RESERVE'
                                          ? 'En attente des corrections du candidat. Vous pourrez redonner un verdict uniquement après sa resoumission.'
                                          : 'Cette décision est définitive et ne peut plus être modifiée.'}
                                      </p>
                                      {prein?.motifDecision && (
                                        <p className="text-xs text-gray-600 mt-2">
                                          Motif : {prein.motifDecision}
                                        </p>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>

      {sousReserveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Accepter sous réserve</h3>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message au candidat <span className="text-red-600">*</span>
              </label>
              <textarea
                value={sousReserveModal.commentaire}
                onChange={(e) =>
                  setSousReserveModal((m) => ({ ...m, commentaire: e.target.value }))
                }
                placeholder="Indiquez les compléments attendus du candidat…"
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Ce message sera envoyé au candidat par email.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() =>
                  setSousReserveModal({
                    open: false,
                    preinscriptionId: null,
                    applicationId: null,
                    commentaire: '',
                  })
                }
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSousReserve}
                disabled={!sousReserveModal.commentaire.trim() || Boolean(decisionBusyId)}
                className="text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminEtablissementLayout>
  );
}
