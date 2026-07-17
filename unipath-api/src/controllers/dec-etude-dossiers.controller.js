// src/controllers/dec-etude-dossiers.controller.js
const prisma = require('../prisma');
const { inscriptionsSontCloses } = require('../utils/periode-depot.helper');
const {
  etudeAEteLancee,
  etudeEstActive,
  etudeEstCloturee,
  whereDossierNonEtudie,
} = require('../utils/periode-etude-dossiers.helper');
const { notifierDecEtudeIncomplete } = require('../jobs/periode-etude-dossiers.job');
const { notifierDecSiEtudeIncomplete } = require('../utils/notif-etude-incomplete.helper');
const { getAnneeEnCours } = require('../utils/annee-academique.helper');

async function concoursEstAnneeEnCours(concours, anneeEnCours = null) {
  const enCours = anneeEnCours || (await getAnneeEnCours());
  if (!enCours) return false;
  if (concours.annee?.enCours === true) return true;
  return concours.anneeAcademiqueId === enCours.id;
}

async function buildEtudeStatus(concours, now = new Date(), anneeEnCours = null) {
  const totalDossiers = await prisma.dossierInscription.count({
    where: { inscription: { concoursId: concours.id } },
  });
  const dossiersNonEtudies = await prisma.dossierInscription.count({
    where: {
      inscription: { concoursId: concours.id },
      ...whereDossierNonEtudie(),
    },
  });
  const dossiersEtudies = totalDossiers - dossiersNonEtudies;
  const tousEtudies = dossiersNonEtudies === 0;

  const inscriptionsCloses = inscriptionsSontCloses(concours, now);
  const lancee = etudeAEteLancee(concours);
  const active = etudeEstActive(concours);
  const cloturee = etudeEstCloturee(concours);
  const anneeCourante = await concoursEstAnneeEnCours(concours, anneeEnCours);

  const peutRelancerEtude =
    anneeCourante && inscriptionsCloses && cloturee && !tousEtudies;
  const peutLancerEtude =
    anneeCourante && inscriptionsCloses && (!lancee || peutRelancerEtude);

  return {
    concoursId: concours.id,
    inscriptionsCloses,
    anneeEnCours: anneeCourante,
    periodeDefinied: lancee,
    periodeActive: active,
    periodeTerminee: cloturee,
    dateDebutEtudeDossiers: concours.dateDebutEtudeDossiers,
    dateFinEtudeDossiers: concours.dateFinEtudeDossiers,
    etudeDossiersClotureeAt: concours.etudeDossiersClotureeAt,
    totalDossiers,
    dossiersEtudies,
    dossiersNonEtudies,
    tousEtudies,
    /** Uniquement sur l'année académique en cours */
    peutLancerEtude,
    peutRelancerEtude,
    peutCloturerEtude: anneeCourante && active,
    /** Bouton temporaire de test : clôturer les inscriptions avant la date prévue */
    peutCloturerInscriptions: anneeCourante && !inscriptionsCloses,
    alerteEnvoyee: !!concours.etudeDossiersAlerteAt,
  };
}

exports.getEtudeStatuses = async (req, res) => {
  try {
    await notifierDecEtudeIncomplete().catch(() => {});

    const now = new Date();
    const { resolveFiltreAnneePourListe } = require('../utils/annee-academique.helper');
    const filtreAnnee = await resolveFiltreAnneePourListe({
      ...req,
      query: { ...req.query, anneeAcademiqueId: req.query.anneeAcademiqueId },
    });
    if (filtreAnnee.error) {
      return res.status(filtreAnnee.status || 400).json({ error: filtreAnnee.error });
    }

    const anneeEnCours = await getAnneeEnCours();
    const concoursList = await prisma.concours.findMany({
      where: filtreAnnee.where,
      select: {
        id: true,
        libelle: true,
        dateFinDepot: true,
        dateFin: true,
        dateDebutEtudeDossiers: true,
        dateFinEtudeDossiers: true,
        etudeDossiersClotureeAt: true,
        etudeDossiersAlerteAt: true,
        anneeAcademiqueId: true,
        annee: { select: { id: true, libelle: true, enCours: true } },
      },
    });

    const statuses = await Promise.all(
      concoursList.map((c) => buildEtudeStatus(c, now, anneeEnCours))
    );
    return res.json({
      message: 'Statuts étude dossiers récupérés',
      statuses: Object.fromEntries(statuses.map((s) => [s.concoursId, s])),
    });
  } catch (error) {
    console.error('Erreur getEtudeStatuses:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtudeStatus = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      include: { annee: { select: { id: true, libelle: true, enCours: true } } },
    });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }
    const status = await buildEtudeStatus(concours);
    return res.json({ message: 'Statut étude dossiers récupéré', status });
  } catch (error) {
    console.error('Erreur getEtudeStatus:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Lance immédiatement l'étude (sans période / sans modal). */
exports.lancerEtude = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const now = new Date();

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      include: { annee: { select: { id: true, libelle: true, enCours: true } } },
    });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    if (!(await concoursEstAnneeEnCours(concours))) {
      return res.status(400).json({
        error:
          "L'étude des dossiers ne peut être lancée que pour un concours de l'année académique en cours.",
        code: 'ANNEE_ARCHIVE',
      });
    }

    if (!inscriptionsSontCloses(concours, now)) {
      return res.status(400).json({
        error: "Impossible de lancer l'étude avant la clôture des inscriptions.",
      });
    }

    if (etudeEstActive(concours)) {
      return res.status(400).json({ error: "L'étude des dossiers est déjà en cours." });
    }

    // Relance après clôture : uniquement si des dossiers restent non étudiés
    if (etudeEstCloturee(concours)) {
      const restants = await prisma.dossierInscription.count({
        where: {
          inscription: { concoursId },
          ...whereDossierNonEtudie(),
        },
      });
      if (restants === 0) {
        return res.status(400).json({
          error: 'Tous les dossiers ont déjà été étudiés. Impossible de relancer.',
        });
      }
    }

    const updated = await prisma.concours.update({
      where: { id: concoursId },
      data: {
        dateDebutEtudeDossiers: now,
        dateFinEtudeDossiers: null,
        etudeDossiersClotureeAt: null,
        etudeDossiersAlerteAt: null,
      },
    });

    const status = await buildEtudeStatus(updated, now);
    return res.json({
      message: "Étude des dossiers lancée : les examinateurs et contrôleurs y ont accès.",
      concours: {
        id: updated.id,
        dateDebutEtudeDossiers: updated.dateDebutEtudeDossiers,
      },
      status,
    });
  } catch (error) {
    console.error('Erreur lancerEtude:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** @deprecated — redirige vers lancerEtude (compat). */
exports.setPeriodeEtude = async (req, res) => {
  return exports.lancerEtude(req, res);
};

/**
 * TEMPORAIRE (tests) — force la clôture des inscriptions en avançant dateFinDepot.
 * À retirer avant le déploiement en production.
 */
exports.cloturerInscriptionsTest = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const now = new Date();
    // 1 seconde dans le passé pour que inscriptionsSontCloses (now > dateFin) soit vrai
    const dateFinForcee = new Date(now.getTime() - 1000);

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      include: { annee: { select: { id: true, libelle: true, enCours: true } } },
    });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    if (!(await concoursEstAnneeEnCours(concours))) {
      return res.status(400).json({
        error: "Réservé aux concours de l'année académique en cours.",
        code: 'ANNEE_ARCHIVE',
      });
    }

    if (inscriptionsSontCloses(concours, now)) {
      return res.status(400).json({
        error: 'Les inscriptions sont déjà closes pour ce concours.',
        code: 'INSCRIPTIONS_DEJA_CLOSES',
      });
    }

    const updated = await prisma.concours.update({
      where: { id: concoursId },
      data: {
        dateFinDepot: dateFinForcee,
        dateFin: dateFinForcee,
      },
    });

    const status = await buildEtudeStatus(updated, now);
    return res.json({
      message:
        'Inscriptions clôturées (mode test). Vous pouvez maintenant lancer l’étude des dossiers.',
      concours: {
        id: updated.id,
        dateFinDepot: updated.dateFinDepot,
        dateFin: updated.dateFin,
      },
      status,
      _tempTest: true,
    });
  } catch (error) {
    console.error('Erreur cloturerInscriptionsTest:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Clôture manuelle de l'étude en cours. */
exports.cloturerEtude = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const now = new Date();

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      include: { annee: { select: { id: true, libelle: true, enCours: true } } },
    });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    if (!(await concoursEstAnneeEnCours(concours))) {
      return res.status(400).json({
        error:
          "L'étude des dossiers ne peut être clôturée que pour un concours de l'année académique en cours.",
        code: 'ANNEE_ARCHIVE',
      });
    }

    if (!etudeEstActive(concours)) {
      if (!etudeAEteLancee(concours)) {
        return res.status(400).json({ error: "L'étude n'a pas encore été lancée." });
      }
      return res.status(400).json({ error: "L'étude des dossiers est déjà clôturée." });
    }

    const updated = await prisma.concours.update({
      where: { id: concoursId },
      data: {
        etudeDossiersClotureeAt: now,
        dateFinEtudeDossiers: now,
        etudeDossiersAlerteAt: null,
      },
    });

    let alerte = {
      incomplete: false,
      dossiersNonEtudies: 0,
      totalDossiers: 0,
      notifications: 0,
    };
    try {
      alerte = await notifierDecSiEtudeIncomplete(updated);
    } catch (notifErr) {
      console.error('Erreur notification étude incomplète:', notifErr);
    }

    const refreshed = await prisma.concours.findUnique({ where: { id: concoursId } });
    const status = await buildEtudeStatus(refreshed || updated, now);

    return res.json({
      message: alerte.incomplete
        ? `Étude clôturée — ${alerte.dossiersNonEtudies} dossier(s) non examiné(s) sur ${alerte.totalDossiers}. Une notification a été envoyée à la DEC.`
        : 'Étude des dossiers clôturée',
      concours: {
        id: updated.id,
        etudeDossiersClotureeAt: updated.etudeDossiersClotureeAt,
      },
      status,
      alerte,
    });
  } catch (error) {
    console.error('Erreur cloturerEtude:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports.buildEtudeStatus = buildEtudeStatus;
