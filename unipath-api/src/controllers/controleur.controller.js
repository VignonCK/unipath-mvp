const prisma = require('../prisma');
const { envoyerEmailValidation, envoyerEmailRejet, envoyerEmailConvocation, envoyerEmailSousReserve } = require('../services/email.service');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Récupérer tous les dossiers en attente de validation contrôleur
exports.getDossiersEnAttente = async (req, res) => {
  try {
    const { statut } = req.query;

    const whereClause = statut 
      ? { statut }
      : {
          statut: {
            in: ['VALIDE_PAR_COMMISSION', 'REJETE_PAR_COMMISSION', 'SOUS_RESERVE_PAR_COMMISSION']
          }
        };

    const inscriptions = await prisma.inscription.findMany({
      where: whereClause,
      include: {
        candidat: {
          include: { dossier: true }
        },
        concours: true
      },
      orderBy: { decisionCommissionDate: 'desc' }
    });

    res.json({ 
      total: inscriptions.length,
      inscriptions 
    });
  } catch (error) {
    console.error('Erreur getDossiersEnAttente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Valider ou modifier la décision de la commission
exports.validerDecision = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { action, commentaireControleur } = req.body;
    // action peut être: 'CONFIRMER', 'VALIDER', 'REJETER', 'SOUS_RESERVE'
    const controleurId = req.user?.id;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: true,
        concours: true
      }
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    let nouveauStatut;
    let typeEmail;

    if (action === 'CONFIRMER') {
      // Confirmer la décision de la commission
      const mapping = {
        'VALIDE_PAR_COMMISSION': 'VALIDE',
        'REJETE_PAR_COMMISSION': 'REJETE',
        'SOUS_RESERVE_PAR_COMMISSION': 'SOUS_RESERVE'
      };
      nouveauStatut = mapping[inscription.statut];
      typeEmail = nouveauStatut;
    } else {
      // Le contrôleur modifie la décision
      nouveauStatut = action; // 'VALIDE', 'REJETE', ou 'SOUS_RESERVE'
      typeEmail = nouveauStatut;
    }

    // Mettre à jour l'inscription
    const inscriptionUpdated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        statut: nouveauStatut,
        decisionControleurPar: controleurId,
        decisionControleurDate: new Date(),
        commentaireControleur: action !== 'CONFIRMER' ? commentaireControleur : null
      },
      include: {
        candidat: true,
        concours: true
      }
    });

    // ✅ MAINTENANT on envoie l'email au candidat
    try {
      if (typeEmail === 'VALIDE') {
        // Générer la convocation en PDF
        const tmpInput = path.join(os.tmpdir(), `convocation_input_${Date.now()}.json`);
        const tmpOutput = path.join(os.tmpdir(), `convocation_output_${Date.now()}.pdf`);

        const data = JSON.stringify({
          candidat: inscriptionUpdated.candidat,
          concours: inscriptionUpdated.concours,
          inscription: inscriptionUpdated,
        });
        fs.writeFileSync(tmpInput, data, 'utf8');

        const phpScript = path.join(__dirname, '../../php/convocation.php');
        const cmd = `php "${phpScript}" "${tmpInput}" "${tmpOutput}"`;

        exec(cmd, { timeout: 30000 }, async (error, stdout, stderr) => {
          fs.unlinkSync(tmpInput);
          
          if (error) {
            console.error('Erreur génération convocation:', stderr);
            // Envoyer quand même un email sans PDF
            await envoyerEmailConvocation({
              candidatEmail: inscriptionUpdated.candidat.email,
              candidatNom: inscriptionUpdated.candidat.nom,
              candidatPrenom: inscriptionUpdated.candidat.prenom,
              concours: inscriptionUpdated.concours.libelle,
              numeroDossier: inscriptionUpdated.id.substring(0, 8).toUpperCase(),
              dateExamen: inscriptionUpdated.concours.dateDebut ? new Date(inscriptionUpdated.concours.dateDebut).toLocaleDateString('fr-FR') : null,
              lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
            }, null).catch(err => console.error('Erreur envoi email:', err));
          } else {
            // Envoyer l'email avec la convocation
            await envoyerEmailConvocation({
              candidatEmail: inscriptionUpdated.candidat.email,
              candidatNom: inscriptionUpdated.candidat.nom,
              candidatPrenom: inscriptionUpdated.candidat.prenom,
              concours: inscriptionUpdated.concours.libelle,
              numeroDossier: inscriptionUpdated.id.substring(0, 8).toUpperCase(),
              dateExamen: inscriptionUpdated.concours.dateDebut ? new Date(inscriptionUpdated.concours.dateDebut).toLocaleDateString('fr-FR') : null,
              lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
            }, tmpOutput).catch(err => console.error('Erreur envoi email:', err));
            
            // Supprimer le PDF temporaire
            if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
          }
        });
      } else if (typeEmail === 'REJETE') {
        const motif = inscriptionUpdated.commentaireControleur || inscriptionUpdated.commentaireRejet;
        await envoyerEmailRejet({
          candidatEmail: inscriptionUpdated.candidat.email,
          candidatNom: inscriptionUpdated.candidat.nom,
          candidatPrenom: inscriptionUpdated.candidat.prenom,
          concours: inscriptionUpdated.concours.libelle,
          motif: motif,
        });
      } else if (typeEmail === 'SOUS_RESERVE') {
        const motif = inscriptionUpdated.commentaireControleur || inscriptionUpdated.commentaireSousReserve;
        await envoyerEmailSousReserve({
          candidatEmail: inscriptionUpdated.candidat.email,
          candidatNom: inscriptionUpdated.candidat.nom,
          candidatPrenom: inscriptionUpdated.candidat.prenom,
          concours: inscriptionUpdated.concours.libelle,
          numeroDossier: inscriptionUpdated.id.substring(0, 8).toUpperCase(),
          motif: motif,
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // On continue même si l'email échoue
    }

    res.json({
      message: 'Décision validée et email envoyé au candidat',
      inscription: inscriptionUpdated
    });
  } catch (error) {
    console.error('Erreur validerDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les statistiques pour le contrôleur
exports.getStatistiques = async (req, res) => {
  try {
    const [enAttente, valides, rejetes, sousReserve] = await Promise.all([
      prisma.inscription.count({
        where: {
          statut: {
            in: ['VALIDE_PAR_COMMISSION', 'REJETE_PAR_COMMISSION', 'SOUS_RESERVE_PAR_COMMISSION']
          }
        }
      }),
      prisma.inscription.count({ where: { statut: 'VALIDE' } }),
      prisma.inscription.count({ where: { statut: 'REJETE' } }),
      prisma.inscription.count({ where: { statut: 'SOUS_RESERVE' } })
    ]);

    res.json({
      enAttenteValidation: enAttente,
      valides,
      rejetes,
      sousReserve,
      total: valides + rejetes + sousReserve
    });
  } catch (error) {
    console.error('Erreur getStatistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
