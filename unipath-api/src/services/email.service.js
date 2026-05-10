const nodemailer = require('nodemailer');
const { getFrontendUrl } = require('../utils/url.helper');

// Configuration du transporteur SMTP avec gestion d'erreur améliorée
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Pour éviter les erreurs de certificat en dev
  }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Erreur de configuration SMTP:', error);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
    console.log(`🌐 Frontend URL: ${getFrontendUrl()}`);
  }
});

class EmailService {
  /**
   * Méthode générique pour envoyer un email avec gestion d'erreur
   */
  async envoyerEmail(mailOptions) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé: ${info.messageId}`);
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response 
      };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
  }

  /**
   * Email de confirmation de compte
   */
  async envoyerEmailConfirmation(data) {
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '[UniPath] Confirmez votre adresse email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Merci de vous être inscrit sur la plateforme UniPath ! Pour activer votre compte et accéder à votre espace candidat, 
              veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.confirmationUrl}" 
                 style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                ✓ Confirmer mon email
              </a>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>⚠️ Important :</strong></p>
              <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">
                Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier de candidature.
              </p>
            </div>

            <p style="color:#888; font-size:12px; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
              <a href="${data.confirmationUrl}" style="color: #3b82f6; word-break: break-all; font-size: 11px;">${data.confirmationUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026<br/>
              Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
          </div>
        </div>
      `
    };

    return await this.envoyerEmail(mailOptions);
  }
  /**
   * Email de pré-inscription avec fiche PDF
   */
  async envoyerEmailPreInscription(data, pdfPath = null) {
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.candidatEmail,
      subject: '[UniPath] Confirmation de votre pré-inscription',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pré-inscription confirmée</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Votre pré-inscription au concours <strong>${data.concours}</strong> a bien été enregistrée.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📋 Concours :</strong> ${data.concours}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> ${data.numeroDossier}</p>
            </div>

            ${pdfPath ? `
              <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  <strong>📎 Fiche de pré-inscription jointe</strong><br/>
                  <span style="font-size: 13px;">Votre fiche de pré-inscription est jointe à cet email.</span>
                </p>
              </div>
            ` : ''}

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📌 Prochaines étapes :</strong></p>
              <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 13px;">
                La commission étudiera votre dossier et vous serez notifié par email de la décision.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026
            </p>
          </div>
        </div>
      `
    };

    if (pdfPath) {
      mailOptions.attachments = [{
        filename: `fiche-preinscription-${data.numeroDossier}.pdf`,
        path: pdfPath
      }];
    }

    return await this.envoyerEmail(mailOptions);
  }

  /**
   * Email de validation/convocation avec PDF
   */
  async envoyerEmailValidation(data, pdfPath = null) {
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.candidatEmail,
      subject: `[UniPath] 🎉 Convocation au concours ${data.concours}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #008751 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Dossier validé !</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Félicitations ! Votre dossier pour le concours <strong>${data.concours}</strong> a été validé par la commission.
            </p>

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #16a34a;">
              <p style="margin: 0; font-size: 14px; color: #166534;"><strong>🎫 Numéro de dossier :</strong> ${data.numeroDossier}</p>
              ${data.dateExamen ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📅 Date de l'examen :</strong> ${data.dateExamen}</p>` : ''}
              ${data.lieuExamen ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;"><strong>📍 Lieu :</strong> ${data.lieuExamen}</p>` : ''}
            </div>

            ${pdfPath ? `
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>📎 Convocation officielle jointe</strong><br/>
                  <span style="font-size: 13px;">Votre convocation officielle est jointe à cet email.</span>
                </p>
              </div>
            ` : ''}

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>⚠️ Important :</strong><br/>
                <span style="font-size: 13px;">Présentez-vous avec cette convocation et une pièce d'identité valide le jour de l'examen.</span>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026<br/>
              Bonne chance pour votre concours !
            </p>
          </div>
        </div>
      `
    };

    if (pdfPath) {
      mailOptions.attachments = [{
        filename: `convocation-${data.candidatNom}-${data.candidatPrenom}.pdf`,
        path: pdfPath
      }];
    }

    return await this.envoyerEmail(mailOptions);
  }

  /**
   * Email de convocation (alias)
   */
  async envoyerEmailConvocation(data, pdfPath = null) {
    return await this.envoyerEmailValidation(data, pdfPath);
  }

  /**
   * Email de rejet
   */
  async envoyerEmailRejet(data) {
    const frontendUrl = getFrontendUrl();
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.candidatEmail,
      subject: `[UniPath] Décision concernant votre candidature - ${data.concours}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Décision de la commission</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Nous vous informons que votre dossier pour le concours <strong>${data.concours}</strong> n'a malheureusement pas été retenu par la commission.
            </p>

            ${data.motif ? `
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Motif :</strong></p>
                <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 13px;">${data.motif}</p>
              </div>
            ` : ''}

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Nous vous encourageons à consulter les autres concours disponibles sur la plateforme UniPath.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/concours" 
                 style="background: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Voir les autres concours
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026
            </p>
          </div>
        </div>
      `
    };

    return await this.envoyerEmail(mailOptions);
  }

  /**
   * Email de validation sous réserve
   */
  async envoyerEmailSousReserve(data) {
    const frontendUrl = getFrontendUrl();
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.candidatEmail,
      subject: `[UniPath] ⚠️ Dossier accepté sous réserve - ${data.concours}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Dossier accepté sous réserve</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Votre dossier pour le concours <strong>${data.concours}</strong> a été accepté sous réserve par la commission.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;"><strong>🎫 Numéro de dossier :</strong> ${data.numeroDossier}</p>
            </div>

            ${data.motif ? `
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>📋 Conditions à remplir :</strong></p>
                <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px;">${data.motif}</p>
              </div>
            ` : ''}

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>⚠️ Action requise :</strong><br/>
                <span style="font-size: 13px;">Vous devez régulariser votre situation avant la date du concours. Veuillez compléter ou corriger les éléments mentionnés ci-dessus dans les plus brefs délais.</span>
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/dashboard" 
                 style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Compléter mon dossier
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026
            </p>
          </div>
        </div>
      `
    };

    return await this.envoyerEmail(mailOptions);
  }

  /**
   * Email de bienvenue après confirmation de compte
   */
  async envoyerEmailBienvenue(data) {
    const frontendUrl = getFrontendUrl();
    const mailOptions = {
      from: `"UniPath - Université d'Abomey-Calavi" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '[UniPath] Bienvenue sur la plateforme',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Bienvenue sur UniPath</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Votre compte a été créé et confirmé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme UniPath.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;"><strong>📧 Email :</strong> ${data.email}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;"><strong>🎫 Matricule :</strong> ${data.matricule}</p>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>📝 Prochaines étapes :</strong></p>
              <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af; font-size: 13px;">
                <li>Complétez votre profil personnel</li>
                <li>Déposez vos pièces justificatives</li>
                <li>Consultez les concours disponibles</li>
                <li>Inscrivez-vous aux concours de votre choix</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/login" 
                 style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                🚀 Accéder à mon compte
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
              <strong>Université d'Abomey-Calavi</strong><br/>
              Année Académique 2025-2026<br/>
              Pour toute question, contactez-nous à ${process.env.EMAIL_FROM}
            </p>
          </div>
        </div>
      `
    };

    return await this.envoyerEmail(mailOptions);
  }
}

module.exports = new EmailService();