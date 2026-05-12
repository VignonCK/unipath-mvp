/**
 * Email Service - Refactored with Queue System
 * 
 * All emails are queued for asynchronous processing by the email worker
 * Provides non-blocking email sending with retry logic and rate limiting
 */

const { PrismaClient } = require('@prisma/client');
const { validateEmail, validateParams } = require('../utils/validation');
const rateLimiter = require('./rate-limiter');
const emailConfig = require('../config/email.config');
const logger = require('../config/logger');
const { getFrontendUrl } = require('../utils/url.helper');

const prisma = new PrismaClient();

class EmailService {
  /**
   * Generic method to create an email in the queue
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} { emailId, status: 'QUEUED' }
   */
  async createEmail({ userId, recipient, subject, htmlBody, textBody, attachments = [], emailType }) {
    // 1. Validation
    if (!validateEmail(recipient)) {
      throw new Error(`Invalid email address: ${recipient}`);
    }

    if (!subject || !htmlBody) {
      throw new Error('Subject and htmlBody are required');
    }

    // 2. Rate limiting (only if userId provided)
    if (userId) {
      try {
        await rateLimiter.checkRateLimit(userId);
      } catch (error) {
        logger.rateLimitExceeded(userId, rateLimiter.rateLimitPerUser, error.message);
        throw error;
      }
    }

    // 3. Create email entry in database with content
    const email = await prisma.emailDelivery.create({
      data: {
        userId,
        recipient,
        subject,
        htmlBody,
        textBody: textBody || this.htmlToText(htmlBody),
        attachments: attachments.length > 0 ? attachments : null,
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      },
    });

    logger.emailQueued(email.id, recipient, subject, userId);
    console.log(`[EmailService] ✅ Email queued: ${email.id} to ${recipient}`);

    return { emailId: email.id, status: 'QUEUED' };
  }

  /**
   * Convert HTML to plain text (simple implementation)
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Email de confirmation de compte
   * @param {Object} data - { email, nom, prenom, confirmationToken }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailConfirmation(data) {
    validateParams(data, ['email', 'nom', 'prenom']);

    const confirmationToken = data.confirmationToken || data.token;
    if (!confirmationToken) {
      throw new Error('confirmationToken is required');
    }

    const frontendUrl = getFrontendUrl();
    const confirmationUrl = `${frontendUrl}/confirmer-email?token=${confirmationToken}`;
    
    const subject = '[UniPath] Confirmez votre adresse email';
    const htmlBody = `
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
            <a href="${confirmationUrl}" 
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
            <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all; font-size: 11px;">${confirmationUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
            <strong>Université d'Abomey-Calavi</strong><br/>
            Année Académique ${emailConfig.app.academicYear}<br/>
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: null,  // Candidat not yet created
      recipient: data.email,
      subject,
      htmlBody,
      emailType: 'CONFIRMATION',
    });
  }

  /**
   * Email de bienvenue après confirmation de compte
   * @param {Object} data - { email, nom, prenom, matricule, userId }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailBienvenue(data) {
    validateParams(data, ['email', 'nom', 'prenom', 'matricule']);

    const frontendUrl = getFrontendUrl();
    const loginUrl = `${frontendUrl}/login`;
    
    const subject = '[UniPath] Bienvenue sur la plateforme';
    const htmlBody = `
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
            <a href="${loginUrl}" 
               style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              🚀 Accéder à mon compte
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
          <p style="color:#888; font-size:12px; text-align: center; margin: 0;">
            <strong>Université d'Abomey-Calavi</strong><br/>
            Année Académique ${emailConfig.app.academicYear}<br/>
            Pour toute question, contactez-nous à ${emailConfig.smtp.from.email}
          </p>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.userId || data.candidatId,  // Candidat exists now
      recipient: data.email,
      subject,
      htmlBody,
      emailType: 'BIENVENUE',
    });
  }

  /**
   * Email de pré-inscription avec fiche PDF
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, userId }
   * @param {string} pdfPath - Path to PDF file (optional)
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailPreInscription(data, pdfPath = null) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'concours', 'numeroDossier']);

    const subject = '[UniPath] Confirmation de votre pré-inscription';
    const htmlBody = `
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
            Année Académique ${emailConfig.app.academicYear}
          </p>
        </div>
      </div>
    `;

    const attachments = pdfPath ? [{
      filename: `fiche-preinscription-${data.numeroDossier}.pdf`,
      path: pdfPath,
    }] : [];

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      attachments,
      emailType: 'PRE_INSCRIPTION',
    });
  }

  /**
   * Email de convocation avec PDF
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, dateExamen, lieuExamen, userId }
   * @param {string} pdfPath - Path to PDF file (optional)
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailConvocation(data, pdfPath = null) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'concours', 'numeroDossier']);

    const subject = `[UniPath] 🎉 Convocation au concours ${data.concours}`;
    const htmlBody = `
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
            Année Académique ${emailConfig.app.academicYear}<br/>
            Bonne chance pour votre concours !
          </p>
        </div>
      </div>
    `;

    const attachments = pdfPath ? [{
      filename: `convocation-${data.candidatNom}-${data.candidatPrenom}.pdf`,
      path: pdfPath,
    }] : [];

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      attachments,
      emailType: 'CONVOCATION',
    });
  }

  /**
   * Alias for envoyerEmailConvocation (for backward compatibility)
   */
  async envoyerEmailValidation(data, pdfPath = null) {
    return this.envoyerEmailConvocation(data, pdfPath);
  }

  /**
   * Email de rejet
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, concours, motif, userId }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailRejet(data) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'concours']);

    const frontendUrl = getFrontendUrl();
    const motifFinal = data.motif || "Votre dossier ne répond pas aux critères d'admission";
    
    const subject = `[UniPath] Décision concernant votre candidature - ${data.concours}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Décision de la commission</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Nous vous informons que votre dossier pour le concours <strong>${data.concours}</strong> n'a malheureusement pas été retenu par la commission.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Motif :</strong></p>
            <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 13px;">${motifFinal}</p>
          </div>

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
            Année Académique ${emailConfig.app.academicYear}
          </p>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      emailType: 'REJET',
    });
  }

  /**
   * Email de validation sous réserve
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, motif, userId }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailSousReserve(data) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'concours', 'numeroDossier']);

    const frontendUrl = getFrontendUrl();
    const conditions = data.motif || "Veuillez compléter votre dossier selon les instructions de la commission";
    const dateLimite = new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
    
    const subject = `[UniPath] ⚠️ Dossier accepté sous réserve - ${data.concours}`;
    const htmlBody = `
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

          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>📋 Conditions à remplir :</strong></p>
            <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px;">${conditions}</p>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>⚠️ Action requise :</strong><br/>
              <span style="font-size: 13px;">Vous devez régulariser votre situation avant le <strong>${dateLimite}</strong> (48 heures). Veuillez compléter ou corriger les éléments mentionnés ci-dessus dans les plus brefs délais.</span>
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
            Année Académique ${emailConfig.app.academicYear}
          </p>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      emailType: 'SOUS_RESERVE',
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
