const prisma = require('../prisma');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const fs = require('fs');
const path = require('path');
const { runInBackground } = require('../utils/background-task');

const getEtablissementLogoRelativePath = (etablissementId) => {
  if (!etablissementId) return '';
  const logoDir = path.join(__dirname, '../../uploads/etablissements');
  if (!fs.existsSync(logoDir)) return '';

  const file = fs.readdirSync(logoDir).find((name) => name.startsWith(`logo-${etablissementId}.`));
  if (!file) return '';
  return `uploads/etablissements/${file}`;
};

const calculerMoyenneGeneralePonderee = (notes) => {
  const notesValides = notes.filter((n) => typeof n.noteMoyenne === 'number' && n.credits > 0);
  const totalCredits = notesValides.reduce((sum, n) => sum + n.credits, 0);
  if (!totalCredits) return { moyenneGenerale: null, totalCredits: 0 };

  const totalPondere = notesValides.reduce((sum, n) => sum + (n.noteMoyenne * n.credits), 0);
  return {
    moyenneGenerale: Number((totalPondere / totalCredits).toFixed(2)),
    totalCredits,
  };
};

const construireReleve = (inscriptions) => {
  return inscriptions.map((inscription) => {
    const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes);
    return {
      inscriptionId: inscription.id,
      anneeAcademique: inscription.anneeAcademique,
      niveau: inscription.niveau,
      statut: inscription.statut,
      filiere: inscription.filiere.nom,
      etablissement: inscription.etablissement.nom,
      notes: inscription.notes,
      moyenneGenerale,
      totalCredits,
    };
  });
};

const calculerMoyenneGlobale = (releve) => {
  const lignesValides = releve.filter((ligne) => typeof ligne.moyenneGenerale === 'number' && ligne.totalCredits > 0);
  const totalCredits = lignesValides.reduce((sum, ligne) => sum + ligne.totalCredits, 0);
  if (!totalCredits) return null;
  const totalPondere = lignesValides.reduce((sum, ligne) => sum + (ligne.moyenneGenerale * ligne.totalCredits), 0);
  return Number((totalPondere / totalCredits).toFixed(2));
};

function labelStatutInscription(statut) {
  if (statut === 'VALIDE') return 'Passant';
  if (statut === 'REDOUBLANT') return 'Redoublant';
  if (statut === 'EN_COURS') return 'En cours';
  if (statut === 'ABANDONNE') return 'Abandonné';
  return statut || '—';
}

function roundPct(num, den) {
  if (!den || den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function bilanSemestreCredits(unites, validationsByUeId) {
  const totauxUe = unites.length;
  const totauxCredits = unites.reduce((sum, u) => sum + (Number(u.credits) || 0), 0);
  let validesUe = 0;
  let validesCredits = 0;

  for (const u of unites) {
    if (validationsByUeId.get(u.id) === 'VALIDE') {
      validesUe += 1;
      validesCredits += Number(u.credits) || 0;
    }
  }

  return {
    totaux: { ue: totauxUe, credits: totauxCredits },
    valides: { ue: validesUe, credits: validesCredits },
    pourcentageCredits: roundPct(validesCredits, totauxCredits),
    pourcentageUe: roundPct(validesUe, totauxUe),
  };
}

async function buildParcoursForCandidat(candidatId, etablissementIdFilter = null) {
  const inscriptions = await prisma.inscriptionAcademique.findMany({
    where: {
      candidatId,
      ...(etablissementIdFilter ? { etablissementId: etablissementIdFilter } : {}),
    },
    include: {
      filiere: { select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true } },
      etablissement: { select: { id: true, nom: true, ville: true, type: true } },
      notes: {
        orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
      },
      validationsUE: {
        select: {
          id: true,
          statut: true,
          uniteEnseignementId: true,
          uniteEnseignement: {
            select: {
              id: true,
              code: true,
              libelle: true,
              credits: true,
              semestre: true,
              anneeEtude: true,
            },
          },
        },
      },
    },
    orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
  });

  const filiereIds = [...new Set(inscriptions.map((i) => i.filiereId).filter(Boolean))];
  const catalogue = filiereIds.length
    ? await prisma.uniteEnseignement.findMany({
        where: { filiereId: { in: filiereIds } },
        select: {
          id: true,
          filiereId: true,
          credits: true,
          semestre: true,
          anneeEtude: true,
          code: true,
          libelle: true,
        },
        orderBy: [{ semestre: 'asc' }, { ordre: 'asc' }, { code: 'asc' }],
      })
    : [];

  const catalogueByKey = new Map();
  for (const u of catalogue) {
    const key = `${u.filiereId}:${u.anneeEtude}:${u.semestre}`;
    if (!catalogueByKey.has(key)) catalogueByKey.set(key, []);
    catalogueByKey.get(key).push(u);
  }

  return inscriptions.map((inscription) => {
    const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes || []);
    const validations = inscription.validationsUE || [];
    const ueValidees = validations.filter((v) => v.statut === 'VALIDE').length;
    const ueNonValidees = validations.filter((v) => v.statut === 'NON_VALIDE').length;

    const validationsByUeId = new Map(
      validations.map((v) => [v.uniteEnseignementId || v.uniteEnseignement?.id, v.statut])
    );

    const niveau = Number(inscription.niveau) || 1;
    const semestreImpair = 2 * niveau - 1;
    const semestrePair = 2 * niveau;
    const unitesS1 = catalogueByKey.get(`${inscription.filiereId}:${niveau}:${semestreImpair}`) || [];
    const unitesS2 = catalogueByKey.get(`${inscription.filiereId}:${niveau}:${semestrePair}`) || [];
    const bilanS1 = bilanSemestreCredits(unitesS1, validationsByUeId);
    const bilanS2 = bilanSemestreCredits(unitesS2, validationsByUeId);

    const totauxAnneeCredits = bilanS1.totaux.credits + bilanS2.totaux.credits;
    const validesAnneeCredits = bilanS1.valides.credits + bilanS2.valides.credits;
    const totauxAnneeUe = bilanS1.totaux.ue + bilanS2.totaux.ue;
    const validesAnneeUe = bilanS1.valides.ue + bilanS2.valides.ue;

    return {
      id: inscription.id,
      anneeAcademique: inscription.anneeAcademique,
      niveau: inscription.niveau,
      statut: inscription.statut,
      statutLabel: labelStatutInscription(inscription.statut),
      confirmeeAt: inscription.confirmeeAt,
      createdAt: inscription.createdAt,
      filiere: inscription.filiere,
      etablissement: inscription.etablissement,
      moyenneGenerale,
      totalCredits,
      notesCount: (inscription.notes || []).length,
      bilansSemestre: {
        [semestreImpair]: { semestre: semestreImpair, label: `S${semestreImpair}`, ...bilanS1 },
        [semestrePair]: { semestre: semestrePair, label: `S${semestrePair}`, ...bilanS2 },
      },
      bilansAnnee: {
        totaux: { ue: totauxAnneeUe, credits: totauxAnneeCredits },
        valides: { ue: validesAnneeUe, credits: validesAnneeCredits },
        pourcentageCredits: roundPct(validesAnneeCredits, totauxAnneeCredits),
        pourcentageUe: roundPct(validesAnneeUe, totauxAnneeUe),
      },
      validationsUE: {
        total: validations.length,
        valides: ueValidees,
        nonValides: ueNonValidees,
        details: validations.map((v) => ({
          statut: v.statut,
          code: v.uniteEnseignement?.code,
          libelle: v.uniteEnseignement?.libelle,
          credits: v.uniteEnseignement?.credits,
          semestre: v.uniteEnseignement?.semestre,
        })),
      },
    };
  });
}

exports.getMonParcours = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const parcours = inscriptions.map((inscription) => {
      const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes);
      return {
        ...inscription,
        moyenneGenerale,
        totalCredits,
      };
    });

    return res.json({
      message: 'Parcours recupere avec succes',
      parcours,
    });
  } catch (error) {
    console.error('Erreur getMonParcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Consultation du parcours académique par matricule (admin établissement + DGES).
 * Périmètre national : toutes les inscriptions de l'étudiant.
 * GET ?matricule=
 */
exports.getParcoursByMatricule = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!['DGES', 'ADMIN_ETABLISSEMENT', 'ETABLISSEMENT'].includes(role)) {
      return res.status(403).json({ error: 'Acces non autorise' });
    }

    const matricule = String(req.query.matricule || '').trim();
    if (!matricule) {
      return res.status(400).json({ error: 'matricule est requis' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { matricule },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        sexe: true,
        nationalite: true,
        dateNaiss: true,
        lieuNaiss: true,
      },
    });

    if (!candidat) {
      return res.status(404).json({ error: `Aucun etudiant trouve pour le matricule ${matricule}` });
    }

    // Admin établissement et DGES : parcours national (tous établissements)
    const parcours = await buildParcoursForCandidat(candidat.id, null);

    return res.json({
      message: 'Parcours recupere avec succes',
      perimetre: 'national',
      candidat,
      parcours,
      stats: {
        totalInscriptions: parcours.length,
        passants: parcours.filter((p) => p.statut === 'VALIDE').length,
        redoublants: parcours.filter((p) => p.statut === 'REDOUBLANT').length,
        enCours: parcours.filter((p) => p.statut === 'EN_COURS').length,
      },
    });
  } catch (error) {
    console.error('Erreur getParcoursByMatricule:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMonReleve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const releve = construireReleve(inscriptions);
    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { id: true, nom: true, prenom: true, email: true },
    });

    if (candidat?.email) {
      runInBackground(
        () =>
          emailService.envoyerEmailReleveAcademique({
            userId: candidat.id,
            candidatId: candidat.id,
            candidatEmail: candidat.email,
            candidatNom: candidat.nom,
            candidatPrenom: candidat.prenom,
            totalInscriptions: releve.length,
            moyenneGlobale: calculerMoyenneGlobale(releve),
          }),
        'releve-academique-email'
      );
    }

    return res.json({
      message: 'Releve recupere avec succes',
      releve,
    });
  } catch (error) {
    console.error('Erreur getMonReleve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerMonRelevePdf = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        email: true,
        sexe: true,
        nationalite: true,
        dateNaiss: true,
        lieuNaiss: true,
        dossier: {
          select: {
            photo: true,
          },
        },
      },
    });

    if (!candidat) {
      return res.status(404).json({ error: 'Candidat non trouve' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const releve = construireReleve(inscriptions);
    const moyenneGlobale = calculerMoyenneGlobale(releve);
    const etablissementPrincipal = inscriptions[0]?.etablissement
      ? {
          id: inscriptions[0].etablissement.id,
          nom: inscriptions[0].etablissement.nom,
          ville: inscriptions[0].etablissement.ville || '',
          adresse: inscriptions[0].etablissement.adresse || '',
          email: inscriptions[0].etablissement.email || '',
          logoPath: getEtablissementLogoRelativePath(inscriptions[0].etablissement.id),
        }
      : {
          nom: 'Etablissement non renseigne',
          ville: '',
          adresse: '',
          email: '',
          logoPath: '',
        };

    const pdfResult = await pdfService.genererReleveAcademique({
      candidat: {
        ...candidat,
        photoPath: candidat?.dossier?.photo || '',
      },
      releve,
      moyenneGlobale,
      decisionJury: moyenneGlobale !== null && moyenneGlobale >= 10
        ? 'Admis en niveau superieur'
        : 'En attente de deliberation',
      etablissement: etablissementPrincipal,
    });

    const filename = `releve_${candidat.matricule || candidat.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(pdfResult.filePath);
    stream.pipe(res);
    stream.on('close', () => {
      pdfService.nettoyerPDF(pdfResult.filePath);
    });

    if (candidat.email) {
      runInBackground(
        () =>
          emailService.envoyerEmailReleveAcademique({
            userId: candidat.id,
            candidatId: candidat.id,
            candidatEmail: candidat.email,
            candidatNom: candidat.nom,
            candidatPrenom: candidat.prenom,
            totalInscriptions: releve.length,
            moyenneGlobale,
          }),
        'releve-pdf-email'
      );
    }
  } catch (error) {
    console.error('Erreur telechargerMonRelevePdf:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

