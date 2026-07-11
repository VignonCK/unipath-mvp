/**
 * Exigences dossier par défaut pour les établissements privés (Module 2).
 * Aligné sur prisma/seed.js — pièce DOCUMENT_UPLOAD : lettre de demande d'inscription.
 */
const DEFAULT_SCHOOL_REQUIREMENTS = [
  {
    code: 'acte_naissance',
    label: 'Acte de naissance',
    requirementType: 'PROFILE_FIELD',
    profileFieldKey: 'acteNaissance',
    isRequired: true,
  },
  {
    code: 'carte_identite',
    label: "Carte d'identité",
    requirementType: 'PROFILE_FIELD',
    profileFieldKey: 'carteIdentite',
    isRequired: true,
  },
  {
    code: 'photo_identite',
    label: "Photo d'identité",
    requirementType: 'PROFILE_FIELD',
    profileFieldKey: 'photo',
    isRequired: true,
  },
  {
    code: 'releve_bac',
    label: 'Relevé de notes du Bac',
    requirementType: 'PROFILE_FIELD',
    profileFieldKey: 'releve',
    isRequired: true,
  },
  {
    code: 'lettre_demande_inscription',
    label: "Lettre de demande d'inscription",
    requirementType: 'DOCUMENT_UPLOAD',
    profileFieldKey: null,
    isRequired: true,
  },
];

async function upsertDefaultSchoolRequirements(prisma, etablissementId) {
  await prisma.schoolRequirement.deleteMany({
    where: { etablissementId, code: 'lettre_motivation' },
  });

  for (const req of DEFAULT_SCHOOL_REQUIREMENTS) {
    await prisma.schoolRequirement.upsert({
      where: {
        etablissementId_code: {
          etablissementId,
          code: req.code,
        },
      },
      update: {
        label: req.label,
        requirementType: req.requirementType,
        profileFieldKey: req.profileFieldKey,
        isRequired: req.isRequired,
      },
      create: {
        etablissementId,
        ...req,
      },
    });
  }
}

module.exports = {
  DEFAULT_SCHOOL_REQUIREMENTS,
  upsertDefaultSchoolRequirements,
};
