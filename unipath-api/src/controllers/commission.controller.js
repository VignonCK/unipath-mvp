const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { envoyerEmailValidation, envoyerEmailRejet, envoyerEmailConvocation, envoyerEmailSousReserve } = require('../services/email.service');
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

exports.getCandidatsParConcours = async (req, res) => {
  try {
    const concours = await prisma.concours.findMany({
      include: {
        inscriptions: {
          where: { statut: 'VALIDE' },
          include: {
            candidat: {
              select: {
                id: true,
                matricule: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
              },
            },
          },
          orderBy: [
            { note: 'desc' },
          ],
        },
      },
      orderBy: { dateDebut: 'asc' },
    });

    const result = concours.map(c => ({
      id: c.id,
      libelle: c.libelle,
      etablissement: c.etablissement,
      dateComposition: c.dateComposition,
      totalValides: c.inscriptions.length,
      candidatsAvecNote: c.inscriptions.filter(i => i.note !== null).length,
      candidatsSansNote: c.inscriptions.filter(i => i.note === null).length,
      inscriptions: c.inscriptions.map(i => ({
        id: i.id,
        candidat: i.candidat,
        note: i.note,
        statut: i.note !== null ? 'Noté' : 'Non noté',
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération candidats par concours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { note } = req.body;

    // Validation
    if (note !== null && note !== undefined) {
      const noteNum = parseFloat(note);
      if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
        return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
      }
    }

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { note: note !== null && note !== undefined ? parseFloat(note) : null },
      include: {
        candidat: true,
        concours: true,
      },
    });

    res.json({
      message: 'Note mise à jour avec succès',
      inscription,
    });
  } catch (error) {
    console.error('Erreur mise à jour note:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { statut, commentaireRejet, commentaireSousReserve } = req.body;

    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide. Valeurs acceptees : VALIDE, REJETE ou SOUS_RESERVE',
      });
    }

    // Si rejet, le commentaire est obligatoire
    if (statut === 'REJETE' && !commentaireRejet) {
      return res.status(400).json({
        error: 'Le commentaire de rejet est obligatoire',
      });
    }

    // Si sous réserve, le commentaire est obligatoire
    if (statut === 'SOUS_RESERVE' && !commentaireSousReserve) {
      return res.status(400).json({
        error: 'Le commentaire de validation sous réserve est obligatoire',
      });
    }

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { 
        statut,
        commentaireRejet: statut === 'REJETE' ? commentaireRejet : null,
        commentaireSousReserve: statut === 'SOUS_RESERVE' ? commentaireSousReserve : null,
      },
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
            dateExamen: inscription.concours.dateDebut ? new Date(inscription.concours.dateDebut).toLocaleDateString('fr-FR') : null,
            lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
          }, null).catch(err => console.error('Erreur envoi email:', err));
        } else {
          // Envoyer l'email avec la convocation
          await envoyerEmailConvocation({
            candidatEmail: inscription.candidat.email,
            candidatNom: inscription.candidat.nom,
            candidatPrenom: inscription.candidat.prenom,
            concours: inscription.concours.libelle,
            numeroDossier: inscription.id.substring(0, 8).toUpperCase(),
            dateExamen: inscription.concours.dateDebut ? new Date(inscription.concours.dateDebut).toLocaleDateString('fr-FR') : null,
            lieuExamen: 'EPAC - Université d\'Abomey-Calavi',
          }, tmpOutput).catch(err => console.error('Erreur envoi email:', err));
          
          // Supprimer le PDF temporaire
          if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
        }
      });
    } else if (statut === 'REJETE') {
      // Envoyer email de rejet avec le commentaire
      envoyerEmailRejet({
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        concours: inscription.concours.libelle,
        motif: commentaireRejet,
      }).catch(err => console.error('Erreur envoi email:', err));
    } else if (statut === 'SOUS_RESERVE') {
      // Envoyer email de validation sous réserve avec le commentaire
      envoyerEmailSousReserve({
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        concours: inscription.concours.libelle,
        numeroDossier: inscription.id.substring(0, 8).toUpperCase(),
        motif: commentaireSousReserve,
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