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

