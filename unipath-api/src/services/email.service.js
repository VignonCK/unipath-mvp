/**
 * Email Service - Refactored with Queue System
 * 
 * All emails are queued for asynchronous processing by the email worker
 * Provides non-blocking email sending with retry logic and rate limiting
 */

const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const { validateEmail, validateParams } = require('../utils/validation');
const rateLimiter = require('./rate-limiter');
const emailConfig = require('../config/email.config');
const logger = require('../config/logger');
const { getFrontendUrl } = require('../utils/url.helper');

const prisma = require('../prisma');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientSmtpError(err) {
  const code = String(err?.code || '');
  const message = String(err?.message || '').toLowerCase();
  return (
    code === 'ECONNRESET'
    || code === 'ETIMEDOUT'
    || code === 'ECONNREFUSED'
    || code === 'ESOCKET'
    || code === 'EPIPE'
    || message.includes('econnreset')
    || message.includes('timeout')
    || message.includes('socket')
  );
}

class EmailService {
  constructor() {
    this._transporter = null;
  }

  getTransporter(config = null) {
    if (!this._transporter || config) {
      this.resetTransporter();
      this._transporter = nodemailer.createTransport(
        config || emailConfig.getTransporterConfig()
      );
    }
    return this._transporter;
  }

  resetTransporter() {
    if (this._transporter) {
      try {
        this._transporter.close();
      } catch (_) {
        // ignore
      }
      this._transporter = null;
    }
  }

  /**
   * Generic method to create an email in the queue
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} { emailId, status: 'QUEUED' | 'SENT' }
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

    const plainText = textBody || this.htmlToText(htmlBody);

    // 3. Create email entry in database with content
    const email = await prisma.emailDelivery.create({
      data: {
        userId,
        recipient,
        subject,
        htmlBody,
        textBody: plainText,
        attachments: attachments.length > 0 ? attachments : null,
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      },
    });

    logger.emailQueued(email.id, recipient, subject, userId);
    console.log(`[EmailService] ✅ Email queued: ${email.id} to ${recipient}`);

    // 4. Si le worker est désactivé, envoyer immédiatement (SMTP requis)
    if (!emailConfig.isQueueEnabled()) {
      await this.sendEmailNow(email, plainText);
      return { emailId: email.id, status: 'SENT' };
    }

    return { emailId: email.id, status: 'QUEUED' };
  }

  /**
   * Envoi SMTP synchrone (utilisé quand EMAIL_QUEUE_ENABLED=false).
   * Retries + bascule 587 ↔ 465 sur erreurs réseau transitoires.
   */
  async sendEmailNow(email, plainText, { maxAttemptsPerConfig = 2 } = {}) {
    if (!emailConfig.smtp?.host || !emailConfig.smtp?.auth?.user) {
      throw new Error(
        'Envoi email impossible : SMTP non configuré et EMAIL_QUEUE_ENABLED=false. '
        + 'Configurez SMTP_* dans .env ou activez EMAIL_QUEUE_ENABLED=true.'
      );
    }

    const configs = emailConfig.getFallbackTransporterConfigs();
    let lastError = null;
    let attemptGlobal = 0;

    // Pièces jointes stockées en JSON (path ou content)
    let attachments = [];
    if (email.attachments) {
      const raw = typeof email.attachments === 'string'
        ? JSON.parse(email.attachments)
        : email.attachments;
      if (Array.isArray(raw)) attachments = raw;
    }

    for (const config of configs) {
      for (let attempt = 1; attempt <= maxAttemptsPerConfig; attempt++) {
        attemptGlobal += 1;
        try {
          const transporter = this.getTransporter(config);
          const info = await transporter.sendMail({
            from: emailConfig.getFromAddress(),
            to: email.recipient,
            subject: email.subject,
            html: email.htmlBody,
            text: plainText || email.textBody || undefined,
            ...(attachments.length > 0 ? { attachments } : {}),
          });

          await prisma.emailDelivery.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              messageId: info.messageId || null,
              sentAt: new Date(),
              attempts: (email.attempts || 0) + attemptGlobal,
              lastAttemptAt: new Date(),
              errorMessage: null,
              smtpCode: null,
            },
          });
          console.log(
            `[EmailService] ✅ Email envoyé: ${email.id} → ${email.recipient}`
            + ` via ${config.host}:${config.port}`
            + (attachments.length ? ` (${attachments.length} pièce(s) jointe(s))` : '')
            + (attemptGlobal > 1 ? ` (essai ${attemptGlobal})` : '')
          );
          return info;
        } catch (err) {
          lastError = err;
          console.warn(
            `[EmailService] ⚠️ Échec envoi ${email.id}`
            + ` via ${config.host}:${config.port}`
            + ` (essai ${attempt}/${maxAttemptsPerConfig}):`,
            err.code || '',
            err.message
          );
          this.resetTransporter();
          if (attempt < maxAttemptsPerConfig && isTransientSmtpError(err)) {
            await sleep(600 * attempt);
            continue;
          }
          // Erreur non transitoire ou fin des essais pour cette config → config suivante
          break;
        }
      }
    }

    await prisma.emailDelivery.update({
      where: { id: email.id },
      data: {
        status: 'FAILED',
        attempts: (email.attempts || 0) + attemptGlobal,
        lastAttemptAt: new Date(),
        errorMessage: lastError?.message?.slice(0, 500) || 'Erreur SMTP',
        smtpCode: lastError?.code || null,
      },
    }).catch(() => {});

    throw lastError;
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
    const confirmationUrl = `${frontendUrl}/auth/confirm?token=${confirmationToken}`;
    
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

  /**
   * Email sous réserve — pré-inscription établissement (Module 2)
   */
  async envoyerEmailSousReserveEtablissement(data) {
    validateParams(data, [
      'candidatEmail',
      'candidatNom',
      'candidatPrenom',
      'etablissementNom',
      'filiereNom',
      'numeroPreinscription',
      'motif',
    ]);

    const frontendUrl = getFrontendUrl();
    const subject = '[UniPath] Dossier accepté sous réserve — action requise';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Dossier sous réserve</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Votre pré-inscription à <strong>${data.etablissementNom}</strong>
            (${data.filiereNom}) a été acceptée <strong>sous réserve</strong>.
          </p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 18px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>N° :</strong> ${data.numeroPreinscription}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Niveau :</strong> ${data.niveau ?? '—'}</p>
          </div>
          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>À corriger / compléter :</strong></p>
            <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px; white-space: pre-wrap;">${data.motif}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">
            Vous pouvez remplacer les pièces demandées et/ou modifier votre niveau d'étude, puis resoumettre votre dossier depuis votre espace UniPath.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${frontendUrl}/parcours/dossiers"
               style="background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Corriger mon dossier
            </a>
          </div>
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

  /**
   * Email de confirmation d'inscription academique (Module 2)
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, filiereNom, etablissementNom, anneeAcademique, niveau, userId, numeroInscription? }
   * @param {string|null} pdfPath - Fiche d'inscription PDF (optionnel)
   */
  async envoyerEmailInscriptionAcademique(data, pdfPath = null) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'filiereNom', 'etablissementNom', 'anneeAcademique', 'niveau']);

    const subject = '[UniPath] Confirmation de votre inscription academique';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">📘 Inscription academique validee</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Votre dossier a ete valide par l'etablissement. Votre inscription academique est confirmee.
          </p>
          <div style="background: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
            ${data.numeroInscription ? `<p style="margin: 0; font-size: 14px; color: #374151;"><strong>Numero :</strong> ${data.numeroInscription}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Filiere :</strong> ${data.filiereNom}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Etablissement :</strong> ${data.etablissementNom}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Annee :</strong> ${data.anneeAcademique}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Niveau :</strong> ${data.niveau}</p>
          </div>
          ${pdfPath ? `
            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                <strong>📎 Fiche jointe</strong><br/>
                <span style="font-size: 13px;">Votre fiche officielle d'inscription est jointe a cet email. Vous pouvez aussi la telecharger depuis votre espace etudiant.</span>
              </p>
            </div>
          ` : `
          <p style="font-size: 13px; color: #6b7280;">
            Vous pouvez suivre l'evolution de votre parcours directement depuis votre espace etudiant.
          </p>
          `}
        </div>
      </div>
    `;

    const attachments = pdfPath ? [{
      filename: `fiche-inscription-${data.numeroInscription || 'etablissement'}.pdf`,
      path: pdfPath,
    }] : [];

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      attachments,
      emailType: 'SYSTEME',
    });
  }

  /**
   * Email de mise a jour du statut academique (Module 2)
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, filiereNom, anneeAcademique, niveau, statut, userId }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailStatutAcademique(data) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom', 'filiereNom', 'anneeAcademique', 'niveau', 'statut']);

    const libellesStatut = {
      EN_COURS: 'En cours',
      VALIDE: 'Valide',
      REDOUBLANT: 'Redoublant',
      ABANDONNE: 'Abandonne',
    };

    const statutLabel = libellesStatut[data.statut] || data.statut;
    const subject = `[UniPath] Mise a jour de votre statut academique (${statutLabel})`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">📊 Statut academique mis a jour</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Le statut de votre inscription academique a ete mis a jour.
          </p>
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Filiere :</strong> ${data.filiereNom}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Annee :</strong> ${data.anneeAcademique}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Niveau :</strong> ${data.niveau}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Nouveau statut :</strong> ${statutLabel}</p>
          </div>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      emailType: 'SYSTEME',
    });
  }

  /**
   * Email de notification pour generation de releve academique (Module 2)
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, totalInscriptions, moyenneGlobale, userId }
   * @returns {Promise<Object>} { emailId, status }
   */
  async envoyerEmailReleveAcademique(data) {
    validateParams(data, ['candidatEmail', 'candidatNom', 'candidatPrenom']);

    const moyenneText = typeof data.moyenneGlobale === 'number'
      ? `${data.moyenneGlobale}/20`
      : 'Non disponible';

    const subject = '[UniPath] Votre releve academique est disponible';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">📄 Releve academique</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Votre releve academique a ete genere sur UniPath et peut etre telecharge depuis votre espace etudiant.
          </p>
          <div style="background: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Inscriptions academiques :</strong> ${data.totalInscriptions || 0}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Moyenne globale :</strong> ${moyenneText}</p>
          </div>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      emailType: 'SYSTEME',
    });
  }

  /**
   * Email de pré-inscription établissement avec fiche PDF (Module 2)
   * @param {Object} data - { candidatEmail, candidatNom, candidatPrenom, etablissementNom, filiereNom, anneeAcademique, niveau, numeroPreinscription, userId }
   * @param {string} pdfPath - Path to PDF file (optional)
   */
  async envoyerEmailPreinscriptionEtablissement(data, pdfPath = null) {
    validateParams(data, [
      'candidatEmail',
      'candidatNom',
      'candidatPrenom',
      'etablissementNom',
      'filiereNom',
      'anneeAcademique',
      'niveau',
      'numeroPreinscription',
    ]);

    const subject = '[UniPath] Fiche de pré-inscription établissement';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">🏫 Pré-inscription établissement enregistrée</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.candidatPrenom} ${data.candidatNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Votre demande de pré-inscription a bien été enregistrée et transmise à l'établissement.
          </p>
          <div style="background: #f3f4f6; padding: 18px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Numéro :</strong> ${data.numeroPreinscription}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Etablissement :</strong> ${data.etablissementNom}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Filière :</strong> ${data.filiereNom}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Année :</strong> ${data.anneeAcademique}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;"><strong>Niveau :</strong> ${data.niveau}</p>
          </div>
          ${pdfPath ? `
            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                <strong>📎 Fiche jointe</strong><br/>
                <span style="font-size: 13px;">La fiche officielle de pré-inscription est jointe à cet email.</span>
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const attachments = pdfPath ? [{
      filename: `fiche-preinscription-etablissement-${data.numeroPreinscription}.pdf`,
      path: pdfPath,
    }] : [];

    return this.createEmail({
      userId: data.userId || data.candidatId,
      recipient: data.candidatEmail,
      subject,
      htmlBody,
      attachments,
      emailType: 'SYSTEME',
    });
  }

  /**
   * Email à l'examinateur lorsque le contrôleur arbitre différemment de son verdict.
   */
  async envoyerEmailArbitrageDivergentExaminateur(data) {
    validateParams(data, [
      'examinateurEmail',
      'examinateurNom',
      'examinateurPrenom',
      'numeroInscription',
      'concours',
      'verdictExaminateur',
      'decisionControleur',
      'motif',
    ]);

    const frontendUrl = getFrontendUrl();
    const subject = `[UniPath] Retour sur votre évaluation — arbitrage divergent (${data.numeroInscription})`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Arbitrage divergent</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Bonjour <strong>${data.examinateurPrenom} ${data.examinateurNom}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Le contrôleur a rendu une décision différente de la vôtre sur le dossier
            <strong>${data.numeroInscription}</strong> (${data.concours}).
          </p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;"><strong>Votre verdict :</strong> ${data.verdictExaminateur}</p>
            <p style="margin: 0;"><strong>Décision du contrôleur :</strong> ${data.decisionControleur}</p>
          </div>
          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #9a3412; font-size: 14px;"><strong>Motif du contrôleur :</strong></p>
            <p style="margin: 10px 0 0 0; color: #9a3412; font-size: 13px; white-space: pre-wrap;">${data.motif}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            Ce retour vous est transmis pour que vous puissiez en tenir compte dans vos prochaines évaluations.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/examinateur/dossiers"
               style="background: #1e3a8a; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Accéder à mes dossiers
            </a>
          </div>
        </div>
      </div>
    `;

    return this.createEmail({
      userId: data.examinateurId,
      recipient: data.examinateurEmail,
      subject,
      htmlBody,
      emailType: 'ARBITRAGE_DIVERGENT_EXAMINATEUR',
    });
  }

  /**
   * Email d'envoi des identifiants à la création d'un membre commission.
   * @param {Object} data - { email, nom, prenom, motDePasse, loginUrl }
   */
  async envoyerEmailIdentifiantsMembreCommission(data) {
    validateParams(data, ['email', 'nom', 'prenom', 'motDePasse', 'loginUrl']);
    const subject = '[UniPath] Accès membre de commission';
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">',
      '<h2>Bienvenue sur UniPath</h2>',
      `<p>Bonjour ${data.prenom} ${data.nom},</p>`,
      '<p>La DEC a créé votre compte membre de commission.</p>',
      `<p><strong>Email :</strong> ${data.email}</p>`,
      `<p><strong>Mot de passe temporaire :</strong> ${data.motDePasse}</p>`,
      `<p>Connexion : <a href="${data.loginUrl}">${data.loginUrl}</a></p>`,
      '<p><strong>Important :</strong> changez ce mot de passe dès votre première connexion.</p>',
      '</div>',
    ].join('');
    return this.createEmail({
      userId: data.userId || null,
      recipient: data.email,
      subject,
      htmlBody,
      textBody:
        `Bonjour ${data.prenom} ${data.nom}, votre compte commission UniPath : email ${data.email}, `
        + `mot de passe temporaire ${data.motDePasse}. Connexion : ${data.loginUrl}. `
        + 'Changez-le dès la première connexion.',
      emailType: 'COMMISSION_CREDENTIALS',
    });
  }

  /**
   * Email d'envoi d'un mot de passe temporaire (membre commission).
   * @param {Object} data - { email, nom, prenom, motDePasse, loginUrl }
   */
  async envoyerEmailMotDePasseTemporaireCommission(data) {
    validateParams(data, ['email', 'nom', 'prenom', 'motDePasse', 'loginUrl']);
    const subject = '[UniPath] Mot de passe temporaire Commission';
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">',
      '<h2>Mot de passe temporaire</h2>',
      `<p>Bonjour ${data.prenom} ${data.nom},</p>`,
      '<p>La DEC a réinitialisé votre mot de passe UniPath.</p>',
      `<p><strong>Email :</strong> ${data.email}</p>`,
      `<p><strong>Mot de passe temporaire :</strong> ${data.motDePasse}</p>`,
      `<p>Connexion : <a href="${data.loginUrl}">${data.loginUrl}</a></p>`,
      '<p><strong>Important :</strong> changez ce mot de passe dès votre première connexion.</p>',
      '</div>',
    ].join('');
    return this.createEmail({
      userId: data.userId || null,
      recipient: data.email,
      subject,
      htmlBody,
      textBody:
        `Bonjour ${data.prenom} ${data.nom}, votre mot de passe temporaire UniPath est : ${data.motDePasse}. `
        + `Connectez-vous sur ${data.loginUrl} et modifiez-le dès la première connexion.`,
      emailType: 'COMMISSION_TEMP_PASSWORD',
    });
  }

  /**
   * Email d'envoi des identifiants à la création d'un admin établissement privé.
   * @param {Object} data - { email, nom, prenom, motDePasse, loginUrl, etablissementNom? }
   */
  async envoyerEmailIdentifiantsAdminEtablissement(data) {
    validateParams(data, ['email', 'nom', 'prenom', 'motDePasse', 'loginUrl']);
    const etabLabel = data.etablissementNom
      ? ` pour l'établissement <strong>${data.etablissementNom}</strong>`
      : '';
    const subject = data.etablissementNom
      ? `[UniPath] Accès administrateur — ${data.etablissementNom}`
      : '[UniPath] Accès administrateur établissement';
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">',
      '<h2>Bienvenue sur UniPath</h2>',
      `<p>Bonjour ${data.prenom} ${data.nom},</p>`,
      `<p>La DGES a créé votre compte administrateur d'établissement${etabLabel}.</p>`,
      `<p><strong>Email :</strong> ${data.email}</p>`,
      `<p><strong>Mot de passe temporaire :</strong> ${data.motDePasse}</p>`,
      `<p>Connexion : <a href="${data.loginUrl}">${data.loginUrl}</a></p>`,
      '<p><strong>Important :</strong> changez ce mot de passe dès votre première connexion.</p>',
      '</div>',
    ].join('');
    return this.createEmail({
      userId: data.userId || null,
      recipient: data.email,
      subject,
      htmlBody,
      textBody:
        `Bonjour ${data.prenom} ${data.nom}, votre compte admin UniPath`
        + (data.etablissementNom ? ` pour ${data.etablissementNom}` : '')
        + ` : email ${data.email}, mot de passe temporaire ${data.motDePasse}. `
        + `Connexion : ${data.loginUrl}. Changez-le dès la première connexion.`,
      emailType: 'ADMIN_ETABLISSEMENT_CREDENTIALS',
    });
  }

  /**
   * Email d'envoi d'un mot de passe temporaire (admin établissement privé).
   * @param {Object} data - { email, nom, prenom, motDePasse, loginUrl, etablissementNom? }
   */
  async envoyerEmailMotDePasseTemporaireAdminEtablissement(data) {
    validateParams(data, ['email', 'nom', 'prenom', 'motDePasse', 'loginUrl']);
    const etabLabel = data.etablissementNom
      ? ` pour l'établissement <strong>${data.etablissementNom}</strong>`
      : '';
    const subject = '[UniPath] Mot de passe temporaire — Administrateur établissement';
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">',
      '<h2>Mot de passe temporaire</h2>',
      `<p>Bonjour ${data.prenom} ${data.nom},</p>`,
      `<p>La DGES a réinitialisé votre mot de passe UniPath${etabLabel}.</p>`,
      `<p><strong>Email :</strong> ${data.email}</p>`,
      `<p><strong>Mot de passe temporaire :</strong> ${data.motDePasse}</p>`,
      `<p>Connexion : <a href="${data.loginUrl}">${data.loginUrl}</a></p>`,
      '<p><strong>Important :</strong> changez ce mot de passe dès votre première connexion.</p>',
      '</div>',
    ].join('');
    return this.createEmail({
      userId: data.userId || null,
      recipient: data.email,
      subject,
      htmlBody,
      textBody:
        `Bonjour ${data.prenom} ${data.nom}, votre mot de passe temporaire UniPath est : ${data.motDePasse}. `
        + `Connectez-vous sur ${data.loginUrl} et modifiez-le dès la première connexion.`,
      emailType: 'ADMIN_ETABLISSEMENT_TEMP_PASSWORD',
    });
  }

  /**
   * Email de réinitialisation de mot de passe (auth locale)
   * @param {Object} data - { email, resetUrl }
   */
  async envoyerEmailReinitialisation(data) {
    validateParams(data, ['email', 'resetUrl']);
    const subject = '[UniPath] Réinitialisation de votre mot de passe';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe UniPath.</p>
        <p><a href="${data.resetUrl}" style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Choisir un nouveau mot de passe</a></p>
        <p style="font-size:12px;color:#666;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `;
    return this.createEmail({
      recipient: data.email,
      subject,
      htmlBody,
      textBody: `Réinitialisez votre mot de passe : ${data.resetUrl}`,
      emailType: 'PASSWORD_RESET',
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
