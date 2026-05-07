// src/controllers/candidat.controller.js
const prisma = require('../prisma');

exports.getProfil = async (req, res) => {
  try {
    const candidat = await prisma.candidat.findUnique({
      where: { id: req.user.id },
      include: {
        inscriptions: { include: { concours: true } },
        dossier: true,
      },
    });

    if (!candidat) return res.status(404).json({ error: 'Candidat non trouvé' });

    res.json(candidat);
  } catch (error) {
    console.error(error);
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