// src/controllers/candidat.controller.js
const prisma = require('../prisma');

exports.getProfil = async (req, res) => {
  try {
    const candidat = await prisma.candidat.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        anip: true,
        serie: true,
        sexe: true,
        nationalite: true,
        email: true,
        telephone: true,
        dateNaiss: true,
        lieuNaiss: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Ne pas exposer emailConfirme
        inscriptions: {
          include: {
            concours: true,
            dossierInscription: true,
          },
        },
        dossier: true,
      },
    });

    if (!candidat) return res.status(404).json({ error: 'Candidat non trouvé' });

    const inscriptions = candidat.inscriptions.map((ins) => ({
      ...ins,
      statut: ins.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: ins.dossierInscription?.commentaireRejet,
      commentaireSousReserve: ins.dossierInscription?.commentaireSousReserve,
      quittanceUrl: ins.dossierInscription?.quittanceUrl ?? null,
      piecesExtras: ins.dossierInscription?.piecesExtras ?? {},
      dossierInscriptionId: ins.dossierInscription?.id ?? null,
    }));

    res.json({
      ...candidat,
      serieBac: candidat.serie,
      inscriptions: inscriptions.map((ins) => ({
        ...ins,
        estCandidatConcours: true,
      })),
    });
  } catch (error) {
    console.error('❌ Erreur getProfil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateProfil = async (req, res) => {
  try {
    const { nom, prenom, sexe, nationalite, telephone, dateNaiss, lieuNaiss } = req.body; // ✅ fix

    const candidat = await prisma.candidat.update({
      where: { id: req.user.id },
      data: { nom, prenom, sexe, nationalite, telephone, dateNaiss, lieuNaiss }, // ✅ fix
    });

    res.json({ message: 'Profil mis à jour avec succès', candidat });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;