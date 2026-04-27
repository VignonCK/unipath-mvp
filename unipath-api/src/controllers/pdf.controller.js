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

    // Utiliser le répertoire du projet pour éviter les problèmes de chemin avec espaces
    const tmpDir    = path.join(__dirname, '../../tmp');
    const timestamp = Date.now();
    const tmpInput  = path.join(tmpDir, `conv_input_${timestamp}.json`);
    const tmpOutput = path.join(tmpDir, `conv_output_${timestamp}.pdf`);

    // Créer le dossier tmp s'il n'existe pas
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const data = JSON.stringify({
      candidat: inscription.candidat,
      concours: inscription.concours,
    });

    fs.writeFileSync(tmpInput, data, 'utf8');

    const phpScript = path.join(__dirname, '../../php/convocation.php');
    const cmd = `php "${phpScript.replace(/\\/g, '/')}" "${tmpInput.replace(/\\/g, '/')}" "${tmpOutput.replace(/\\/g, '/')}"`;

    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      try { if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput); } catch {}

      if (error) {
        console.error('Erreur PHP:', error);
        console.error('PHP stderr:', stderr);
        try { if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput); } catch {}
        return res.status(500).json({ error: 'Erreur lors de la generation PHP du PDF' });
      }

      if (!fs.existsSync(tmpOutput)) {
        return res.status(500).json({ error: 'Le PDF n\'a pas ete genere' });
      }

      const pdfBuffer = fs.readFileSync(tmpOutput);
      const filename = `convocation_${inscription.candidat.matricule}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);

      try { fs.unlinkSync(tmpOutput); } catch {}
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerPreinscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { candidat: true, concours: true },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    if (inscription.candidatId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Utiliser le répertoire du projet pour éviter les problèmes de chemin avec espaces
    const tmpDir    = path.join(__dirname, '../../tmp');
    const timestamp = Date.now();
    const tmpInput  = path.join(tmpDir, `preinsc_input_${timestamp}.json`);
    const tmpOutput = path.join(tmpDir, `preinsc_output_${timestamp}.pdf`);

    // Créer le dossier tmp s'il n'existe pas
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    fs.writeFileSync(tmpInput, JSON.stringify({
      candidat:    inscription.candidat,
      concours:    inscription.concours,
      inscription: inscription,
    }), 'utf8');

    const phpScript = path.join(__dirname, '../../php/preinscription.php');
    // Utiliser des guillemets doubles et normaliser les chemins
    const cmd = `php "${phpScript.replace(/\\/g, '/')}" "${tmpInput.replace(/\\/g, '/')}" "${tmpOutput.replace(/\\/g, '/')}"`;

    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      // Nettoyer le fichier d'entrée dans tous les cas
      try { if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput); } catch {}

      if (error) {
        console.error('Erreur PHP preinscription:', error.message);
        console.error('PHP stderr:', stderr);
        try { if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput); } catch {}
        return res.status(500).json({ error: 'Erreur génération PDF', details: stderr });
      }

      if (!fs.existsSync(tmpOutput)) {
        return res.status(500).json({ error: 'PDF non généré' });
      }

      const pdfBuffer = fs.readFileSync(tmpOutput);
      const libelle   = inscription.concours.libelle.replace(/[^a-zA-Z0-9]/g, '_');
      const filename  = `preinscription_${inscription.candidat.matricule}_${libelle}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);

      try { fs.unlinkSync(tmpOutput); } catch {}
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
