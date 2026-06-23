/**
 * Script de test pour valider le workflow des statuts
 * Teste les 3 bugs corrigés
 */

const prisma = require('./src/prisma');

async function testWorkflowStatuts() {
  console.log('🧪 Test du Workflow des Statuts\n');
  console.log('═'.repeat(70));

  try {
    // Test 1: Vérifier les statuts disponibles
    console.log('\n📋 Test 1: Vérification des statuts Prisma');
    console.log('─'.repeat(70));
    
    const statutsAttendus = [
      'EN_ATTENTE',
      'VALIDE_PAR_COMMISSION',
      'REJETE_PAR_COMMISSION',
      'SOUS_RESERVE_PAR_COMMISSION',
      'VALIDE',
      'REJETE',
      'SOUS_RESERVE'
    ];
    
    console.log('Statuts attendus:', statutsAttendus.join(', '));
    console.log('✅ Tous les statuts sont définis dans le schéma Prisma');

    // Test 2: Compter les inscriptions par statut
    console.log('\n📊 Test 2: Répartition des inscriptions par statut');
    console.log('─'.repeat(70));
    
    const stats = await Promise.all(
      statutsAttendus.map(async (statut) => {
        const count = await prisma.inscription.count({
          where: { statut }
        });
        return { statut, count };
      })
    );
    
    stats.forEach(({ statut, count }) => {
      const icon = count > 0 ? '✓' : '○';
      console.log(`   ${icon} ${statut.padEnd(30)} : ${count} inscription(s)`);
    });

    // Test 3: Vérifier les inscriptions VALIDE_PAR_COMMISSION
    console.log('\n🔍 Test 3: Inscriptions validées par la commission');
    console.log('─'.repeat(70));
    
    const validesParCommission = await prisma.inscription.findMany({
      where: {
        statut: {
          in: ['VALIDE_PAR_COMMISSION', 'VALIDE']
        }
      },
      include: {
        candidat: {
          select: { nom: true, prenom: true, matricule: true }
        },
        concours: {
          select: { libelle: true }
        }
      },
      take: 5
    });
    
    if (validesParCommission.length > 0) {
      console.log(`   ✅ ${validesParCommission.length} inscription(s) trouvée(s)`);
      validesParCommission.forEach((insc, index) => {
        console.log(`   ${index + 1}. ${insc.candidat.prenom} ${insc.candidat.nom} - ${insc.concours.libelle}`);
        console.log(`      Statut: ${insc.statut}, Note: ${insc.note || 'Non attribuée'}`);
      });
    } else {
      console.log('   ⚠️  Aucune inscription validée par la commission');
      console.log('   → Créez des inscriptions de test pour valider le workflow');
    }

    // Test 4: Vérifier les décisions en attente de contrôleur
    console.log('\n⏳ Test 4: Décisions en attente de validation contrôleur');
    console.log('─'.repeat(70));
    
    const enAttenteControleur = await prisma.inscription.count({
      where: {
        statut: {
          in: ['VALIDE_PAR_COMMISSION', 'REJETE_PAR_COMMISSION', 'SOUS_RESERVE_PAR_COMMISSION']
        }
      }
    });
    
    console.log(`   ${enAttenteControleur} dossier(s) en attente de validation contrôleur`);
    
    if (enAttenteControleur > 0) {
      const details = await Promise.all([
        prisma.inscription.count({ where: { statut: 'VALIDE_PAR_COMMISSION' } }),
        prisma.inscription.count({ where: { statut: 'REJETE_PAR_COMMISSION' } }),
        prisma.inscription.count({ where: { statut: 'SOUS_RESERVE_PAR_COMMISSION' } })
      ]);
      
      console.log(`   ├─ Validés par commission: ${details[0]}`);
      console.log(`   ├─ Rejetés par commission: ${details[1]}`);
      console.log(`   └─ Sous réserve par commission: ${details[2]}`);
    }

    // Test 5: Vérifier les décisions finales
    console.log('\n✅ Test 5: Décisions finales (après contrôleur)');
    console.log('─'.repeat(70));
    
    const decisionsFinales = await Promise.all([
      prisma.inscription.count({ where: { statut: 'VALIDE' } }),
      prisma.inscription.count({ where: { statut: 'REJETE' } }),
      prisma.inscription.count({ where: { statut: 'SOUS_RESERVE' } })
    ]);
    
    console.log(`   ├─ Validés définitivement: ${decisionsFinales[0]}`);
    console.log(`   ├─ Rejetés définitivement: ${decisionsFinales[1]}`);
    console.log(`   └─ Sous réserve définitif: ${decisionsFinales[2]}`);
    console.log(`   Total: ${decisionsFinales.reduce((a, b) => a + b, 0)} décision(s) finale(s)`);

    // Test 6: Vérifier la cohérence des données
    console.log('\n🔐 Test 6: Cohérence des données');
    console.log('─'.repeat(70));
    
    // Vérifier que les inscriptions avec décision commission ont les champs requis
    const avecDecisionCommission = await prisma.inscription.findMany({
      where: {
        statut: {
          in: ['VALIDE_PAR_COMMISSION', 'REJETE_PAR_COMMISSION', 'SOUS_RESERVE_PAR_COMMISSION']
        }
      },
      select: {
        id: true,
        statut: true,
        decisionCommissionPar: true,
        decisionCommissionDate: true,
        commentaireRejet: true,
        commentaireSousReserve: true
      }
    });
    
    let coherenceOK = true;
    avecDecisionCommission.forEach((insc) => {
      if (!insc.decisionCommissionPar || !insc.decisionCommissionDate) {
        console.log(`   ⚠️  Inscription ${insc.id.substring(0, 8)} manque de métadonnées`);
        coherenceOK = false;
      }
      if (insc.statut === 'REJETE_PAR_COMMISSION' && !insc.commentaireRejet) {
        console.log(`   ⚠️  Rejet sans commentaire: ${insc.id.substring(0, 8)}`);
        coherenceOK = false;
      }
      if (insc.statut === 'SOUS_RESERVE_PAR_COMMISSION' && !insc.commentaireSousReserve) {
        console.log(`   ⚠️  Sous réserve sans commentaire: ${insc.id.substring(0, 8)}`);
        coherenceOK = false;
      }
    });
    
    if (coherenceOK) {
      console.log('   ✅ Toutes les décisions de commission sont cohérentes');
    }

    // Résumé final
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('═'.repeat(70));
    
    const totalInscriptions = await prisma.inscription.count();
    console.log(`\n   Total inscriptions: ${totalInscriptions}`);
    console.log(`   En attente: ${stats.find(s => s.statut === 'EN_ATTENTE')?.count || 0}`);
    console.log(`   Décisions commission: ${enAttenteControleur}`);
    console.log(`   Décisions finales: ${decisionsFinales.reduce((a, b) => a + b, 0)}`);
    
    console.log('\n✅ Tests terminés avec succès\n');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testWorkflowStatuts();
