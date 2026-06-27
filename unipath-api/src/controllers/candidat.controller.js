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
      documentsCompl: ins.dossierInscription?.documentsCompl ?? null,
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
    const { nom, prenom, sexe, nationalite, telephone, dateNaiss, lieuNaiss } = req.body;

    if (!nom?.trim() || !prenom?.trim()) {
      return res.status(400).json({ error: 'Le nom et le prénom sont obligatoires.' });
    }
    if (!telephone?.trim()) {
      return res.status(400).json({ error: 'Le téléphone est obligatoire.' });
    }
    if (!lieuNaiss?.trim()) {
      return res.status(400).json({ error: 'Le lieu de naissance est obligatoire.' });
    }

    let parsedDateNaiss = null;
    if (dateNaiss && String(dateNaiss).trim()) {
      parsedDateNaiss = new Date(dateNaiss);
      if (Number.isNaN(parsedDateNaiss.getTime())) {
        return res.status(400).json({ error: 'Date de naissance invalide.' });
      }
    } else {
      return res.status(400).json({ error: 'La date de naissance est obligatoire.' });
    }

    const candidat = await prisma.candidat.update({
      where: { id: req.user.id },
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: sexe?.trim() || null,
        nationalite: nationalite?.trim() || null,
        telephone: telephone.trim(),
        dateNaiss: parsedDateNaiss,
        lieuNaiss: lieuNaiss.trim(),
      },
    });

    res.json({ message: 'Profil mis à jour avec succès', candidat });
  } catch (error) {
    console.error('❌ Erreur updateProfil:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;