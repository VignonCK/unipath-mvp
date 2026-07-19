import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { filiereService, validationUeService } from '../../services/api';
import { getUser } from '../../utils/auth';
import {
  ANNEES_ETUDE_UE,
  anneesEtudeForFiliere,
  hintAnneesEtudeFiliere,
  codeSemestre,
  labelSemestre,
} from '../../utils/semestres-etude';
import { labelNiveauEtude } from '../../utils/niveaux-etude';

function PctBar({ value }) {
  if (value == null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 100 ? 'bg-green-500' : clamped >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
        <span>{value} %</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  if (statut === 'VALIDE') {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        Validé
      </span>
    );
  }
  if (statut === 'NON_VALIDE') {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        Non validé
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
      Non renseigné
    </span>
  );
}

function DecisionBadge({ statut, modeDecision }) {
  if (statut === 'VALIDE') {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
        Passant{modeDecision === 'AUTO_PASSANT' ? ' (auto)' : ''}
      </span>
    );
  }
  if (statut === 'REDOUBLANT') {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        Redoublant{modeDecision === 'AUTO_REDOUBLANT' ? ' (auto)' : ''}
      </span>
    );
  }
  if (modeDecision === 'MANUEL') {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
        À trancher
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      En cours
    </span>
  );
}

export default function BilanValidationsAdmin() {
  const user = getUser();
  const [vue, setVue] = useState('annee'); // 'semestre' | 'annee' — décision passant/redoublant en premier
  const [filieres, setFilieres] = useState([]);
  const [filiereId, setFiliereId] = useState('');
  const [anneeEtude, setAnneeEtude] = useState(1);
  const [semestre, setSemestre] = useState(1);
  const [etudiants, setEtudiants] = useState([]);
  const [meta, setMeta] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filiereActive = useMemo(
    () => filieres.find((f) => f.id === filiereId) || null,
    [filieres, filiereId]
  );

  const anneesDisponibles = useMemo(() => {
    if (filiereActive) return anneesEtudeForFiliere(filiereActive);
    return ANNEES_ETUDE_UE;
  }, [filiereActive]);

  const semestresAnnee = useMemo(() => {
    const found = anneesDisponibles.find((a) => a.value === Number(anneeEtude))
      || ANNEES_ETUDE_UE.find((a) => a.value === Number(anneeEtude));
    return found?.semestres || [1, 2];
  }, [anneeEtude, anneesDisponibles]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      const list = data.filieres || [];
      setFilieres(list);
      if (list.length && !filiereId) {
        setFiliereId(list[0].id);
        const annees = anneesEtudeForFiliere(list[0]);
        if (annees[0]) {
          setAnneeEtude(annees[0].value);
          if (annees[0].semestres?.[0]) setSemestre(annees[0].semestres[0]);
        }
      }
    });
  }, [user?.etablissementId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!anneesDisponibles.length) return;
    if (!anneesDisponibles.some((a) => a.value === Number(anneeEtude))) {
      const first = anneesDisponibles[0];
      setAnneeEtude(first.value);
      if (first.semestres?.[0]) setSemestre(first.semestres[0]);
    }
  }, [anneesDisponibles, anneeEtude]);

  useEffect(() => {
    if (!semestresAnnee.includes(Number(semestre))) {
      setSemestre(semestresAnnee[0]);
    }
  }, [semestresAnnee, semestre]);

  const charger = useCallback(async () => {
    if (!filiereId || !anneeEtude) {
      setEtudiants([]);
      setMeta(null);
      return;
    }
    if (vue === 'semestre' && !semestresAnnee.includes(Number(semestre))) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setExpandedId(null);
    try {
      const data = vue === 'annee'
        ? await validationUeService.listerBilanAnnee({ filiereId, anneeEtude })
        : await validationUeService.listerBilan({ filiereId, anneeEtude, semestre });
      setEtudiants(data.etudiants || []);
      setMeta(data);
      if (vue === 'annee' && data.autoUpdates?.length) {
        setSuccess(
          `${data.autoUpdates.length} décision(s) automatique(s) appliquée(s) (passant / redoublant).`
        );
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger le bilan');
      setEtudiants([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [filiereId, anneeEtude, semestre, semestresAnnee, vue]);

  useEffect(() => {
    charger();
  }, [charger]);

  const decider = async (inscriptionId, decision) => {
    setBusyId(inscriptionId);
    setError('');
    setSuccess('');
    try {
      const data = await validationUeService.deciderPassage({ inscriptionId, decision });
      setSuccess(data.message || 'Décision enregistrée');
      await charger();
    } catch (err) {
      setError(err.message || 'Décision impossible');
    } finally {
      setBusyId(null);
    }
  };

  const totaux = meta?.catalogue?.totaux;
  const [sImpair, sPair] = semestresAnnee;

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bilan des validations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ici vous déclarez chaque étudiant <strong>Passant</strong> ou <strong>Redoublant</strong>
            selon le % d&apos;UE validées sur toute l&apos;année.
          </p>
        </div>

        {vue === 'annee' && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-950 space-y-1">
            <p className="font-semibold">Comment déclarer le verdict ?</p>
            <ul className="list-disc pl-5 text-teal-900/90 space-y-0.5">
              <li>Choisissez la filière et l&apos;année d&apos;étude ci-dessous.</li>
              <li>
                <strong>&lt; 60 % UE</strong> → Redoublant automatique (pas de bouton).
              </li>
              <li>
                <strong>100 % UE</strong> → Passant automatique (pas de bouton).
              </li>
              <li>
                <strong>Entre 60 % et 100 %</strong> → boutons verts / rouges :
                cliquez <strong>Passant</strong> ou <strong>Redoublant</strong>.
              </li>
              <li>
                <strong>Passant</strong> → inscrit l&apos;année suivante au <em>niveau suivant</em>
                (même filière).
              </li>
              <li>
                <strong>Redoublant</strong> → inscrit l&apos;année suivante au <em>même niveau</em>
                (même filière).
              </li>
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <BentoCard className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVue('annee')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                vue === 'annee'
                  ? 'bg-teal-900 text-white border-teal-900'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              Passant / Redoublant
            </button>
            <button
              type="button"
              onClick={() => setVue('semestre')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                vue === 'semestre'
                  ? 'bg-teal-900 text-white border-teal-900'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              Détail par semestre
            </button>
          </div>

          <div className={`grid gap-4 sm:grid-cols-2 ${vue === 'semestre' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
              <select
                value={filiereId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setFiliereId(nextId);
                  const nextFiliere = filieres.find((f) => f.id === nextId);
                  if (nextFiliere) {
                    const annees = anneesEtudeForFiliere(nextFiliere);
                    if (annees[0]) {
                      setAnneeEtude(annees[0].value);
                      if (annees[0].semestres?.[0]) setSemestre(annees[0].semestres[0]);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {filieres.length === 0 && <option value="">Aucune filière</option>}
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année d&apos;étude</label>
              <select
                value={anneeEtude}
                onChange={(e) => {
                  const nextAnnee = Number(e.target.value);
                  setAnneeEtude(nextAnnee);
                  const found = anneesDisponibles.find((a) => a.value === nextAnnee)
                    || ANNEES_ETUDE_UE.find((a) => a.value === nextAnnee);
                  if (found?.semestres?.[0]) setSemestre(found.semestres[0]);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {anneesDisponibles.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {filiereActive && (
                <p className="text-[11px] text-gray-400 mt-1">{hintAnneesEtudeFiliere(filiereActive)}</p>
              )}
            </div>
            {vue === 'semestre' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Semestre</label>
                <div className="flex gap-2">
                  {semestresAnnee.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemestre(s)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        Number(semestre) === s
                          ? 'bg-teal-900 text-white border-teal-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-teal-700'
                      }`}
                    >
                      {codeSemestre(s)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{labelSemestre(semestre)}</p>
              </div>
            )}
          </div>

          {meta?.anneeAcademiqueEnCours && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                Année DGES : {meta.anneeAcademiqueEnCours}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                {labelNiveauEtude(anneeEtude)}
                {vue === 'semestre' ? ` · ${codeSemestre(semestre)}` : ` · ${codeSemestre(sImpair)}–${codeSemestre(sPair)}`}
              </span>
              {totaux && (
                <span className="rounded-full bg-teal-50 px-2.5 py-1 font-semibold text-teal-900">
                  Catalogue : {totaux.ue} UE · {totaux.credits} crédits
                </span>
              )}
              {vue === 'semestre' && meta.stats?.moyennePourcentageUe != null && (
                <span className="rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-800">
                  Moyenne UE : {meta.stats.moyennePourcentageUe} %
                </span>
              )}
              {vue === 'annee' && meta.stats && (
                <>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-800">
                    {meta.stats.passants} passant{meta.stats.passants !== 1 ? 's' : ''}
                  </span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-800">
                    {meta.stats.redoublants} redoublant{meta.stats.redoublants !== 1 ? 's' : ''}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
                    {meta.stats.aTrancher} à trancher
                  </span>
                </>
              )}
            </div>
          )}
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : !filiereId ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Sélectionnez une filière pour afficher le bilan.
            </p>
          ) : !totaux?.ue ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Aucune UE au catalogue pour cette période. Définissez-les d&apos;abord
              dans Unités d&apos;enseignement.
            </p>
          ) : etudiants.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Aucun étudiant inscrit en {labelNiveauEtude(anneeEtude)} pour cette filière
              sur l&apos;année académique en cours.
            </p>
          ) : vue === 'annee' ? (
            <div className="divide-y divide-gray-100">
              {etudiants.map((e) => {
                const pctS1 = e.semestres?.[sImpair]?.pourcentageUe;
                const pctS2 = e.semestres?.[sPair]?.pourcentageUe;
                const busy = busyId === e.inscriptionId;
                const peutChoisir = e.modeDecision === 'MANUEL';
                const motifAuto =
                  e.modeDecision === 'AUTO_REDOUBLANT'
                    ? `Moins de 60 % d'UE validées (${e.pourcentageUe ?? 0} %) → Redoublant automatique`
                    : e.modeDecision === 'AUTO_PASSANT'
                      ? `100 % d'UE validées → Passant automatique`
                      : e.modeDecision === 'INDETERMINE'
                        ? 'Pourcentage UE indisponible (catalogue manquant)'
                        : `Entre 60 % et 100 % (${e.pourcentageUe ?? 0} %) → choisissez le verdict ci-dessous`;

                return (
                  <div key={e.inscriptionId} className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {e.candidat?.prenom} {e.candidat?.nom}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {e.candidat?.matricule || '—'} · {e.valides.ue}/{e.totaux.ue} UE validées
                        </div>
                        <div className="mt-2">
                          <DecisionBadge statut={e.statut} modeDecision={e.modeDecision} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 max-w-xl">{motifAuto}</p>
                        {e.suiteAnneeSuivante?.anneeAcademique && (
                          <p className="text-xs text-teal-800 mt-1 font-medium">
                            → Inscrit en {e.suiteAnneeSuivante.anneeAcademique}
                            {' '}({labelNiveauEtude(e.suiteAnneeSuivante.niveau)})
                            {e.suiteAnneeSuivante.motif === 'redoublement'
                              ? ' — même niveau (redoublement)'
                              : ' — niveau suivant'}
                          </p>
                        )}
                        {e.suiteAnneeSuivante?.motif === 'fin_de_cycle' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Fin de cycle : pas d&apos;inscription sur l&apos;année suivante.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-[220px]">
                        {peutChoisir ? (
                          <>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 text-right">
                              Choisir le verdict
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => decider(e.inscriptionId, 'PASSANT')}
                                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${
                                  e.statut === 'VALIDE'
                                    ? 'bg-green-700 ring-2 ring-green-300'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                Passant
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => decider(e.inscriptionId, 'REDOUBLANT')}
                                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${
                                  e.statut === 'REDOUBLANT'
                                    ? 'bg-red-700 ring-2 ring-red-300'
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                              >
                                Redoublant
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 sm:text-right py-2">
                            Verdict automatique — aucun choix à faire
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 max-w-lg">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase">{codeSemestre(sImpair)}</p>
                        <PctBar value={pctS1} />
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase">{codeSemestre(sPair)}</p>
                        <PctBar value={pctS2} />
                      </div>
                      <div className="rounded-lg bg-teal-50 px-3 py-2">
                        <p className="text-[10px] font-semibold text-teal-800 uppercase">Année</p>
                        <PctBar value={e.pourcentageUe} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Étudiant</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Matricule</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Validées</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Non validées</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">En attente</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">% crédits</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">% UE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((e) => {
                    const open = expandedId === e.inscriptionId;
                    return (
                      <Fragment key={e.inscriptionId}>
                        <tr
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => setExpandedId(open ? null : e.inscriptionId)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {e.candidat?.prenom} {e.candidat?.nom}
                            </div>
                            <div className="text-xs text-gray-400">{e.candidat?.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{e.candidat?.matricule || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {e.valides.ue}/{e.totaux.ue} UE
                            <span className="text-gray-400"> · </span>
                            {e.valides.credits}/{e.totaux.credits} cr.
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {e.nonValides.ue} UE · {e.nonValides.credits} cr.
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {e.nonRenseignes.ue} UE · {e.nonRenseignes.credits} cr.
                          </td>
                          <td className="px-4 py-3">
                            <PctBar value={e.pourcentageCredits} />
                          </td>
                          <td className="px-4 py-3">
                            <PctBar value={e.pourcentageUe} />
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-gray-50/80">
                            <td colSpan={7} className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Détail des UE — {codeSemestre(semestre)}
                              </p>
                              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Code</th>
                                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Libellé</th>
                                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Crédits</th>
                                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Statut</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {(e.unites || []).map((u) => (
                                      <tr key={u.uniteId}>
                                        <td className="px-3 py-2 font-mono">{u.code}</td>
                                        <td className="px-3 py-2">{u.libelle}</td>
                                        <td className="px-3 py-2">{u.credits}</td>
                                        <td className="px-3 py-2">
                                          <StatutBadge statut={u.statut} />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
