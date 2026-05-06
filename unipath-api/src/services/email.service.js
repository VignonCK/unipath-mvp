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

  /**
   * Email de validation sous réserve
   */
  async envoyerEmailSousReserve(data) {
    try {
      await transporter.sendMail({
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.candidatEmail,
        subject: `[UniPath] Dossier accepté sous réserve - ${data.concours}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #f97316;">Dossier accepté sous réserve</h2>
            <p>Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            <p>Votre dossier pour le concours <strong>${data.concours}</strong> a été accepté sous réserve.</p>
            ${data.motif ? `
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #9a3412;"><strong>Conditions à remplir :</strong></p>
                <p style="margin: 10px 0 0 0; color: #9a3412;">${data.motif}</p>
              </div>
            ` : ''}
            <p><strong>Numéro de dossier :</strong> ${data.numeroDossier}</p>
            <p style="color:#dc2626;"><strong>⚠️ Vous devez régulariser votre situation avant la date du concours.</strong></p>
            <p>Veuillez compléter ou corriger les éléments mentionnés ci-dessus dans les plus brefs délais.</p>
            <hr/>
            <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année 2025-2026</p>
          </div>
        `
      });

      console.log(`✅ Email de validation sous réserve envoyé à ${data.candidatEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }

  /**
   * Email de bienvenue après création de compte
   */
  async envoyerEmailBienvenue(data) {
    try {
      await transporter.sendMail({
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.email,
        subject: '[UniPath] Bienvenue sur la plateforme',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎓 Bienvenue sur UniPath</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px;">
              <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
              
              <p>Votre compte a été créé avec succès ! Vous pouvez maintenant accéder à la plateforme UniPath.</p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📧 Email :</strong> ${data.email}</p>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📝 Prochaines étapes :</strong></p>
                <ol style="margin: 10px 0 0 0;">
                  <li>Complétez votre profil</li>
                  <li>Déposez vos pièces justificatives</li>
                  <li>Inscrivez-vous aux concours</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" 
                   style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Accéder à mon compte
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
              <p style="color:#888; font-size:12px; text-align: center;">
                Université d'Abomey-Calavi | Année 2025-2026<br/>
                Pour toute question, contactez-nous
              </p>
            </div>
          </div>
        `
      });

      console.log(`✅ Email de bienvenue envoyé à ${data.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email de bienvenue:', error);
      throw error;
    }
  }

  /**
   * Email de confirmation de compte
   */
  async envoyerEmailConfirmation(data) {
    try {
      await transporter.sendMail({
        from: `"UniPath" <${process.env.EMAIL_FROM}>`,
        to: data.email,
        subject: '[UniPath] Confirmez votre adresse email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎓 Confirmez votre compte UniPath</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px;">
              <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
              
              <p>Merci de vous être inscrit sur UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationUrl}" 
                   style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Confirmer mon email
                </a>
              </div>

              <p style="color:#888; font-size:12px;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                <a href="${data.confirmationUrl}" style="color: #3b82f6; word-break: break-all;">${data.confirmationUrl}</a>
              </p>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
                <p style="margin: 10px 0 0 0;">Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier.</p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
              <p style="color:#888; font-size:12px; text-align: center;">
                Université d'Abomey-Calavi | Année 2025-2026<br/>
                Si vous n'avez pas créé de compte, ignorez cet email.
              </p>
            </div>
          </div>
        `
      });

      console.log(`✅ Email de confirmation envoyé à ${data.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email de confirmation:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();