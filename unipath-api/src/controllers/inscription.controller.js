const fs = require('fs');
const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const { genererNumeroInscriptionUnique } = require('../utils/numero-inscription.helper');
const { envoyerPreInscriptionApresCreation } = require('../utils/inscription-email.helper');
const { candidateSerieMatchesConcours } = require('../utils/series.helper');
const { computeInscriptionCompletude, profilCandidatComplet } = require('../utils/dossier-submission.helper');
const pdfService = require('../services/pdf.service');

/**
 * @deprecated Utiliser POST /api/inscriptions/soumettre (soumettreDossierComplet).
 * L'inscription sans quittance ni pièces concours n'est plus autorisée.
 */
exports.creerInscription = async (req, res) => {
  return res.status(410).json({
    error: 'Cette voie d\'inscription n\'est plus disponible. Déposez votre dossier complet depuis la fiche du concours (quittance et pièces requises).',
    useInstead: 'POST /api/inscriptions/soumettre',
  });
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
 *
 * Règle : aucun appel réseau (Storage, email) dans prisma.$transaction.
 */
exports.soumettreDossierComplet = async (req, res) => {
  try {
    const candidatId = req.user.id;
    const { concoursId, piecesDepuisDossier } = req.body;
    const fichiers = req.files || [];

    if (!concoursId) {
      return res.status(400).json({ error: 'concoursId requis' });
    }

    // —— ÉTAPE 1 : validations (hors transaction) ——
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

    const inscriptionExistante = await prisma.inscription.findUnique({
      where: { candidatId_concoursId: { candidatId, concoursId } },
      include: { dossierInscription: true },
    });

    const modeCompletion = !!(
      inscriptionExistante
      && !inscriptionExistante.dossierInscription?.quittanceUrl
    );

    if (inscriptionExistante?.dossierInscription?.quittanceUrl) {
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
        if (ins.concoursId === concoursId) return false;
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
          error: `Conflit de dates avec "${conflit.concours.libelle}". Périodes de composition trop proches.`,
        });
      }
    }

    // —— ÉTAPE 2 : uploads Storage + URLs dossier personnel (hors transaction) ——
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

    if (modeCompletion && inscriptionExistante.dossierInscription) {
      const di = inscriptionExistante.dossierInscription;
      if (di.quittanceUrl && !urlsPieces.quittance) {
        urlsPieces.quittance = di.quittanceUrl;
      }
      const existingExtras = di.piecesExtras && typeof di.piecesExtras === 'object' ? di.piecesExtras : {};
      for (const [pieceId, url] of Object.entries(existingExtras)) {
        if (!urlsPieces[pieceId] && url) {
          urlsPieces[pieceId] = url;
        }
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

    if (!urlsPieces.quittance) {
      return res.status(400).json({
        error: 'La quittance de paiement est obligatoire.',
        piecesManquantes: ['Quittance de paiement'],
      });
    }

    if (manquantes.length > 0) {
      return res.status(400).json({
        error: `Pièces obligatoires manquantes : ${manquantes.join(', ')}`,
        piecesManquantes: manquantes,
      });
    }

    const quittanceUrl = urlsPieces.quittance || null;
    const piecesExtras = { ...urlsPieces };
    delete piecesExtras.quittance;

    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // —— ÉTAPE 3 : écriture DB (transaction courte, Prisma uniquement) ——
    let inscription;

    if (modeCompletion) {
      const dossierInscriptionId = inscriptionExistante.dossierInscription.id;

      await prisma.$transaction(async (tx) => {
        await tx.dossierInscription.update({
          where: { id: dossierInscriptionId },
          data: {
            quittanceUrl,
            piecesExtras,
            statut: 'EN_ATTENTE',
          },
        });

        const dejaSoumis = await tx.actionHistory.findFirst({
          where: {
            dossierInscriptionId,
            typeAction: 'DOSSIER_SOUMIS',
          },
        });

        if (!dejaSoumis) {
          await tx.actionHistory.create({
            data: {
              utilisateurId: candidatId,
              dossierInscriptionId,
              typeAction: 'DOSSIER_SOUMIS',
              details: {
                message: 'Dossier complété après pré-inscription',
                concoursId,
                inscriptionId: inscriptionExistante.id,
              },
              ipAddress,
              userAgent,
            },
          });
        }
      });

      inscription = await prisma.inscription.findUnique({
        where: { id: inscriptionExistante.id },
        include: { concours: true, dossierInscription: true },
      });
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const newInscription = await tx.inscription.create({
          data: { candidatId, concoursId },
        });

        const dossierInscription = await tx.dossierInscription.create({
          data: {
            inscriptionId: newInscription.id,
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
            details: { concoursId, inscriptionId: newInscription.id },
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
              inscriptionId: newInscription.id,
            },
            ipAddress,
            userAgent,
          },
        });

        return { inscription: newInscription, dossierInscription };
      });

      const numeroInscription = await genererNumeroInscriptionUnique();
      inscription = await prisma.inscription.update({
        where: { id: result.inscription.id },
        data: { numeroInscription },
        include: { concours: true, dossierInscription: true },
      });
    }

    // —— ÉTAPE 4 : email (non bloquant, hors transaction) ——
    try {
      await envoyerPreInscriptionApresCreation({
        candidat,
        concours,
        inscription,
      });
    } catch (emailError) {
      console.error('Email non envoyé (non bloquant):', emailError);
    }

    res.status(201).json({
      message: 'Dossier soumis avec succès.',
      inscriptionId: inscription.id,
      numeroInscription: inscription.numeroInscription,
    });
  } catch (error) {
    console.error('soumettreDossierComplet error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Vous êtes déjà inscrit à ce concours.' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la soumission.' });
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

/**
 * Télécharger la fiche de pré-inscription en PDF.
 * GET /api/inscriptions/:id/fiche
 */
exports.telechargerFichePreInscriptionPdf = async (req, res) => {
  let pdfPath = null;
  try {
    const { id } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        candidat: {
          include: {
            dossier: { select: { photo: true } },
          },
        },
        concours: true,
        dossierInscription: true,
      },
    });

    if (!inscription || inscription.candidatId !== candidatId) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    if (!inscription.dossierInscription?.quittanceUrl) {
      return res.status(400).json({
        error: 'La fiche n\'est disponible qu\'après dépôt complet du dossier (quittance incluse).',
      });
    }

    const numeroInscription = inscription.numeroInscription
      || inscription.id.substring(0, 8).toUpperCase();

    const pdfResult = await pdfService.genererFichePreInscriptionDepuisInscription(inscription);
    pdfPath = pdfResult.filePath;
    const pdfBuffer = await fs.promises.readFile(pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fiche-preinscription-${numeroInscription}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('telechargerFichePreInscriptionPdf error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  } finally {
    if (pdfPath) {
      pdfService.nettoyerPDF(pdfPath).catch(() => {});
    }
  }
};

/**
 * Renvoyer la fiche de pré-inscription par email (dossier complet uniquement).
 * POST /api/inscriptions/:id/renvoyer-fiche
 */
exports.renvoyerFichePreInscription = async (req, res) => {
  try {
    const { id } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        concours: true,
        dossierInscription: true,
        candidat: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            matricule: true,
            telephone: true,
            dateNaiss: true,
            lieuNaiss: true,
          },
        },
      },
    });

    if (!inscription || inscription.candidatId !== candidatId) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    if (!inscription.dossierInscription?.quittanceUrl) {
      return res.status(400).json({
        error: 'La fiche n\'est disponible qu\'après dépôt complet du dossier (quittance incluse).',
      });
    }

    await envoyerPreInscriptionApresCreation({
      candidat: inscription.candidat,
      concours: inscription.concours,
      inscription,
    });

    res.json({ message: 'Fiche de pré-inscription envoyée par email.' });
  } catch (error) {
    console.error('renvoyerFichePreInscription error:', error);
    res.status(500).json({ error: 'Impossible d\'envoyer la fiche par email. Réessayez plus tard.' });
  }
};

module.exports = exports;