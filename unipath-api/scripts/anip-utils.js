// scripts/anip-utils.js
// Utilitaires pour la gestion des identifiants ANIP

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Valide le format d'un ANIP
 * @param {string} anip - L'identifiant ANIP à valider
 * @returns {boolean} - true si valide, false sinon
 */
function validerFormatANIP(anip) {
  if (!anip || typeof anip !== 'string') {
    return false;
  }
  return /^\d{12}$/.test(anip);
}

/**
 * Vérifie si un ANIP existe déjà dans la base de données
 * @param {string} anip - L'identifiant ANIP à vérifier
 * @returns {Promise<boolean>} - true si existe, false sinon
 */
async function anipExiste(anip) {
  const candidat = await prisma.candidat.findFirst({
    where: { anip }
  });
  return !!candidat;
}

/**
 * Génère un ANIP aléatoire (pour tests uniquement)
 * ⚠️ NE PAS UTILISER EN PRODUCTION
 * @returns {string} - Un ANIP aléatoire de 12 chiffres
 */
function genererANIPTest() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return (timestamp + random).slice(0, 12);
}

/**
 * Statistiques sur les ANIP dans la base de données
 * @returns {Promise<Object>} - Statistiques
 */
async function statistiquesANIP() {
  const total = await prisma.candidat.count();
  const avecANIP = await prisma.candidat.count({
    where: {
      anip: {
        not: null
      }
    }
  });
  const sansANIP = total - avecANIP;

  // Vérifier les doublons (ne devrait pas en avoir avec la contrainte UNIQUE)
  const doublons = await prisma.$queryRaw`
    SELECT anip, COUNT(*) as count
    FROM "Candidat"
    WHERE anip IS NOT NULL
    GROUP BY anip
    HAVING COUNT(*) > 1
  `;

  return {
    totalCandidats: total,
    avecANIP,
    sansANIP,
    pourcentageAvecANIP: total > 0 ? ((avecANIP / total) * 100).toFixed(2) : 0,
    doublons: doublons.length
  };
}

/**
 * Liste les candidats sans ANIP
 * @param {number} limit - Nombre maximum de résultats
 * @returns {Promise<Array>} - Liste des candidats
 */
async function listerCandidatsSansANIP(limit = 10) {
  return await prisma.candidat.findMany({
    where: {
      anip: null
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      email: true,
      createdAt: true
    },
    take: limit,
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Recherche un candidat par ANIP
 * @param {string} anip - L'identifiant ANIP
 * @returns {Promise<Object|null>} - Le candidat ou null
 */
async function rechercherParANIP(anip) {
  if (!validerFormatANIP(anip)) {
    throw new Error('Format ANIP invalide');
  }

  return await prisma.candidat.findFirst({
    where: { anip },
    include: {
      inscriptions: {
        include: {
          concours: true
        }
      },
      dossier: true
    }
  });
}

/**
 * Met à jour l'ANIP d'un candidat
 * ⚠️ À utiliser avec précaution
 * @param {string} candidatId - ID du candidat
 * @param {string} nouvelANIP - Nouvel ANIP
 * @returns {Promise<Object>} - Le candidat mis à jour
 */
async function mettreAJourANIP(candidatId, nouvelANIP) {
  if (!validerFormatANIP(nouvelANIP)) {
    throw new Error('Format ANIP invalide');
  }

  // Vérifier que l'ANIP n'est pas déjà utilisé
  const existe = await anipExiste(nouvelANIP);
  if (existe) {
    throw new Error('Cet ANIP est déjà utilisé par un autre candidat');
  }

  return await prisma.candidat.update({
    where: { id: candidatId },
    data: { anip: nouvelANIP }
  });
}

/**
 * Valide tous les ANIP de la base de données
 * @returns {Promise<Object>} - Résultat de la validation
 */
async function validerTousLesANIP() {
  const candidats = await prisma.candidat.findMany({
    where: {
      anip: {
        not: null
      }
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      anip: true
    }
  });

  const invalides = candidats.filter(c => !validerFormatANIP(c.anip));

  return {
    total: candidats.length,
    valides: candidats.length - invalides.length,
    invalides: invalides.length,
    listeInvalides: invalides
  };
}

/**
 * Nettoie les ANIP (supprime espaces, caractères spéciaux)
 * ⚠️ Script de maintenance - à exécuter manuellement
 */
async function nettoyerANIP() {
  const candidats = await prisma.candidat.findMany({
    where: {
      anip: {
        not: null
      }
    }
  });

  const miseAJour = [];

  for (const candidat of candidats) {
    const anipNettoye = candidat.anip.replace(/\D/g, ''); // Garde uniquement les chiffres
    
    if (anipNettoye !== candidat.anip && anipNettoye.length === 12) {
      miseAJour.push({
        id: candidat.id,
        ancienANIP: candidat.anip,
        nouveauANIP: anipNettoye
      });

      await prisma.candidat.update({
        where: { id: candidat.id },
        data: { anip: anipNettoye }
      });
    }
  }

  return {
    candidatsTraites: candidats.length,
    candidatsMisAJour: miseAJour.length,
    details: miseAJour
  };
}

// ============================================================================
// CLI - Commandes en ligne de commande
// ============================================================================

async function main() {
  const commande = process.argv[2];

  try {
    switch (commande) {
      case 'stats':
        console.log('📊 Statistiques ANIP\n');
        const stats = await statistiquesANIP();
        console.log(`Total candidats: ${stats.totalCandidats}`);
        console.log(`Avec ANIP: ${stats.avecANIP} (${stats.pourcentageAvecANIP}%)`);
        console.log(`Sans ANIP: ${stats.sansANIP}`);
        console.log(`Doublons: ${stats.doublons}`);
        break;

      case 'sans-anip':
        console.log('📋 Candidats sans ANIP\n');
        const limit = parseInt(process.argv[3]) || 10;
        const candidats = await listerCandidatsSansANIP(limit);
        console.table(candidats);
        break;

      case 'valider':
        console.log('✅ Validation de tous les ANIP\n');
        const validation = await validerTousLesANIP();
        console.log(`Total: ${validation.total}`);
        console.log(`Valides: ${validation.valides}`);
        console.log(`Invalides: ${validation.invalides}`);
        if (validation.invalides > 0) {
          console.log('\nANIP invalides:');
          console.table(validation.listeInvalides);
        }
        break;

      case 'rechercher':
        const anip = process.argv[3];
        if (!anip) {
          console.error('❌ Veuillez fournir un ANIP');
          process.exit(1);
        }
        console.log(`🔍 Recherche de l'ANIP: ${anip}\n`);
        const candidat = await rechercherParANIP(anip);
        if (candidat) {
          console.log('Candidat trouvé:');
          console.log(JSON.stringify(candidat, null, 2));
        } else {
          console.log('Aucun candidat trouvé avec cet ANIP');
        }
        break;

      case 'nettoyer':
        console.log('🧹 Nettoyage des ANIP\n');
        const resultat = await nettoyerANIP();
        console.log(`Candidats traités: ${resultat.candidatsTraites}`);
        console.log(`Candidats mis à jour: ${resultat.candidatsMisAJour}`);
        if (resultat.candidatsMisAJour > 0) {
          console.table(resultat.details);
        }
        break;

      case 'generer-test':
        const nombre = parseInt(process.argv[3]) || 1;
        console.log(`🎲 Génération de ${nombre} ANIP de test\n`);
        for (let i = 0; i < nombre; i++) {
          console.log(genererANIPTest());
        }
        break;

      default:
        console.log(`
📘 Utilitaires ANIP - UniPath

Usage: node scripts/anip-utils.js <commande> [options]

Commandes disponibles:

  stats                    Affiche les statistiques sur les ANIP
  sans-anip [limit]        Liste les candidats sans ANIP (défaut: 10)
  valider                  Valide tous les ANIP de la base
  rechercher <anip>        Recherche un candidat par ANIP
  nettoyer                 Nettoie les ANIP (supprime espaces, etc.)
  generer-test [nombre]    Génère des ANIP de test (défaut: 1)

Exemples:

  node scripts/anip-utils.js stats
  node scripts/anip-utils.js sans-anip 20
  node scripts/anip-utils.js rechercher 123456789012
  node scripts/anip-utils.js generer-test 5
        `);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

// Exporter les fonctions pour utilisation dans d'autres scripts
module.exports = {
  validerFormatANIP,
  anipExiste,
  genererANIPTest,
  statistiquesANIP,
  listerCandidatsSansANIP,
  rechercherParANIP,
  mettreAJourANIP,
  validerTousLesANIP,
  nettoyerANIP
};
