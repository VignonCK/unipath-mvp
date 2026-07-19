const crypto = require('crypto');
const prisma = require('../prisma');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

async function loadAffectationsPayload(concoursId) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true, code: true },
  });
  if (!concours) return null;

  const affectations = await prisma.affectationCommissionConcours.findMany({
    where: { concoursId },
    include: {
      membre: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          sousRole: true,
        },
      },
    },
    orderBy: [{ roleAffectation: 'asc' }, { createdAt: 'asc' }],
  });

  return {
    concours,
    examinateurs: affectations
      .filter((a) => a.roleAffectation === 'EXAMINATEUR')
      .map((a) => ({ affectationId: a.id, ...a.membre })),
    controleurs: affectations
      .filter((a) => a.roleAffectation === 'CONTROLEUR')
      .map((a) => ({ affectationId: a.id, ...a.membre })),
  };
}

exports.listerMembresCommission = async (_req, res) => {
  try {
    const membres = await prisma.membreCommission.findMany({
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        sousRole: true,
        motDePasseTemporaire: true,
        createdAt: true,
        _count: { select: { affectations: true } },
      },
    });

    const comptes = await prisma.compte.findMany({
      where: {
        profilType: 'COMMISSION',
        profilId: { in: membres.map((m) => m.id) },
      },
      select: {
        profilId: true,
        demandeResetMotDePasseAt: true,
      },
    });
    const demandeByProfil = Object.fromEntries(
      comptes.map((c) => [c.profilId, c.demandeResetMotDePasseAt])
    );

    const mapped = membres.map((m) => ({
      id: m.id,
      nom: m.nom,
      prenom: m.prenom,
      email: m.email,
      telephone: m.telephone,
      sousRole: m.sousRole,
      motDePasseTemporaire: m.motDePasseTemporaire || null,
      createdAt: m.createdAt,
      nbAffectations: m._count.affectations,
      demandeResetMotDePasse: !!demandeByProfil[m.id],
      demandeResetMotDePasseAt: demandeByProfil[m.id] || null,
    }));

    // Demandes « mot de passe oublié » en premier
    mapped.sort((a, b) => {
      if (a.demandeResetMotDePasse === b.demandeResetMotDePasse) {
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr');
      }
      return a.demandeResetMotDePasse ? -1 : 1;
    });

    return res.json(mapped);
  } catch (error) {
    console.error('listerMembresCommission:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

/**
 * Réinitialise le mot de passe d'un membre (mot de passe temporaire stable).
 * POST /dec/membres-commission/:membreId/reinitialiser-mot-de-passe
 */
exports.reinitialiserMotDePasseMembre = async (req, res) => {
  try {
    const { membreId } = req.params;

    const membre = await prisma.membreCommission.findUnique({
      where: { id: membreId },
    });
    if (!membre) {
      return res.status(404).json({ error: 'Membre de commission introuvable.' });
    }

    const compte = await prisma.compte.findUnique({
      where: { profilId: membreId },
    });
    if (!compte) {
      return res.status(404).json({ error: 'Compte de connexion introuvable pour ce membre.' });
    }

    // Conservé après la 1re génération : les clics suivants réutilisent le même x
    const motDePasse = membre.motDePasseTemporaire || genererMotDePasseTemporaire();
    const passwordHash = await authService.hashPassword(motDePasse);

    await prisma.$transaction([
      prisma.compte.update({
        where: { id: compte.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          demandeResetMotDePasseAt: null,
          resetToken: null,
          resetExpires: null,
        },
      }),
      prisma.membreCommission.update({
        where: { id: membreId },
        data: { motDePasseTemporaire: motDePasse },
      }),
    ]);

    const { buildFrontendUrl } = require('../utils/url.helper');
    const loginUrl = buildFrontendUrl('/login');

    try {
      await emailService.envoyerEmailMotDePasseTemporaireCommission({
        email: membre.email,
        nom: membre.nom,
        prenom: membre.prenom,
        motDePasse,
        loginUrl,
        userId: membre.id,
      });
    } catch (emailErr) {
      console.error('Email mot de passe temporaire commission:', emailErr.message);
      // La réinit a réussi : on ne bloque pas la DEC (le MDP reste visible dans l'UI)
      return res.json({
        message:
          `Mot de passe réinitialisé (${motDePasse}). `
          + `L'email n'a pas pu être envoyé (${emailErr.code || emailErr.message}). `
          + 'Communiquez ce mot de passe au membre ou réessayez l\'envoi.',
        emailEnvoye: false,
        membre: {
          id: membre.id,
          email: membre.email,
          motDePasseTemporaire: motDePasse,
          demandeResetMotDePasse: false,
        },
      });
    }

    return res.json({
      message: `Mot de passe réinitialisé (${motDePasse}). Un email a été envoyé à ${membre.email}.`,
      emailEnvoye: true,
      membre: {
        id: membre.id,
        email: membre.email,
        motDePasseTemporaire: motDePasse,
        demandeResetMotDePasse: false,
      },
    });
  } catch (error) {
    console.error('reinitialiserMotDePasseMembre:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Crée un compte commission (profil + authentification).
 * Body: { nom, prenom, email, password, telephone? }
 */
exports.creerMembreCommission = async (req, res) => {
  try {
    const nom = String(req.body?.nom || '').trim();
    const prenom = String(req.body?.prenom || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const telephone = String(req.body?.telephone || '').trim() || null;

    if (!nom || !prenom || !email) {
      return res.status(400).json({
        error: 'Nom, prénom et email sont obligatoires.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const existingCompte = await authService.findCompteByEmail(email);
    if (existingCompte) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const existingMembre = await prisma.membreCommission.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingMembre) {
      return res.status(409).json({ error: 'Un membre de commission existe déjà avec cet email.' });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const profileId = crypto.randomUUID();

    let membre;
    try {
      membre = await prisma.membreCommission.create({
        data: {
          id: profileId,
          nom,
          prenom,
          email,
          telephone,
          sousRole: 'MEMBRE',
          motDePasseTemporaire,
        },
      });

      await authService.createCompte({
        email,
        password: motDePasseTemporaire,
        profilType: 'COMMISSION',
        profilId: profileId,
        emailConfirme: true,
        mustChangePassword: true,
      });
    } catch (createError) {
      await prisma.membreCommission.delete({ where: { id: profileId } }).catch(() => {});
      await authService.deleteCompte(profileId);
      throw createError;
    }

    await prisma.notification.create({
      data: {
        userId: membre.id,
        type: 'SYSTEME',
        title: 'Bienvenue — Membre de commission',
        message: `Bonjour ${membre.prenom} ${membre.nom}, votre compte membre de commission a été créé. Vous pourrez consulter les dossiers une fois affecté(e) à un concours.`,
        priority: 'NORMAL',
      },
    }).catch((err) => console.error('Notification bienvenue commission:', err.message));

    const { buildFrontendUrl } = require('../utils/url.helper');
    const loginUrl = buildFrontendUrl('/login');
    let emailEnvoye = true;

    try {
      await emailService.envoyerEmailIdentifiantsMembreCommission({
        email: membre.email,
        nom: membre.nom,
        prenom: membre.prenom,
        motDePasse: motDePasseTemporaire,
        loginUrl,
        userId: membre.id,
      });
    } catch (emailError) {
      emailEnvoye = false;
      console.error('Email identifiants commission:', emailError.message);
    }

    return res.status(201).json({
      message: emailEnvoye
        ? `Membre créé avec succès. Un email avec les identifiants a été envoyé à ${membre.email}.`
        : `Membre créé. Mot de passe temporaire : ${motDePasseTemporaire}. L'email n'a pas pu être envoyé — communiquez-le au membre.`,
      emailEnvoye,
      membre: {
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        email: membre.email,
        telephone: membre.telephone,
        sousRole: membre.sousRole,
        motDePasseTemporaire,
        demandeResetMotDePasse: false,
        createdAt: membre.createdAt,
        nbAffectations: 0,
      },
    });
  } catch (error) {
    console.error('creerMembreCommission:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAffectationsConcours = async (req, res) => {
  try {
    const payload = await loadAffectationsPayload(req.params.concoursId);
    if (!payload) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }
    return res.json(payload);
  } catch (error) {
    console.error('getAffectationsConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Body: { examinateurs: string[], controleurs: string[] }
 * Remplace l'ensemble des affectations du concours.
 */
exports.setAffectationsConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const examinateurs = Array.isArray(req.body?.examinateurs)
      ? [...new Set(req.body.examinateurs.filter(Boolean))]
      : [];
    const controleurs = Array.isArray(req.body?.controleurs)
      ? [...new Set(req.body.controleurs.filter(Boolean))]
      : [];

    const doublons = examinateurs.filter((id) => controleurs.includes(id));
    if (doublons.length > 0) {
      return res.status(400).json({
        error:
          'Un membre ne peut pas être à la fois examinateur et contrôleur sur le même concours.',
        membresEnDoublon: doublons,
      });
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const allIds = [...new Set([...examinateurs, ...controleurs])];
    if (allIds.length > 0) {
      const found = await prisma.membreCommission.count({
        where: { id: { in: allIds } },
      });
      if (found !== allIds.length) {
        return res.status(400).json({ error: 'Un ou plusieurs membres sont invalides' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.affectationCommissionConcours.deleteMany({ where: { concoursId } });
      const rows = [
        ...examinateurs.map((membreCommissionId) => ({
          concoursId,
          membreCommissionId,
          roleAffectation: 'EXAMINATEUR',
        })),
        ...controleurs.map((membreCommissionId) => ({
          concoursId,
          membreCommissionId,
          roleAffectation: 'CONTROLEUR',
        })),
      ];
      if (rows.length > 0) {
        await tx.affectationCommissionConcours.createMany({ data: rows });
      }
    });

    // Le rôle est désormais résolu par concours via AffectationCommissionConcours.
    // On ne modifie plus le sousRole global du compte (source de vérité = affectations).

    const payload = await loadAffectationsPayload(concoursId);
    return res.json({ message: 'Affectations enregistrées', ...payload });
  } catch (error) {
    console.error('setAffectationsConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Stats : nombre de dossiers traités par membre de commission.
 * GET /dec/commission/stats-dossiers?concoursId=&role=EXAMINATEUR|CONTROLEUR
 *
 * - Examinateur : dossiers avec verdict1Par = membre
 * - Contrôleur commission : dossiers avec decisionControleurPar = membre
 */
exports.getStatsDossiersCommission = async (req, res) => {
  try {
    const concoursId = String(req.query.concoursId || '').trim() || null;
    const roleRaw = String(req.query.role || '').trim().toUpperCase();
    const role = ['EXAMINATEUR', 'CONTROLEUR'].includes(roleRaw) ? roleRaw : null;

    let concours = null;
    if (concoursId) {
      concours = await prisma.concours.findUnique({
        where: { id: concoursId },
        select: { id: true, libelle: true, code: true },
      });
      if (!concours) {
        return res.status(404).json({ error: 'Concours introuvable' });
      }
    }

    const affectationWhere = {};
    if (concoursId) affectationWhere.concoursId = concoursId;
    if (role) affectationWhere.roleAffectation = role;

    const affectations = await prisma.affectationCommissionConcours.findMany({
      where: affectationWhere,
      select: {
        membreCommissionId: true,
        roleAffectation: true,
        concoursId: true,
      },
    });

    let membreIds;
    if (concoursId || role) {
      membreIds = [...new Set(affectations.map((a) => a.membreCommissionId))];
    } else {
      const all = await prisma.membreCommission.findMany({ select: { id: true } });
      membreIds = all.map((m) => m.id);
    }

    const membres = membreIds.length
      ? await prisma.membreCommission.findMany({
          where: { id: { in: membreIds } },
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
          orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
        })
      : [];

    const dossierScope = concoursId
      ? { inscription: { concoursId } }
      : {};

    const wantExaminateur = !role || role === 'EXAMINATEUR';
    const wantControleur = !role || role === 'CONTROLEUR';

    const [countsExaminateur, countsControleur] = await Promise.all([
      wantExaminateur
        ? prisma.dossierInscription.groupBy({
            by: ['verdict1Par'],
            where: {
              verdict1Par: { in: membreIds.length ? membreIds : ['__none__'] },
              ...dossierScope,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      wantControleur
        ? prisma.dossierInscription.groupBy({
            by: ['decisionControleurPar'],
            where: {
              decisionControleurPar: { in: membreIds.length ? membreIds : ['__none__'] },
              ...dossierScope,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const mapExam = Object.fromEntries(
      countsExaminateur
        .filter((r) => r.verdict1Par)
        .map((r) => [r.verdict1Par, r._count._all])
    );
    const mapCtrl = Object.fromEntries(
      countsControleur
        .filter((r) => r.decisionControleurPar)
        .map((r) => [r.decisionControleurPar, r._count._all])
    );

    const rolesByMembre = {};
    for (const a of affectations) {
      if (!rolesByMembre[a.membreCommissionId]) {
        rolesByMembre[a.membreCommissionId] = new Set();
      }
      rolesByMembre[a.membreCommissionId].add(a.roleAffectation);
    }

    // Si pas de filtre concours/rôle, charger toutes les affectations pour afficher les rôles
    if (!concoursId && !role && membres.length > 0) {
      const allAff = await prisma.affectationCommissionConcours.findMany({
        where: { membreCommissionId: { in: membres.map((m) => m.id) } },
        select: { membreCommissionId: true, roleAffectation: true },
      });
      for (const a of allAff) {
        if (!rolesByMembre[a.membreCommissionId]) {
          rolesByMembre[a.membreCommissionId] = new Set();
        }
        rolesByMembre[a.membreCommissionId].add(a.roleAffectation);
      }
    }

    const membresStats = membres.map((m) => {
      const nbExaminateur = wantExaminateur ? (mapExam[m.id] || 0) : 0;
      const nbControleur = wantControleur ? (mapCtrl[m.id] || 0) : 0;
      const roles = [...(rolesByMembre[m.id] || [])].sort();
      return {
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        email: m.email,
        telephone: m.telephone || null,
        roles,
        nbDossiersExaminateur: nbExaminateur,
        nbDossiersControleur: nbControleur,
        nbDossiersTraites: nbExaminateur + nbControleur,
      };
    });

    membresStats.sort((a, b) => {
      if (b.nbDossiersTraites !== a.nbDossiersTraites) {
        return b.nbDossiersTraites - a.nbDossiersTraites;
      }
      return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr');
    });

    const totalDossiersTraites = membresStats.reduce((s, m) => s + m.nbDossiersTraites, 0);

    return res.json({
      filtres: {
        concoursId: concoursId || null,
        role: role || null,
      },
      concours,
      totaux: {
        membres: membresStats.length,
        dossiersTraites: totalDossiersTraites,
        dossiersExaminateur: membresStats.reduce((s, m) => s + m.nbDossiersExaminateur, 0),
        dossiersControleur: membresStats.reduce((s, m) => s + m.nbDossiersControleur, 0),
      },
      membres: membresStats,
    });
  } catch (error) {
    console.error('getStatsDossiersCommission:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
