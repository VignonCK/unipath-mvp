const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { envoyerEmailValidation, envoyerEmailRejet, envoyerEmailConvocation } = require('../services/email.service');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.getDossiers = async (req, res) => {
  try {
    const { statut } = req.query;

    const inscriptions = await prisma.inscription.findMany({
      where: statut ? { statut } : {},
      include: {
        candidat: {
          include: { dossier: true },
        },
        concours: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      total: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { statut, motif } = req.body;

    if (!['VALIDE', 'REJETE'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide. Valeurs acceptees : VALIDE ou REJETE',
      });
    }

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { statut },
      include: {
        candidat: true,
        concours: true,
      },
    });

    if (statut === 'VALIDE') {
      // Générer la convocation en PDF
      const tmpInput = path.join(os.tmpdir(), `convocation_input_${Date.now()}.json`);
      const tmpOutput = path.join(os.tmpdir(), `convocation_output_${Date.now()}.pdf`);

      const data = JSON.stringify({
        candidat: inscription.candidat,
        concours: inscription.concours,
        inscription: inscription,
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
            candidatEmail: inscription.candidat.email,
            candidatNom: inscription.candidat.nom,
            candidatPrenom: inscription.candidat.prenom,
            concours: inscription.concours.libelle,
            numeroDossier: inscription.id.substring(0, 8).toUpperCase(),
            pdfPath: null,
            dateExamen: inscription.concours.dateDebut ? new Date(inscription.concours.dateDebut).toLocaleDateString('fr-FR') : null,
            lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
          }).catch(err => console.error('Erreur envoi email:', err));
        } else {
          // Envoyer l'email avec la convocation
          await envoyerEmailConvocation({
            candidatEmail: inscription.candidat.email,
            candidatNom: inscription.candidat.nom,
            candidatPrenom: inscription.candidat.prenom,
            concours: inscription.concours.libelle,
            numeroDossier: inscription.id.substring(0, 8).toUpperCase(),
            pdfPath: tmpOutput,
            dateExamen: inscription.concours.dateDebut ? new Date(inscription.concours.dateDebut).toLocaleDateString('fr-FR') : null,
            lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
          }).catch(err => console.error('Erreur envoi email:', err));
          
          // Supprimer le PDF temporaire
          if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
        }
      });
    } else {
      // Envoyer email de rejet
      envoyerEmailRejet({
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        concours: inscription.concours.libelle,
        motif: motif || 'Dossier incomplet ou non conforme aux critères du concours',
      }).catch(err => console.error('Erreur envoi email:', err));
    }

    res.json({
      message: 'Dossier ' + statut.toLowerCase() + ' avec succes. Email de notification envoye.',
      inscription,
    });
  } catch (error) {
    console.error('Erreur updateStatut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};