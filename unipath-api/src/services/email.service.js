const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  /**
   * Email de pré-inscription avec fiche PDF
   */
  async envoyerEmailPreInscription(data, pdfPath = null) {
    try {
      const mailOptions = {
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.candidatEmail,
        subject: '[UniPath] Confirmation de votre pré-inscription',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #008751;">Pré-inscription confirmée</h2>
            <p>Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            <p>Votre pré-inscription au concours <strong>${data.concours}</strong> a bien été enregistrée.</p>
            <p>Numéro de dossier : <strong>${data.numeroDossier}</strong></p>
            <p>La commission étudiera votre dossier et vous serez notifié par email.</p>
            ${pdfPath ? '<p><strong>📎 Votre fiche de pré-inscription est jointe à cet email.</strong></p>' : ''}
            <hr/>
            <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
          </div>
        `
      };

      // Ajouter la pièce jointe si fournie
      if (pdfPath) {
        mailOptions.attachments = [{
          filename: `fiche-preinscription-${data.numeroDossier}.pdf`,
          path: pdfPath
        }];
      }

      await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email de pré-inscription envoyé à ${data.candidatEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  /**
   * Email de validation/convocation avec PDF
   */
  async envoyerEmailValidation(data, pdfPath = null) {
    try {
      const mailOptions = {
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.candidatEmail,
        subject: `[UniPath] Convocation au concours ${data.concours}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #008751;">Votre dossier a été validé !</h2>
            <p>Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            <p>Votre dossier pour le concours <strong>${data.concours}</strong> a été validé.</p>
            <p><strong>Numéro de dossier :</strong> ${data.numeroDossier}</p>
            ${data.dateExamen ? `<p><strong>Date de l'examen :</strong> ${data.dateExamen}</p>` : ''}
            ${data.lieuExamen ? `<p><strong>Lieu :</strong> ${data.lieuExamen}</p>` : ''}
            ${pdfPath ? '<p><strong>📎 Votre convocation officielle est jointe à cet email.</strong></p>' : ''}
            <p style="color:#dc2626;"><strong>⚠️ Présentez-vous avec cette convocation et une pièce d\'identité valide.</strong></p>
            <hr/>
            <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
          </div>
        `
      };

      // Ajouter la pièce jointe si fournie
      if (pdfPath) {
        mailOptions.attachments = [{
          filename: `convocation-${data.candidatNom}-${data.candidatPrenom}.pdf`,
          path: pdfPath
        }];
      }

      await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email de validation envoyé à ${data.candidatEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  /**
   * Email de convocation (alias avec PDF)
   */
  async envoyerEmailConvocation(data, pdfPath = null) {
    return await this.envoyerEmailValidation(data, pdfPath);
  }

  /**
   * Email de rejet
   */
  async envoyerEmailRejet(data) {
    try {
      await transporter.sendMail({
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.candidatEmail,
        subject: `[UniPath] Décision concernant votre candidature - ${data.concours}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #dc2626;">Décision de la commission</h2>
            <p>Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            <p>Votre dossier pour le concours <strong>${data.concours}</strong> n'a pas été retenu.</p>
            ${data.motif ? `<p><strong>Motif :</strong> ${data.motif}</p>` : ''}
            <hr/>
            <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
          </div>
        `
      });
      
      console.log(`✅ Email de rejet envoyé à ${data.candidatEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();