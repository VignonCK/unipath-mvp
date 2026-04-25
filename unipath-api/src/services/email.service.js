const nodemailer = require('nodemailer');
const fs = require('fs');

const transporter = nodemailer.createTransporter({
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

module.exports = {
  envoyerEmailPreInscription,
};