// src/services/pdf.service.js
const PDFDocument = require('pdfkit');
const path = require('path');

const DRAPEAU = path.join(__dirname, '../assets/drapeau_du_benin.png');
const LOGO_MESRS = path.join(__dirname, '../assets/logo_mesrs.png');

const genererConvocation = (candidat, concours) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── BANDEAU VERT (couleur Bénin) ──────────────────────────
    doc.rect(0, 0, 595, 8).fill('#008751');

    // ── EN-TETE avec images ───────────────────────────────────
    try {
      doc.image(DRAPEAU, 60, 20, { width: 70, height: 50 });
    } catch (e) {
      console.warn('Drapeau non charge:', e.message);
    }

    try {
      doc.image(LOGO_MESRS, 465, 20, { width: 70, height: 50 });
    } catch (e) {
      console.warn('Logo MESRS non charge:', e.message);
    }

    // ── TEXTE EN-TETE ─────────────────────────────────────────
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
      .text('REPUBLIQUE DU BENIN', 140, 22, { width: 315, align: 'center' })
      .text('Ministere de l\'Enseignement Superieur', 140, 34, { width: 315, align: 'center' })
      .text('et de la Recherche Scientifique', 140, 44, { width: 315, align: 'center' })
      .text('Universite d\'Abomey-Calavi — EPAC', 140, 54, { width: 315, align: 'center' });

    // ── LIGNE SEPARATRICE tricolore ───────────────────────────
    doc.rect(60, 80, 158, 4).fill('#008751');  // vert
    doc.rect(218, 80, 159, 4).fill('#FCD116'); // jaune
    doc.rect(377, 80, 158, 4).fill('#E8112D'); // rouge

    doc.moveDown(4);

    // ── TITRE ─────────────────────────────────────────────────
    doc.rect(60, 100, 475, 45).fill('#008751');
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text('CONVOCATION', 60, 110, { width: 475, align: 'center' });

    doc.rect(60, 145, 475, 20).fill('#FCD116');
    doc.fontSize(11).font('Helvetica').fillColor('#000000')
      .text('Concours d\'entree a l\'universite — Annee 2025-2026', 60, 149, { width: 475, align: 'center' });

    doc.moveDown(2);

    // ── SECTION CANDIDAT ──────────────────────────────────────
    doc.rect(60, 178, 475, 22).fill('#008751');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text('INFORMATIONS DU CANDIDAT', 70, 183);

    doc.fillColor('#000000');
    const infos = [
      ['Matricule', candidat.matricule],
      ['Nom et Prenom', candidat.nom + ' ' + candidat.prenom],
      ['Date de naissance', candidat.dateNaiss
        ? new Date(candidat.dateNaiss).toLocaleDateString('fr-FR')
        : 'Non renseignee'],
      ['Lieu de naissance', candidat.lieuNaiss || 'Non renseigne'],
      ['Email', candidat.email],
      ['Telephone', candidat.telephone || 'Non renseigne'],
    ];

   let y = 212;
infos.forEach(([label, valeur], i) => {
  if (i % 2 === 0) {
    doc.rect(60, y, 475, 25).fill('#F0FFF4');
  }
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#008751')
    .text(label + ' : ', 70, y + 6, { width: 150 });
  doc.font('Helvetica').fillColor('#000000')
    .text(valeur, 230, y + 6, { width: 290 });
  y += 28;
});

    // ── SECTION CONCOURS ──────────────────────────────────────
    y += 10;
    doc.rect(60, y, 475, 22).fill('#E8112D');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text('INFORMATIONS DU CONCOURS', 70, y + 5);

    y += 30;
    const infoConcours = [
      ['Concours', concours.libelle],
      ['Date debut', new Date(concours.dateDebut).toLocaleDateString('fr-FR')],
      ['Date fin', new Date(concours.dateFin).toLocaleDateString('fr-FR')],
      ['Description', concours.description || 'Non renseignee'],
    ];

    infoConcours.forEach(([label, valeur], i) => {
  if (i % 2 === 0) {
    doc.rect(60, y, 475, 25).fill('#FFF8E1');
  }
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#E8112D')
    .text(label + ' : ', 70, y + 6, { width: 150 });
  doc.font('Helvetica').fillColor('#000000')
    .text(valeur, 230, y + 6, { width: 290 });
  y += 28;
});

    // ── AVERTISSEMENT ─────────────────────────────────────────
    y += 20;
    doc.rect(60, y, 475, 55).fill('#FCD116');
    doc.rect(63, y + 3, 469, 49).fill('#FFFDE7');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#E8112D')
      .text('IMPORTANT :', 70, y + 8);
    doc.font('Helvetica').fillColor('#000000')
      .text('Le candidat est prie de se presenter muni de cette convocation et d\'une piece d\'identite valide.', 70, y + 20, { width: 455 })
      .text('Tout retard ou absence non justifiee entraine l\'annulation de l\'inscription.', 70, y + 32, { width: 455 });

    // ── SIGNATURE ─────────────────────────────────────────────
    y += 80;
    doc.fontSize(11).font('Helvetica').fillColor('#000000')
      .text('Fait a Abomey-Calavi, le ' + new Date().toLocaleDateString('fr-FR'), 60, y, { align: 'right' });
    y += 20;
    doc.text('Le Directeur General de l\'Enseignement Superieur', 60, y, { align: 'right' });

    // ── BANDEAU BAS tricolore ─────────────────────────────────
    doc.rect(0, 780, 198, 8).fill('#008751');
    doc.rect(198, 780, 199, 8).fill('#FCD116');
    doc.rect(397, 780, 198, 8).fill('#E8112D');

    // ── PIED DE PAGE ──────────────────────────────────────────
    doc.fontSize(8).font('Helvetica').fillColor('#888888')
      .text('Document genere automatiquement par UniPath — ' + new Date().toISOString(), 60, 770, { align: 'center', width: 475 });

    doc.end();
  });
};

module.exports = { genererConvocation };