// src/controllers/pdf.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

    if (inscription.candidatId !== req.user.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    if (inscription.statut !== 'VALIDE') {
      return res.status(400).json({ error: 'La convocation n\'est disponible que pour les dossiers valides' });
    }

    // Écrire les données dans un fichier temporaire
    const tmpInput = path.join(os.tmpdir(), `conv_input_${Date.now()}.json`);
    const tmpOutput = path.join(os.tmpdir(), `conv_output_${Date.now()}.pdf`);

    const data = JSON.stringify({
      candidat: inscription.candidat,
      concours: inscription.concours,
    });

    fs.writeFileSync(tmpInput, data);

    const phpScript = path.join(__dirname, '../../php/convocation.php');
    const cmd = `php "${phpScript}" "${tmpInput}" "${tmpOutput}"`;

    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur PHP:', error);
        console.error('PHP stderr:', stderr);
        fs.unlinkSync(tmpInput);
        return res.status(500).json({ error: 'Erreur lors de la generation PHP du PDF' });
      }

      if (!fs.existsSync(tmpOutput)) {
        fs.unlinkSync(tmpInput);
        return res.status(500).json({ error: 'Le PDF n\'a pas ete genere' });
      }

      const pdfBuffer = fs.readFileSync(tmpOutput);
      const filename = `convocation_${inscription.candidat.matricule}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(pdfBuffer);

      // Nettoyer les fichiers temporaires
      fs.unlinkSync(tmpInput);
      fs.unlinkSync(tmpOutput);
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};