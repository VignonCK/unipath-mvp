const { Resend } = require('resend');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Email de pré-inscription ──────────────────────────────────
const envoyerEmailPreInscription = async ({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath }) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [candidatEmail],
      subject: '[UniPath] Confirmation de votre pre-inscription',
      html: '<div style="font-family: Arial, sans-serif;"><h2 style="color: #008751;">Pre-inscription confirmee</h2><p>Bonjour <strong>' + candidatPrenom + ' ' + candidatNom + '</strong>,</p><p>Votre pre-inscription au concours <strong>' + concours + '</strong> a bien ete enregistree.</p><p>Numero de dossier : <strong>' + numeroDossier + '</strong></p><p>Votre fiche de pre-inscription est jointe a cet email. La commission etudiera votre dossier et vous serez notifie par email.</p><hr/><p style="color:#888;font-size:12px;">EPAC — Universite d\'Abomey-Calavi | Annee 2025-2026</p></div>',
      attachments: [
        {
          filename: 'fiche-preinscription-' + numeroDossier + '.pdf',
          content: pdfBase64,
        }
      ]
    });

    if (error) {
      console.error('Erreur email pre-inscription:', error);
      return false;
    }
    console.log('Email pre-inscription envoye:', data.id);
    return true;
  } catch (err) {
    console.error('Exception email pre-inscription:', err);
    return false;
  }
};

// ── Email de validation avec lien convocation ─────────────────
const envoyerEmailValidation = async ({ candidatEmail, candidatNom, candidatPrenom, concours, matricule, inscriptionId }) => {
  try {
    const lienConvocation = process.env.APP_URL + '/api/candidats/convocation/' + inscriptionId;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [candidatEmail],
      subject: '[UniPath] Votre dossier a ete valide',
      html: '<div style="font-family: Arial, sans-serif;"><h2 style="color: #008751;">Dossier valide</h2><p>Bonjour <strong>' + candidatPrenom + ' ' + candidatNom + '</strong>,</p><p>Votre dossier pour le concours <strong>' + concours + '</strong> a ete <strong style="color:#008751;">valide</strong> par la commission.</p><p>Matricule : <strong>' + matricule + '</strong></p><p>Vous pouvez telecharger votre convocation en cliquant sur le lien ci-dessous :</p><p><a href="' + lienConvocation + '" style="background-color:#008751;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">Telecharger ma convocation</a></p><hr/><p style="color:#888;font-size:12px;">EPAC — Universite d\'Abomey-Calavi | Annee 2025-2026</p></div>'
    });

    if (error) {
      console.error('Erreur email validation:', error);
      return false;
    }
    console.log('Email validation envoye:', data.id);
    return true;
  } catch (err) {
    console.error('Exception email validation:', err);
    return false;
  }
};

// ── Email de rejet ────────────────────────────────────────────
const envoyerEmailRejet = async ({ candidatEmail, candidatNom, candidatPrenom, concours }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [candidatEmail],
      subject: '[UniPath] Votre dossier n a pas ete retenu',
      html: '<div style="font-family: Arial, sans-serif;"><h2 style="color: #E8112D;">Dossier non retenu</h2><p>Bonjour <strong>' + candidatPrenom + ' ' + candidatNom + '</strong>,</p><p>Votre dossier pour le concours <strong>' + concours + '</strong> n a pas ete retenu par la commission.</p><p>Rapprochez-vous de l administration pour plus d informations.</p><hr/><p style="color:#888;font-size:12px;">EPAC — Universite d\'Abomey-Calavi | Annee 2025-2026</p></div>'
    });

    if (error) {
      console.error('Erreur email rejet:', error);
      return false;
    }
    console.log('Email rejet envoye:', data.id);
    return true;
  } catch (err) {
    console.error('Exception email rejet:', err);
    return false;
  }
};

module.exports = { envoyerEmailPreInscription, envoyerEmailValidation, envoyerEmailRejet };