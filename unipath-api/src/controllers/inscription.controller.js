const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const { genererNumeroInscriptionUnique } = require('../utils/numero-inscription.helper');
const { envoyerPreInscriptionApresCreation } = require('../utils/inscription-email.helper');
const { candidateSerieMatchesConcours } = require('../utils/series.helper');
const { PIECES_BASE, getPiecesExtrasConfig } = require('../utils/completude.helper');
const {
  computeInscriptionCompletude,
  profilCandidatComplet,
} = require('../utils/dossier-submission.helper');

/**
 * Créer une nouvelle inscription à un concours
 */
exports.creerInscription = async (req, res) => {
  try {
    const { concoursId } = req.body;
    const candidatId = req.user.id;

    // Vérifier que le concours existe
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Vérifier que la période de dépôt n'est pas terminée
    const dateLimite = concours.dateFinDepot || concours.dateFin;
    if (dateLimite && new Date() > new Date(dateLimite)) {
      return res.status(400).json({
        error: 'La période de dépôt pour ce concours est terminée',
      });
    }

    // Vérifier que la série du candidat est acceptée par le concours
    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { serie: true },
    });

    if (!candidateSerieMatchesConcours(candidat?.serie, concours.seriesAcceptees)) {
      return res.status(403).json({
        error: "Votre série n'est pas acceptée pour ce concours",
      });
    }

    // Vérifier que le candidat n'est pas déjà inscrit
    const inscriptionExistante = await prisma.inscription.findFirst({
      where: {
        candidatId,
        concoursId,
      },
    });

    if (inscriptionExistante) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à ce concours' });
    }

    const MARGE_JOURS = 2;

    if (concours.dateDebutComposition && concours.dateFinComposition) {
      const inscriptionsExistantes = await prisma.inscription.findMany({
        where: { candidatId },
        include: {
          concours: {
            select: {
              libelle: true,
              dateDebutComposition: true,
              dateFinComposition: true,
            },
          },
        },
      });

      const margeMs = MARGE_JOURS * 24 * 60 * 60 * 1000;
      const nouveauDebut = new Date(concours.dateDebutComposition).getTime();
      const nouveauFin = new Date(concours.dateFinComposition).getTime();

      const conflit = inscriptionsExistantes.find((ins) => {
        if (!ins.concours.dateDebutComposition || !ins.concours.dateFinComposition) {
          return false;
        }

        const existantDebut = new Date(ins.concours.dateDebutComposition).getTime();
        const existantFin = new Date(ins.concours.dateFinComposition).getTime();

        if (Number.isNaN(nouveauDebut) || Number.isNaN(nouveauFin) || Number.isNaN(existantDebut) || Number.isNaN(existantFin)) {
          return false;
        }

        return (
          nouveauDebut <= existantFin + margeMs &&
          nouveauFin >= existantDebut - margeMs
        );
      });

      if (conflit) {
        return res.status(409).json({
          error: `Conflit de dates détecté avec le concours "${conflit.concours.libelle}". Les périodes de composition sont trop proches (moins de ${MARGE_JOURS} jours d'écart). Veuillez choisir un autre concours.`,
        });
      }
    }

    // Vérifier si le candidat a un Dossier, sinon le créer
    let dossier = await prisma.dossier.findUnique({
      where: { candidatId }
    });

    if (!dossier) {
      dossier = await prisma.dossier.create({
        data: { candidatId }
      });
    }

    const numeroInscription = await genererNumeroInscriptionUnique();

    // Créer l'inscription + DossierInscription dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const inscription = await tx.inscription.create({
        data: {
          candidatId,
          concoursId,
          numeroInscription,
        },
      });

      // Créer le DossierInscription automatiquement
      const dossierInscription = await tx.dossierInscription.create({
        data: {
          inscriptionId: inscription.id,
          statut: 'EN_ATTENTE',
          piecesExtras: {},
        },
      });

      // Créer une entrée dans l'historique
      await tx.actionHistory.create({
        data: {
          utilisateurId: candidatId,
          dossierInscriptionId: dossierInscription.id,
          typeAction: 'DOSSIER_CONCOURS_CREE',
          details: { concoursId, inscriptionId: inscription.id },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return { inscription, dossierInscription };
    });

    // Calculer la complétude initiale
    const piecesBasesPresentes = PIECES_BASE.filter(p => dossier[p]).length;

    // Quittance + pièces extra configurées par le concours
    const piecesExtrasConfig = getPiecesExtrasConfig(concours);
    const total = PIECES_BASE.length + 1 + piecesExtrasConfig.length; // base + quittance + extras
    const presentes = piecesBasesPresentes; // Initialement, seules les pièces de base peuvent être présentes
    const completude = Math.round((presentes / total) * 100);

    // Récupérer l'inscription complète avec relations
    const inscriptionComplete = await prisma.inscription.findUnique({
      where: { id: result.inscription.id },
      include: {
        concours: true,
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            dateNaiss: true,
            lieuNaiss: true,
          },
        },
        dossierInscription: true,
      },
    });

    // Email + PDF pré-inscription (asynchrone, ne bloque pas la réponse)
    envoyerPreInscriptionApresCreation({
      candidat: inscriptionComplete.candidat,
      concours: inscriptionComplete.concours,
      inscription: inscriptionComplete,
    }).catch((err) => console.error('Erreur envoi email pré-inscription:', err));

    res.status(201).json({
      message: 'Inscription créée avec succès. Vous êtes candidat pour ce concours.',
      inscription: {
        ...inscriptionComplete,
        estCandidatConcours: true,
      },
      roleContext: 'candidat',
      concoursId: inscriptionComplete.concoursId,
      completude: {
        pourcentage: completude,
        piecesPresentes: presentes,
        piecesRequises: total
      }
    });
  } catch (error) {
    console.error('Erreur création inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const PIECE_ID_TO_DOSSIER = {
  acteNaissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acte_naissance: 'acteNaissance',
  carteIdentite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carte_identite: 'carteIdentite',
  photo: 'photo',
  photo_identite: 'photo',
  releve: 'releve',
  'releve-notes': 'releve',
  releve_bac: 'releve',
};

function resolveDossierField(pieceId, sourceDossier) {
  return sourceDossier || PIECE_ID_TO_DOSSIER[pieceId] || null;
}

function getConcoursPiecesList(concours) {
  const raw = concours?.piecesRequises?.pieces;
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => (typeof p === 'string' ? { id: p, nom: p, obligatoire: true } : p));
}

async function uploadFichierSupabase(buffer, mimetype, candidatId, concoursId, pieceId) {
  const ext = mimetype === 'application/pdf' ? 'pdf' : mimetype.split('/')[1] || 'bin';
  const fileName = `${candidatId}/${concoursId}/${pieceId}-${Date.now()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from('dossiers-candidats')
    .upload(fileName, buffer, { contentType: mimetype, upsert: true });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabaseAdmin.storage.from('dossiers-candidats').getPublicUrl(fileName);
  return urlData.publicUrl;
}

/**
 * Soumission atomique : inscription + fichiers + email (nouveau flux candidat).
 * POST /api/inscriptions/soumettre
 */
exports.soumettreDossierComplet = async (req, res) => {
  try {
    const candidatId = req.user.id;
    const { concoursId, piecesDepuisDossier } = req.body;
    const fichiers = req.files || [];

    if (!concoursId) {
      return res.status(400).json({ error: 'concoursId requis' });
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const dateDebut = concours.dateDebutDepot || concours.dateDebut;
    const dateFin = concours.dateFinDepot || concours.dateFin;
    const now = new Date();
    if (dateDebut && now < new Date(dateDebut)) {
      return res.status(400).json({ error: 'La période de dépôt de dossier n\'est pas encore ouverte.' });
    }
    if (dateFin && now > new Date(dateFin)) {
      return res.status(400).json({ error: 'La période de dépôt de dossier est fermée.' });
    }

    const inscriptionExistante = await prisma.inscription.findFirst({
      where: { candidatId, concoursId },
    });
    if (inscriptionExistante) {
      return res.status(409).json({ error: 'Vous êtes déjà inscrit à ce concours.' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: {
        id: true,
        serie: true,
        nom: true,
        prenom: true,
        email: true,
        matricule: true,
        telephone: true,
        dateNaiss: true,
        lieuNaiss: true,
      },
    });

    if (!profilCandidatComplet(candidat)) {
      return res.status(400).json({
        error: 'Complétez votre profil (téléphone, date et lieu de naissance) avant de soumettre',
      });
    }

    if (!candidateSerieMatchesConcours(candidat?.serie, concours.seriesAcceptees)) {
      return res.status(400).json({
        error: `Votre série (${candidat?.serie || 'non renseignée'}) n'est pas acceptée pour ce concours.`,
      });
    }

    const MARGE_JOURS = 2;
    if (concours.dateDebutComposition && concours.dateFinComposition) {
      const inscriptionsExistantes = await prisma.inscription.findMany({
        where: { candidatId },
        include: {
          concours: {
            select: {
              libelle: true,
              dateDebutComposition: true,
              dateFinComposition: true,
            },
          },
        },
      });

      const margeMs = MARGE_JOURS * 24 * 60 * 60 * 1000;
      const nouveauDebut = new Date(concours.dateDebutComposition).getTime();
      const nouveauFin = new Date(concours.dateFinComposition).getTime();

      const conflit = inscriptionsExistantes.find((ins) => {
        if (!ins.concours.dateDebutComposition || !ins.concours.dateFinComposition) return false;
        const existantDebut = new Date(ins.concours.dateDebutComposition).getTime();
        const existantFin = new Date(ins.concours.dateFinComposition).getTime();
        if (Number.isNaN(nouveauDebut) || Number.isNaN(nouveauFin) || Number.isNaN(existantDebut) || Number.isNaN(existantFin)) {
          return false;
        }
        return nouveauDebut <= existantFin + margeMs && nouveauFin >= existantDebut - margeMs;
      });

      if (conflit) {
        return res.status(409).json({
          error: `Conflit de dates détecté avec le concours "${conflit.concours.libelle}". Les périodes de composition sont trop proches.`,
        });
      }
    }

    const urlsPieces = {};
    for (const fichier of fichiers) {
      if (!fichier.fieldname?.startsWith('piece_')) continue;
      const pieceId = fichier.fieldname.replace('piece_', '');
      urlsPieces[pieceId] = await uploadFichierSupabase(
        fichier.buffer,
        fichier.mimetype,
        candidatId,
        concoursId,
        pieceId
      );
    }

    const dossierPersonnel = await prisma.dossier.findUnique({ where: { candidatId } });
    let piecesDepuisDossierParsed = [];
    try {
      piecesDepuisDossierParsed = JSON.parse(piecesDepuisDossier || '[]');
    } catch {
      piecesDepuisDossierParsed = [];
    }

    for (const pieceId of piecesDepuisDossierParsed) {
      const fieldKey = resolveDossierField(pieceId, null);
      if (fieldKey && dossierPersonnel?.[fieldKey]) {
        urlsPieces[pieceId] = dossierPersonnel[fieldKey];
      }
    }

    const piecesConcours = getConcoursPiecesList(concours);
    const piecesObligatoires = piecesConcours.filter((p) => p.obligatoire !== false);
    const manquantes = [];

    for (const piece of piecesObligatoires) {
      if (urlsPieces[piece.id]) continue;
      const fieldKey = resolveDossierField(piece.id, piece.sourceDossier);
      if (fieldKey && dossierPersonnel?.[fieldKey]) {
        urlsPieces[piece.id] = dossierPersonnel[fieldKey];
        continue;
      }
      manquantes.push(piece.nom || piece.id);
    }

    if (manquantes.length > 0) {
      return res.status(400).json({
        error: `Pièces obligatoires manquantes : ${manquantes.join(', ')}`,
        piecesManquantes: manquantes,
      });
    }

    const numeroInscription = await genererNumeroInscriptionUnique();
    const quittanceUrl = urlsPieces.quittance || null;
    const piecesExtras = { ...urlsPieces };
    delete piecesExtras.quittance;

    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await prisma.$transaction(async (tx) => {
      const inscription = await tx.inscription.create({
        data: { candidatId, concoursId, numeroInscription },
      });

      const dossierInscription = await tx.dossierInscription.create({
        data: {
          inscriptionId: inscription.id,
          quittanceUrl,
          piecesExtras,
          statut: 'EN_ATTENTE',
        },
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: candidatId,
          dossierInscriptionId: dossierInscription.id,
          typeAction: 'DOSSIER_CONCOURS_CREE',
          details: { concoursId, inscriptionId: inscription.id },
          ipAddress,
          userAgent,
        },
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: candidatId,
          dossierInscriptionId: dossierInscription.id,
          typeAction: 'DOSSIER_SOUMIS',
          details: {
            message: 'Dossier soumis en une seule requête',
            concoursId,
            inscriptionId: inscription.id,
          },
          ipAddress,
          userAgent,
        },
      });

      return { inscription, dossierInscription };
    });

    const inscriptionComplete = await prisma.inscription.findUnique({
      where: { id: result.inscription.id },
      include: { concours: true, dossierInscription: true },
    });

    try {
      await envoyerPreInscriptionApresCreation({
        candidat,
        concours,
        inscription: inscriptionComplete,
      });
    } catch (emailError) {
      console.error('Email non envoyé:', emailError);
    }

    res.status(201).json({
      message: 'Dossier soumis avec succès.',
      inscriptionId: result.inscription.id,
      numeroInscription: result.inscription.numeroInscription,
    });
  } catch (error) {
    console.error('soumettreDossierComplet error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Vous êtes déjà inscrit à ce concours.' });
    }
    res.status(500).json({ error: error.message || 'Erreur serveur lors de la soumission.' });
  }
};

/**
 * Récupérer toutes les inscriptions du candidat connecté
 */
exports.getMesInscriptions = async (req, res) => {
  try {
    const candidatId = req.user.id;

    const inscriptions = await prisma.inscription.findMany({
      where: { candidatId },
      include: {
        concours: true,
        dossierInscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = inscriptions.map((ins) => ({
      ...ins,
      statut: ins.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: ins.dossierInscription?.commentaireRejet,
      commentaireSousReserve: ins.dossierInscription?.commentaireSousReserve,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer l'inscription du candidat connecté pour un concours donné.
 * GET /api/inscriptions?concoursId=...
 */
exports.getInscriptionByConcours = async (req, res) => {
  try {
    const { concoursId } = req.query;
    const candidatId = req.user.id;

    if (!concoursId) {
      return res.status(400).json({ error: 'concoursId requis' });
    }

    const inscription = await prisma.inscription.findFirst({
      where: { candidatId, concoursId: String(concoursId) },
      include: {
        concours: true,
        dossierInscription: true,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Aucune inscription trouvée pour ce concours' });
    }

    res.json({
      ...inscription,
      estCandidatConcours: true,
      statut: inscription.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: inscription.dossierInscription?.commentaireRejet,
      commentaireSousReserve: inscription.dossierInscription?.commentaireSousReserve,
      quittanceUrl: inscription.dossierInscription?.quittanceUrl ?? null,
      piecesExtras: inscription.dossierInscription?.piecesExtras ?? {},
      dossierInscriptionId: inscription.dossierInscription?.id ?? null,
    });
  } catch (error) {
    console.error('Erreur getInscriptionByConcours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer une inscription spécifique
 */
exports.getInscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id,
        candidatId,
      },
      include: {
        concours: true,
        dossierInscription: true,
        candidat: {
          include: {
            dossier: true,
          },
        },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    res.json({
      ...inscription,
      statut: inscription.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: inscription.dossierInscription?.commentaireRejet,
      commentaireSousReserve: inscription.dossierInscription?.commentaireSousReserve,
    });
  } catch (error) {
    console.error('Erreur récupération inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour les pièces extras d'une inscription
 */
exports.updatePiecesExtras = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { piecesExtras } = req.body;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { inscriptionId },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    const updated = await prisma.dossierInscription.update({
      where: { id: dossier.id },
      data: { piecesExtras },
      include: {
        inscription: { include: { concours: true } },
      },
    });

    res.json({
      message: 'Pièces extras mises à jour avec succès',
      inscription: {
        ...updated.inscription,
        dossierInscription: updated,
        piecesExtras: updated.piecesExtras,
      },
    });
  } catch (error) {
    console.error('Erreur mise à jour pièces extras:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Upload de la quittance pour une inscription
 */
exports.uploadQuittanceInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: { id: inscriptionId, candidatId },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Upload vers Supabase
    const ext = req.file.originalname.split('.').pop();
    const fileName = `${candidatId}/quittance-${inscriptionId}-${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from('dossiers-candidats')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('dossiers-candidats')
      .getPublicUrl(fileName);

    const quittanceUrl = urlData.publicUrl;

    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { quittanceUrl },
    });

    res.json({
      message: 'Quittance uploadée avec succès',
      quittanceUrl,
      inscription: updated,
    });
  } catch (error) {
    console.error('Erreur upload quittance inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Soumettre officiellement un dossier complet pour examen par la commission.
 * Le statut reste EN_ATTENTE ; la soumission est tracée dans l'historique.
 */
exports.soumettreDossier = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: { id: inscriptionId, candidatId },
      include: {
        candidat: { include: { dossier: true } },
        concours: true,
        dossierInscription: true,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    const dossierInscription = inscription.dossierInscription;
    if (!dossierInscription) {
      return res.status(400).json({ error: 'Dossier d\'inscription introuvable' });
    }

    if (dossierInscription.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: 'Ce dossier a déjà été traité par la commission',
      });
    }

    if (!profilCandidatComplet(inscription.candidat)) {
      return res.status(400).json({
        error: 'Complétez votre profil (téléphone, date et lieu de naissance) avant de soumettre',
      });
    }

    const dejaSoumis = await prisma.actionHistory.findFirst({
      where: {
        dossierInscriptionId: dossierInscription.id,
        typeAction: 'DOSSIER_SOUMIS',
      },
    });

    if (dejaSoumis) {
      return res.status(400).json({
        error: 'Ce dossier a déjà été soumis',
        soumisAt: dejaSoumis.timestamp,
      });
    }

    const completude = computeInscriptionCompletude(inscription);
    if (!completude.estComplet) {
      return res.status(400).json({
        error: 'Dossier incomplet. Déposez toutes les pièces requises avant de soumettre.',
        piecesManquantes: completude.piecesManquantes,
        completude: {
          pourcentage: completude.pourcentage,
          piecesPresentes: completude.presentes,
          piecesRequises: completude.total,
        },
      });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const action = await prisma.actionHistory.create({
      data: {
        utilisateurId: candidatId,
        dossierInscriptionId: dossierInscription.id,
        typeAction: 'DOSSIER_SOUMIS',
        details: {
          message: 'Dossier soumis officiellement par le candidat',
          concoursId: inscription.concoursId,
          inscriptionId: inscription.id,
        },
        ipAddress,
        userAgent,
      },
    });

    res.json({
      message: 'Dossier soumis avec succès. Il sera examiné par la commission.',
      soumisAt: action.timestamp,
      inscription: {
        id: inscription.id,
        statut: dossierInscription.statut,
        soumis: true,
      },
      completude: {
        pourcentage: completude.pourcentage,
        piecesPresentes: completude.presentes,
        piecesRequises: completude.total,
      },
    });
  } catch (error) {
    console.error('Erreur soumission dossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Annuler une inscription (si statut EN_ATTENTE)
 */
exports.annulerInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId,
      },
      include: {
        dossierInscription: true
      }
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    // Vérifier que le statut est EN_ATTENTE
    if (inscription.dossierInscription && inscription.dossierInscription.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: 'Impossible d\'annuler une inscription déjà traitée',
      });
    }

    // Supprimer l'inscription (cascade supprimera DossierInscription et ActionHistory)
    await prisma.inscription.delete({
      where: { id: inscriptionId },
    });

    res.json({ message: 'Inscription annulée avec succès' });
  } catch (error) {
    console.error('Erreur annulation inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;