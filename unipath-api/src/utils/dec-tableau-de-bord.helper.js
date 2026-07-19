/**
 * Tableau de bord DEC — agrégats multi-concours avec filtres.
 */
const prisma = require('../prisma');
const { resolveFiltreAnneePourListe } = require('./annee-academique.helper');

const STATUT_DOSSIER_ORDER = [
  'EN_ATTENTE',
  'VALIDE_PAR_COMMISSION',
  'REJETE_PAR_COMMISSION',
  'SOUS_RESERVE_PAR_COMMISSION',
  'SOUS_RESERVE',
  'VALIDE',
  'REJETE',
];

const STATUT_DOSSIER_LABELS = {
  EN_ATTENTE: 'En attente',
  VALIDE_PAR_COMMISSION: 'Validé commission',
  REJETE_PAR_COMMISSION: 'Rejeté commission',
  SOUS_RESERVE_PAR_COMMISSION: 'Sous réserve commission',
  SOUS_RESERVE: 'Sous réserve',
  VALIDE: 'Validé (retenu)',
  REJETE: 'Rejeté',
};

const RESULTAT_LABELS = {
  EN_ATTENTE: 'En attente',
  ADMIS: 'Admis',
  REFUSE: 'Refusé',
};

function resolveSexe(raw) {
  const key = String(raw || '').trim().toUpperCase();
  if (key === 'M' || key === 'F') return key;
  return null;
}

function emptyStatutMap() {
  return Object.fromEntries(STATUT_DOSSIER_ORDER.map((k) => [k, 0]));
}

function emptyResultatMap() {
  return { EN_ATTENTE: 0, ADMIS: 0, REFUSE: 0 };
}

function emptySexeBucket() {
  return {
    inscrits: 0,
    dossiers: emptyStatutMap(),
    resultats: emptyResultatMap(),
  };
}

function statutEtude(concours, now = new Date()) {
  if (concours.etudeDossiersClotureeAt) return 'cloturee';
  if (concours.dateDebutEtudeDossiers && new Date(concours.dateDebutEtudeDossiers) <= now) {
    if (concours.dateFinEtudeDossiers && new Date(concours.dateFinEtudeDossiers) < now) {
      return 'terminee_non_cloturee';
    }
    return 'en_cours';
  }
  if (concours.dateDebutEtudeDossiers) return 'planifiee';
  return 'non_lancee';
}

function parseFilters(query = {}) {
  return {
    concoursId: query.concoursId ? String(query.concoursId).trim() : null,
    etablissement: query.etablissement ? String(query.etablissement).trim() : null,
    ville: query.ville ? String(query.ville).trim() : null,
    centreId: query.centreId ? String(query.centreId).trim() : null,
    sexe: resolveSexe(query.sexe),
  };
}

function matchesInscriptionFilters(insc, { ville, centreId, sexe }) {
  const centre = insc.dossierInscription?.centreChoisi?.centre || null;
  if (centreId) {
    const cid = insc.dossierInscription?.centreChoisi?.centreId || centre?.id;
    if (cid !== centreId) return false;
  }
  if (ville) {
    if (!centre || String(centre.ville || '').toLowerCase() !== ville.toLowerCase()) {
      return false;
    }
  }
  if (sexe) {
    if (String(insc.candidat?.sexe || '').toUpperCase() !== sexe) return false;
  }
  return true;
}

async function chargerOptionsFiltres(filtreAnneeWhere) {
  const [annees, concours] = await Promise.all([
    prisma.anneeAcademique.findMany({
      orderBy: { libelle: 'desc' },
      select: { id: true, libelle: true, enCoursDec: true, enCoursDges: true },
    }),
    prisma.concours.findMany({
      where: filtreAnneeWhere,
      select: {
        id: true,
        libelle: true,
        code: true,
        etablissement: true,
        centresActifs: {
          where: { estActif: true },
          select: {
            centreId: true,
            centre: { select: { id: true, nom: true, ville: true } },
          },
        },
      },
      orderBy: { libelle: 'asc' },
    }),
  ]);

  const etablissements = [...new Set(concours.map((c) => c.etablissement).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const centresMap = new Map();
  for (const c of concours) {
    for (const lien of c.centresActifs) {
      if (!lien.centre) continue;
      centresMap.set(lien.centre.id, {
        id: lien.centre.id,
        nom: lien.centre.nom,
        ville: lien.centre.ville,
      });
    }
  }
  const centres = [...centresMap.values()].sort((a, b) =>
    `${a.ville} ${a.nom}`.localeCompare(`${b.ville} ${b.nom}`, 'fr')
  );
  const villes = [...new Set(centres.map((c) => c.ville).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    annees,
    concours: concours.map((c) => ({
      id: c.id,
      libelle: c.libelle,
      code: c.code,
      etablissement: c.etablissement,
    })),
    etablissements,
    villes,
    centres,
    sexes: [
      { value: 'tous', label: 'Tous' },
      { value: 'M', label: 'Masculin' },
      { value: 'F', label: 'Féminin' },
    ],
  };
}

/**
 * Agrège le tableau de bord DEC selon les query params de la requête.
 */
async function chargerTableauDeBord(req) {
  const filtreAnnee = await resolveFiltreAnneePourListe(req);
  if (filtreAnnee.error) {
    return { ok: false, status: filtreAnnee.status || 400, error: filtreAnnee.error };
  }

  const filters = parseFilters(req.query || {});
  const options = await chargerOptionsFiltres(filtreAnnee.where);

  const concoursWhere = {
    ...filtreAnnee.where,
    ...(filters.concoursId ? { id: filters.concoursId } : {}),
    ...(filters.etablissement ? { etablissement: filters.etablissement } : {}),
  };

  const concoursList = await prisma.concours.findMany({
    where: concoursWhere,
    select: {
      id: true,
      libelle: true,
      code: true,
      etablissement: true,
      dateDebut: true,
      dateFin: true,
      dateDebutDepot: true,
      dateFinDepot: true,
      dateDebutEtudeDossiers: true,
      dateFinEtudeDossiers: true,
      etudeDossiersClotureeAt: true,
      dateDebutComposition: true,
      dateFinComposition: true,
      _count: { select: { affectationsCommission: true } },
      inscriptions: {
        select: {
          id: true,
          resultatComposition: true,
          numeroTable: true,
          candidat: { select: { sexe: true } },
          dossierInscription: {
            select: {
              statut: true,
              centreChoisi: {
                select: {
                  centreId: true,
                  centre: { select: { id: true, nom: true, ville: true } },
                },
              },
            },
          },
        },
      },
      centresActifs: {
        where: { estActif: true },
        select: {
          capacite: true,
          centreId: true,
          centre: { select: { id: true, nom: true, ville: true } },
          _count: { select: { dossiers: true } },
        },
      },
    },
    orderBy: [{ dateDebut: 'desc' }, { libelle: 'asc' }],
  });

  const now = new Date();
  const dossiersGlobaux = emptyStatutMap();
  const resultatsGlobaux = emptyResultatMap();
  const parSexe = {
    M: emptySexeBucket(),
    F: emptySexeBucket(),
    non_renseigne: emptySexeBucket(),
  };
  const etudeCounts = {
    non_lancee: 0,
    planifiee: 0,
    en_cours: 0,
    terminee_non_cloturee: 0,
    cloturee: 0,
  };

  let totalInscrits = 0;
  let totalRetenus = 0;
  let totalAvecCentre = 0;
  let totalAvecNumeroTable = 0;
  let concoursAvecCommission = 0;
  let concoursSansCommission = 0;
  let capaciteTotale = 0;
  let placesOccupeesCentres = 0;
  let centresActifs = 0;

  const parCentreMap = new Map();
  const parConcours = [];

  for (const concours of concoursList) {
    const etude = statutEtude(concours, now);
    etudeCounts[etude] = (etudeCounts[etude] || 0) + 1;

    if ((concours._count?.affectationsCommission || 0) > 0) concoursAvecCommission += 1;
    else concoursSansCommission += 1;

    for (const lien of concours.centresActifs) {
      if (filters.centreId && lien.centreId !== filters.centreId) continue;
      if (
        filters.ville
        && String(lien.centre?.ville || '').toLowerCase() !== filters.ville.toLowerCase()
      ) {
        continue;
      }
      centresActifs += 1;
      if (lien.capacite != null) capaciteTotale += Number(lien.capacite) || 0;
      placesOccupeesCentres += lien._count?.dossiers || 0;
    }

    const dossiers = emptyStatutMap();
    const resultats = emptyResultatMap();
    let inscrits = 0;
    let retenus = 0;
    let avecCentre = 0;
    let avecNumeroTable = 0;

    for (const insc of concours.inscriptions) {
      if (!matchesInscriptionFilters(insc, filters)) continue;

      inscrits += 1;
      totalInscrits += 1;

      const statut = insc.dossierInscription?.statut || 'EN_ATTENTE';
      if (Object.prototype.hasOwnProperty.call(dossiers, statut)) dossiers[statut] += 1;
      else dossiers.EN_ATTENTE += 1;
      if (Object.prototype.hasOwnProperty.call(dossiersGlobaux, statut)) {
        dossiersGlobaux[statut] += 1;
      } else {
        dossiersGlobaux.EN_ATTENTE += 1;
      }

      const centre = insc.dossierInscription?.centreChoisi?.centre || null;
      if (centre) {
        avecCentre += 1;
        totalAvecCentre += 1;
        const key = centre.id;
        if (!parCentreMap.has(key)) {
          parCentreMap.set(key, {
            centreId: centre.id,
            centreNom: centre.nom,
            ville: centre.ville,
            inscrits: 0,
            retenus: 0,
            admis: 0,
            refuses: 0,
            resultatEnAttente: 0,
          });
        }
        const bucket = parCentreMap.get(key);
        bucket.inscrits += 1;
        if (statut === 'VALIDE') bucket.retenus += 1;
      }

      if (insc.numeroTable) {
        avecNumeroTable += 1;
        totalAvecNumeroTable += 1;
      }

      const sx = String(insc.candidat?.sexe || '').toUpperCase();
      const sexeKey = sx === 'M' || sx === 'F' ? sx : 'non_renseigne';
      parSexe[sexeKey].inscrits += 1;
      if (Object.prototype.hasOwnProperty.call(parSexe[sexeKey].dossiers, statut)) {
        parSexe[sexeKey].dossiers[statut] += 1;
      }

      if (statut === 'VALIDE') {
        retenus += 1;
        totalRetenus += 1;
        const rc = insc.resultatComposition || 'EN_ATTENTE';
        if (Object.prototype.hasOwnProperty.call(resultats, rc)) resultats[rc] += 1;
        else resultats.EN_ATTENTE += 1;
        if (Object.prototype.hasOwnProperty.call(resultatsGlobaux, rc)) {
          resultatsGlobaux[rc] += 1;
        } else {
          resultatsGlobaux.EN_ATTENTE += 1;
        }
        if (Object.prototype.hasOwnProperty.call(parSexe[sexeKey].resultats, rc)) {
          parSexe[sexeKey].resultats[rc] += 1;
        }
        if (centre) {
          const bucket = parCentreMap.get(centre.id);
          if (rc === 'ADMIS') bucket.admis += 1;
          else if (rc === 'REFUSE') bucket.refuses += 1;
          else bucket.resultatEnAttente += 1;
        }
      }
    }

    const intermediaires =
      dossiers.EN_ATTENTE
      + dossiers.VALIDE_PAR_COMMISSION
      + dossiers.REJETE_PAR_COMMISSION
      + dossiers.SOUS_RESERVE_PAR_COMMISSION
      + dossiers.SOUS_RESERVE;

    const tauxValidation = inscrits > 0
      ? Math.round((dossiers.VALIDE / inscrits) * 10000) / 100
      : 0;
    const tauxAdmission = retenus > 0
      ? Math.round((resultats.ADMIS / retenus) * 10000) / 100
      : 0;

    parConcours.push({
      concoursId: concours.id,
      libelle: concours.libelle,
      code: concours.code,
      etablissement: concours.etablissement,
      dateDebut: concours.dateDebut,
      dateFin: concours.dateFin,
      etude,
      etudeLabel: {
        non_lancee: 'Non lancée',
        planifiee: 'Planifiée',
        en_cours: 'En cours',
        terminee_non_cloturee: 'Terminée (non clôturée)',
        cloturee: 'Clôturée',
      }[etude] || etude,
      commissionAffectee: (concours._count?.affectationsCommission || 0) > 0,
      nbAffectationsCommission: concours._count?.affectationsCommission || 0,
      inscrits,
      retenus,
      rejetes: dossiers.REJETE,
      intermediaires,
      dossiers,
      resultats,
      avecCentre,
      avecNumeroTable,
      tauxValidation,
      tauxAdmission,
    });
  }

  const parCentre = [...parCentreMap.values()].sort((a, b) =>
    `${a.ville} ${a.centreNom}`.localeCompare(`${b.ville} ${b.centreNom}`, 'fr')
  );

  const intermediairesGlobaux =
    dossiersGlobaux.EN_ATTENTE
    + dossiersGlobaux.VALIDE_PAR_COMMISSION
    + dossiersGlobaux.REJETE_PAR_COMMISSION
    + dossiersGlobaux.SOUS_RESERVE_PAR_COMMISSION
    + dossiersGlobaux.SOUS_RESERVE;

  const tauxValidationGlobal = totalInscrits > 0
    ? Math.round((dossiersGlobaux.VALIDE / totalInscrits) * 10000) / 100
    : 0;
  const tauxAdmissionGlobal = totalRetenus > 0
    ? Math.round((resultatsGlobaux.ADMIS / totalRetenus) * 10000) / 100
    : 0;

  return {
    ok: true,
    scope: {
      annee: filtreAnnee.annee
        ? {
            id: filtreAnnee.annee.id,
            libelle: filtreAnnee.annee.libelle,
            enCours: !!filtreAnnee.annee.enCoursDec,
          }
        : null,
      scope: filtreAnnee.scope,
    },
    filtres: {
      ...filters,
      anneeAcademiqueId: filtreAnnee.annee?.id || null,
      toutesAnnees: filtreAnnee.scope === 'all',
    },
    options,
    labels: {
      dossiers: STATUT_DOSSIER_LABELS,
      resultats: RESULTAT_LABELS,
    },
    kpis: {
      concours: concoursList.length,
      inscrits: totalInscrits,
      retenus: totalRetenus,
      rejetes: dossiersGlobaux.REJETE,
      intermediaires: intermediairesGlobaux,
      admis: resultatsGlobaux.ADMIS,
      refuses: resultatsGlobaux.REFUSE,
      resultatsEnAttente: resultatsGlobaux.EN_ATTENTE,
      avecCentre: totalAvecCentre,
      avecNumeroTable: totalAvecNumeroTable,
      tauxValidation: tauxValidationGlobal,
      tauxAdmission: tauxAdmissionGlobal,
      centresActifs,
      capaciteTotale,
      placesOccupeesCentres,
      placesRestantes:
        capaciteTotale > 0 ? Math.max(0, capaciteTotale - placesOccupeesCentres) : null,
      commission: {
        avecAffectation: concoursAvecCommission,
        sansAffectation: concoursSansCommission,
      },
      etude: etudeCounts,
    },
    dossiersParStatut: STATUT_DOSSIER_ORDER.map((key) => ({
      key,
      label: STATUT_DOSSIER_LABELS[key],
      value: dossiersGlobaux[key],
    })),
    resultatsComposition: [
      { key: 'ADMIS', label: RESULTAT_LABELS.ADMIS, value: resultatsGlobaux.ADMIS },
      { key: 'REFUSE', label: RESULTAT_LABELS.REFUSE, value: resultatsGlobaux.REFUSE },
      { key: 'EN_ATTENTE', label: RESULTAT_LABELS.EN_ATTENTE, value: resultatsGlobaux.EN_ATTENTE },
    ],
    parSexe: [
      {
        key: 'M',
        label: 'Masculin',
        ...parSexe.M,
        retenus: parSexe.M.dossiers.VALIDE,
        admis: parSexe.M.resultats.ADMIS,
        refuses: parSexe.M.resultats.REFUSE,
      },
      {
        key: 'F',
        label: 'Féminin',
        ...parSexe.F,
        retenus: parSexe.F.dossiers.VALIDE,
        admis: parSexe.F.resultats.ADMIS,
        refuses: parSexe.F.resultats.REFUSE,
      },
      {
        key: 'non_renseigne',
        label: 'Non renseigné',
        ...parSexe.non_renseigne,
        retenus: parSexe.non_renseigne.dossiers.VALIDE,
        admis: parSexe.non_renseigne.resultats.ADMIS,
        refuses: parSexe.non_renseigne.resultats.REFUSE,
      },
    ],
    parConcours,
    parCentre,
    genereAt: new Date().toISOString(),
  };
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function describeFiltres(payload) {
  const f = payload.filtres || {};
  const parts = [];
  if (payload.scope?.scope === 'all') parts.push('Toutes les années');
  else if (payload.scope?.annee?.libelle) parts.push(`Année ${payload.scope.annee.libelle}`);
  if (f.etablissement) parts.push(`Établissement : ${f.etablissement}`);
  if (f.concoursId) {
    const c = (payload.parConcours || []).find((x) => x.concoursId === f.concoursId)
      || (payload.options?.concours || []).find((x) => x.id === f.concoursId);
    parts.push(`Concours : ${c?.libelle || f.concoursId}`);
  }
  if (f.sexe === 'M') parts.push('Sexe : Masculin');
  if (f.sexe === 'F') parts.push('Sexe : Féminin');
  if (f.ville) parts.push(`Ville : ${f.ville}`);
  if (f.centreId) {
    const centre = (payload.parCentre || []).find((x) => x.centreId === f.centreId)
      || (payload.options?.centres || []).find((x) => x.id === f.centreId);
    parts.push(`Centre : ${centre?.centreNom || centre?.nom || f.centreId}`);
  }
  return parts.length ? parts.join('  ·  ') : 'Aucun filtre spécifique';
}

/**
 * Export Excel-compatible (CSV UTF-8 BOM, séparateur ;)
 */
function tableauDeBordToCsv(payload) {
  const lines = [];
  const pushSection = (title) => {
    lines.push('');
    lines.push(escapeCsv(`=== ${title} ===`));
  };
  const pushRow = (cells) => lines.push(cells.map(escapeCsv).join(';'));

  lines.push(escapeCsv('Tableau de bord DEC — statistiques'));
  lines.push(escapeCsv(`Filtres ;${describeFiltres(payload)}`));

  const k = payload.kpis || {};
  pushSection('Indicateurs globaux');
  pushRow(['Indicateur', 'Valeur']);
  pushRow(['Concours', k.concours ?? 0]);
  pushRow(['Inscrits', k.inscrits ?? 0]);
  pushRow(['Retenus (validés)', k.retenus ?? 0]);
  pushRow(['Rejetés', k.rejetes ?? 0]);
  pushRow(['Pipeline intermédiaire', k.intermediaires ?? 0]);
  pushRow(['Admis', k.admis ?? 0]);
  pushRow(['Refusés (sélection)', k.refuses ?? 0]);
  pushRow(['Décision en attente', k.resultatsEnAttente ?? 0]);
  pushRow(['Taux validation %', k.tauxValidation ?? 0]);
  pushRow(['Taux admission %', k.tauxAdmission ?? 0]);
  pushRow(['Centres actifs', k.centresActifs ?? 0]);
  pushRow(['Capacité totale', k.capaciteTotale ?? 0]);
  pushRow(['Places occupées', k.placesOccupeesCentres ?? 0]);
  pushRow(['Avec N° de table', k.avecNumeroTable ?? 0]);
  pushRow(['Avec centre choisi', k.avecCentre ?? 0]);
  pushRow(['Commission — avec affectation', k.commission?.avecAffectation ?? 0]);
  pushRow(['Commission — sans affectation', k.commission?.sansAffectation ?? 0]);

  pushSection('Étude des dossiers');
  pushRow(['Statut', 'Nombre de concours']);
  pushRow(['Non lancée', k.etude?.non_lancee ?? 0]);
  pushRow(['Planifiée', k.etude?.planifiee ?? 0]);
  pushRow(['En cours', k.etude?.en_cours ?? 0]);
  pushRow(['Terminée non clôturée', k.etude?.terminee_non_cloturee ?? 0]);
  pushRow(['Clôturée', k.etude?.cloturee ?? 0]);

  pushSection('Pipeline des dossiers');
  pushRow(['Statut', 'Nombre']);
  for (const row of payload.dossiersParStatut || []) {
    pushRow([row.label, row.value]);
  }

  pushSection('Résultats de sélection (retenus)');
  pushRow(['Décision', 'Nombre']);
  for (const row of payload.resultatsComposition || []) {
    pushRow([row.label, row.value]);
  }

  pushSection('Répartition par sexe');
  pushRow(['Sexe', 'Inscrits', 'Retenus', 'Admis', 'Refusés']);
  for (const row of payload.parSexe || []) {
    pushRow([row.label, row.inscrits, row.retenus, row.admis, row.refuses]);
  }

  pushSection('Détail par concours');
  pushRow([
    'Concours',
    'Code',
    'Établissement',
    'Étude',
    'Commission affectée',
    'Inscrits',
    'Retenus',
    'Rejetés',
    'Intermédiaires',
    'Admis',
    'Refusés',
    'Décision en attente',
    'Taux validation %',
    'Taux admission %',
  ]);
  for (const row of payload.parConcours || []) {
    pushRow([
      row.libelle,
      row.code || '',
      row.etablissement || '',
      row.etudeLabel || row.etude || '',
      row.commissionAffectee ? 'Oui' : 'Non',
      row.inscrits,
      row.retenus,
      row.rejetes,
      row.intermediaires,
      row.resultats?.ADMIS || 0,
      row.resultats?.REFUSE || 0,
      row.resultats?.EN_ATTENTE || 0,
      row.tauxValidation,
      row.tauxAdmission,
    ]);
  }

  pushSection('Répartition par centre');
  pushRow(['Ville', 'Centre', 'Inscrits', 'Retenus', 'Admis', 'Refusés', 'Décision en attente']);
  for (const row of payload.parCentre || []) {
    pushRow([
      row.ville || '',
      row.centreNom || '',
      row.inscrits,
      row.retenus,
      row.admis,
      row.refuses,
      row.resultatEnAttente,
    ]);
  }

  return `\uFEFF${lines.join('\n')}`;
}

module.exports = {
  chargerTableauDeBord,
  tableauDeBordToCsv,
  describeFiltres,
  STATUT_DOSSIER_LABELS,
  RESULTAT_LABELS,
};
