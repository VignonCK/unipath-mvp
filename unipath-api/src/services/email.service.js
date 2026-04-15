const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const envoyerEmailValidation = async ({ candidatEmail, candidatNom, candidatPrenom, concours, matricule }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [candidatEmail],
      subject: '[UniPath] Votre dossier a ete valide',
      html: '<div style="font-family: Arial, sans-serif;"><h2 style="color: #1E7D3A;">Dossier valide</h2><p>Bonjour <strong>' + candidatPrenom + ' ' + candidatNom + '</strong>,</p><p>Votre dossier pour le concours <strong>' + concours + '</strong> a ete valide.</p><p>Matricule : <strong>' + matricule + '</strong></p><p>Vous recevrez bientot votre convocation.</p></div>'
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

const envoyerEmailRejet = async ({ candidatEmail, candidatNom, candidatPrenom, concours }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [candidatEmail],
      subject: '[UniPath] Votre dossier n a pas ete retenu',
      html: '<div style="font-family: Arial, sans-serif;"><h2 style="color: #C0392B;">Dossier non retenu</h2><p>Bonjour <strong>' + candidatPrenom + ' ' + candidatNom + '</strong>,</p><p>Votre dossier pour le concours <strong>' + concours + '</strong> n a pas ete retenu.</p><p>Rapprochez-vous de l administration pour plus d informations.</p></div>'
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

module.exports = { envoyerEmailValidation, envoyerEmailRejet };