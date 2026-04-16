// src/controllers/pdf.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { genererConvocation } = require('../services/pdf.service');

exports.telechargerConvocation = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: true,
        concours: true,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvee' });
    }

    if (inscription.statut !== 'VALIDE') {
      return res.status(403).json({ error: 'Dossier non valide. Convocation indisponible.' });
    }

    const pdfBuffer = await genererConvocation(inscription.candidat, inscription.concours);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=convocation-${inscription.candidat.matricule}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la generation du PDF' });
  }
};
if (inscription.candidatId !== req.user.id) {
  return res.status(403).json({ error: 'Accès refusé' });
}