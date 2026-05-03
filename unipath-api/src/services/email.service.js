const nodemailer = require('nodemailer');
const fs = require('fs');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Email de pré-inscription ──────────────────────────────────
const envoyerEmailPreInscription = async ({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath }) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    await transporter.sendMail({
      from: `"UniPath" <${process.env.EMAIL_FROM}>`,
      to: candidatEmail,
      subject: '[UniPath] Confirmation de votre pré-inscription',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #008751;">Pré-inscription confirmée</h2>
          <p>Bonjour <strong>${candidatPrenom} ${candidatNom}</strong>,</p>
          <p>Votre pré-inscription au concours <strong>${concours}</strong> a bien été enregistrée.</p>
          <p>Numéro de dossier : <strong>${numeroDossier}</strong></p>
          <p>Votre fiche de pré-inscription est jointe à cet email. La commission étudiera votre dossier et vous serez notifié par email.</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
        </div>
      `,
      attachments: [
        {
          filename: `fiche-preinscription-${numeroDossier}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log(`✅ Email de pré-inscription envoyé à ${candidatEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email pré-inscription:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

// ── Email de convocation ──────────────────────────────────────
const envoyerEmailConvocation = async ({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath, dateExamen, lieuExamen }) => {
  try {
    const mailOptions = {
      from: `"UniPath" <${process.env.EMAIL_FROM}>`,
      to: candidatEmail,
      subject: `[UniPath] Convocation au concours ${concours}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #008751;">Votre dossier a été validé !</h2>
          <p>Bonjour <strong>${candidatPrenom} ${candidatNom}</strong>,</p>
          <p>Nous avons le plaisir de vous informer que votre dossier pour le concours <strong>${concours}</strong> a été validé par la commission.</p>
          <p><strong>Numéro de dossier :</strong> ${numeroDossier}</p>
          ${dateExamen ? `<p><strong>Date de l'examen :</strong> ${dateExamen}</p>` : ''}
          ${lieuExamen ? `<p><strong>Lieu :</strong> ${lieuExamen}</p>` : ''}
          <p>Votre convocation officielle ${pdfPath ? 'est jointe à cet email' : 'sera disponible sur votre espace candidat'}. <strong>Veuillez ${pdfPath ? 'l\'imprimer et ' : ''}la présenter le jour de l'examen avec une pièce d'identité valide.</strong></p>
          <p style="color: #d97706; font-weight: bold;">⚠️ Tout retard ou absence non justifiée entraîne l'annulation de votre inscription.</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
        </div>
      `,
    };

    // Ajouter le PDF en pièce jointe si disponible
    if (pdfPath && fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      mailOptions.attachments = [
        {
          filename: `convocation-${numeroDossier}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ];
    }

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email de convocation envoyé à ${candidatEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email convocation:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

// ── Email de validation (avec convocation) ────────────────────
const envoyerEmailValidation = async ({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath, dateExamen, lieuExamen }) => {
  // Utilise la même fonction que envoyerEmailConvocation
  return envoyerEmailConvocation({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath, dateExamen, lieuExamen });
};

// ── Email de rejet ────────────────────────────────────────────
const envoyerEmailRejet = async ({ candidatEmail, candidatNom, candidatPrenom, concours, motif }) => {
  try {
    await transporter.sendMail({
      from: `"UniPath" <${process.env.EMAIL_FROM}>`,
      to: candidatEmail,
      subject: `[UniPath] Décision concernant votre candidature - ${concours}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #dc2626;">Décision de la commission</h2>
          <p>Bonjour <strong>${candidatPrenom} ${candidatNom}</strong>,</p>
          <p>Nous avons le regret de vous informer que votre dossier pour le concours <strong>${concours}</strong> n'a pas été retenu par la commission.</p>
          ${motif ? `<p><strong>Motif :</strong> ${motif}</p>` : ''}
          <p>Nous vous encourageons à postuler à nouveau lors des prochaines sessions de concours.</p>
          <p>Pour toute question, n'hésitez pas à contacter le service des concours.</p>
          <hr/>
          <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
        </div>
      `,
    });
    
    console.log(`✅ Email de rejet envoyé à ${candidatEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email rejet:', error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
};

module.exports = {
  envoyerEmailPreInscription,
  envoyerEmailConvocation,
  envoyerEmailValidation,
  envoyerEmailRejet,
};