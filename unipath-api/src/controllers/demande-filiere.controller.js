const prisma = require('../prisma');
const { resolveEtablissementIdFromReq } = require('../utils/etablissement-access.helper');

const NIVEAUX = ['LICENCE', 'MASTER', 'AUTRE'];
const STATUTS = ['EN_ATTENTE', 'VALIDE', 'REJETE'];

const dureeFixePourNiveau = (niveau) => {
  if (niveau === 'MASTER') return 2;
  if (niveau === 'LICENCE') return 3;
  return null;
};

const DEMANDE_INCLUDE = {
  etablissement: { select: { id: true, nom: true, ville: true, type: true } },
  demandePar: { select: { id: true, nom: true, prenom: true, email: true } },
  filiere: { select: { id: true, nom: true, code: true } },
  filiereReference: { select: { id: true, nom: true, niveau: true } },
};

function slugCode(nom, etablissementId) {
  const base = String(nom || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'FIL';
  const suffix = String(etablissementId || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${base}-${suffix}-${Date.now().toString(36).toUpperCase()}`.slice(0, 60);
}

async function getAdminFromReq(req) {
  const admin = await prisma.adminEtablissement.findUnique({
    where: { id: req.user.id },
    select: { id: true, etablissementId: true, nom: true, prenom: true },
  });
  return admin;
}

function parseDemandeBody(body) {
  const filiereReferenceId = body?.filiereReferenceId
    ? String(body.filiereReferenceId).trim()
    : null;
  const nom = String(body?.nom || '').trim();
  const code = body?.code != null && String(body.code).trim() !== ''
    ? String(body.code).trim().toUpperCase()
    : null;
  const niveau = String(body?.niveau || 'LICENCE').toUpperCase();

  if (!nom && !filiereReferenceId) {
    return { error: 'Choisissez une filière du catalogue ou saisissez un nom' };
  }
  if (!NIVEAUX.includes(niveau) && !filiereReferenceId) {
    return { error: 'Niveau invalide (LICENCE, MASTER ou AUTRE)' };
  }

  const details = {
    fraisScolariteAnnuels: body?.fraisScolariteAnnuels != null && body.fraisScolariteAnnuels !== ''
      ? Number(body.fraisScolariteAnnuels) : null,
    fraisInscriptionEffective: body?.fraisInscriptionEffective != null && body.fraisInscriptionEffective !== ''
      ? Number(body.fraisInscriptionEffective) : null,
    fraisAutres: body?.fraisAutres ? String(body.fraisAutres).trim() : null,
    debouches: body?.debouches ? String(body.debouches).trim() : null,
    partenariatsEntreprises: body?.partenariatsEntreprises ? String(body.partenariatsEntreprises).trim() : null,
    partenariatsUniversites: body?.partenariatsUniversites ? String(body.partenariatsUniversites).trim() : null,
    dureeStage: body?.dureeStage ? String(body.dureeStage).trim() : null,
    langueEnseignement: body?.langueEnseignement ? String(body.langueEnseignement).trim() : null,
  };

  return { nom, code, niveau, filiereReferenceId, details, dureeAnneesRaw: body?.dureeAnnees };
}

/** Admin : créer une demande d'ajout */
exports.creerDemande = async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const parsed = parseDemandeBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    let nom = parsed.nom;
    let niveau = parsed.niveau;
    let filiereReferenceId = parsed.filiereReferenceId || null;

    if (filiereReferenceId) {
      const ref = await prisma.filiereReference.findFirst({
        where: { id: filiereReferenceId, actif: true },
      });
      if (!ref) {
        return res.status(400).json({ error: 'Filière du catalogue introuvable ou inactive' });
      }
      nom = ref.nom;
      // Catalogue avec niveau fixé : impose Licence ou Master
      if (ref.niveau === 'LICENCE' || ref.niveau === 'MASTER') {
        niveau = ref.niveau;
      } else if (parsed.niveau && NIVEAUX.includes(parsed.niveau)) {
        niveau = parsed.niveau;
      }
    }

    if (!nom) {
      return res.status(400).json({ error: 'Le nom de la filière est obligatoire' });
    }
    if (!NIVEAUX.includes(niveau)) {
      return res.status(400).json({ error: 'Niveau invalide (LICENCE, MASTER ou AUTRE)' });
    }

    let dureeAnnees;
    const dureeFixe = dureeFixePourNiveau(niveau);
    if (dureeFixe != null) {
      dureeAnnees = dureeFixe;
    } else {
      dureeAnnees = Number(parsed.dureeAnneesRaw);
      if (!Number.isFinite(dureeAnnees) || dureeAnnees < 1 || dureeAnnees > 5) {
        return res.status(400).json({
          error: 'Pour le niveau « Autres », précisez la durée (1 à 5 ans).',
        });
      }
      dureeAnnees = Math.round(dureeAnnees);
    }

    if (parsed.code) {
      const existing = await prisma.filiere.findUnique({ where: { code: parsed.code } });
      if (existing) {
        return res.status(409).json({ error: `Le code « ${parsed.code} » est déjà utilisé par une filière.` });
      }
      const pendingSameCode = await prisma.demandeAjoutFiliere.findFirst({
        where: { code: parsed.code, statut: 'EN_ATTENTE' },
      });
      if (pendingSameCode) {
        return res.status(409).json({ error: `Une demande en attente utilise déjà le code « ${parsed.code} ».` });
      }
    }

    const demande = await prisma.demandeAjoutFiliere.create({
      data: {
        etablissementId: admin.etablissementId,
        demandeParId: admin.id,
        nom,
        code: parsed.code,
        niveau,
        dureeAnnees,
        filiereReferenceId,
        details: parsed.details,
        statut: 'EN_ATTENTE',
      },
      include: DEMANDE_INCLUDE,
    });

    return res.status(201).json({
      message: 'Demande d\'ajout de filière envoyée à la DGES',
      demande,
    });
  } catch (error) {
    console.error('Erreur creerDemande filière:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Admin : lister les demandes de mon établissement */
exports.listerMesDemandes = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req)
      || (await getAdminFromReq(req))?.etablissementId;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const { statut } = req.query;
    const demandes = await prisma.demandeAjoutFiliere.findMany({
      where: {
        etablissementId,
        ...(statut && STATUTS.includes(String(statut)) ? { statut: String(statut) } : {}),
      },
      include: DEMANDE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ message: 'Demandes récupérées', demandes });
  } catch (error) {
    console.error('Erreur listerMesDemandes filière:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** DGES : lister toutes les demandes */
exports.listerDemandesDges = async (req, res) => {
  try {
    const { statut, etablissementId } = req.query;
    const demandes = await prisma.demandeAjoutFiliere.findMany({
      where: {
        ...(statut && STATUTS.includes(String(statut)) ? { statut: String(statut) } : {}),
        ...(etablissementId ? { etablissementId: String(etablissementId) } : {}),
      },
      include: DEMANDE_INCLUDE,
      orderBy: [{ statut: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({ message: 'Demandes récupérées', demandes });
  } catch (error) {
    console.error('Erreur listerDemandesDges filière:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** DGES : valider → crée la filière */
exports.validerDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await prisma.demandeAjoutFiliere.findUnique({
      where: { id },
      include: DEMANDE_INCLUDE,
    });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    if (demande.statut !== 'EN_ATTENTE') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    let code = demande.code;
    if (code) {
      const clash = await prisma.filiere.findUnique({ where: { code } });
      if (clash) {
        return res.status(409).json({
          error: `Le code « ${code} » est déjà pris. Rejetez la demande ou demandez un autre code à l'établissement.`,
        });
      }
    } else {
      code = slugCode(demande.nom, demande.etablissementId);
      while (await prisma.filiere.findUnique({ where: { code } })) {
        code = slugCode(demande.nom, demande.etablissementId);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const filiere = await tx.filiere.create({
        data: {
          nom: demande.nom,
          code,
          niveau: demande.niveau,
          dureeAnnees: demande.dureeAnnees,
          etablissementId: demande.etablissementId,
        },
      });
      return tx.demandeAjoutFiliere.update({
        where: { id },
        data: {
          statut: 'VALIDE',
          filiereId: filiere.id,
          code,
          decidedAt: new Date(),
          decidedBy: req.user.id,
          motifDecision: null,
        },
        include: DEMANDE_INCLUDE,
      });
    });

    return res.json({
      message: `Filière « ${updated.nom} » créée et validée`,
      demande: updated,
    });
  } catch (error) {
    console.error('Erreur validerDemande filière:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Conflit de code filière. Réessayez.' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** DGES : rejeter */
exports.rejeterDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const motifDecision = String(req.body?.motifDecision || '').trim() || null;

    const demande = await prisma.demandeAjoutFiliere.findUnique({ where: { id } });
    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    if (demande.statut !== 'EN_ATTENTE') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    const updated = await prisma.demandeAjoutFiliere.update({
      where: { id },
      data: {
        statut: 'REJETE',
        motifDecision,
        decidedAt: new Date(),
        decidedBy: req.user.id,
      },
      include: DEMANDE_INCLUDE,
    });

    return res.json({
      message: 'Demande d\'ajout de filière rejetée',
      demande: updated,
    });
  } catch (error) {
    console.error('Erreur rejeterDemande filière:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
