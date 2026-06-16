const prisma = require('../prisma');

const CANDIDAT_CHILD_UPDATES = [
  { table: 'Inscription', column: 'candidatId' },
  { table: 'Dossier', column: 'candidatId' },
  { table: 'Diplome', column: 'candidatId' },
  { table: 'InscriptionAcademique', column: 'candidatId' },
  { table: 'PreinscriptionEtablissement', column: 'candidatId' },
  { table: 'Notification', column: 'userId' },
  { table: 'EmailDelivery', column: 'userId' },
  { table: 'UserPreferences', column: 'userId' },
  { table: 'NotificationAuditLog', column: 'userId' },
];

/**
 * Aligne l'id Candidat (PK) sur l'id Supabase Auth quand ils divergent (même email).
 */
async function alignCandidatIdToAuth(authUserId, email) {
  if (!authUserId || !email) return null;

  const candidat = await prisma.candidat.findUnique({
    where: { email },
    select: { id: true, role: true, nom: true, prenom: true },
  });

  if (!candidat || candidat.id === authUserId) {
    return candidat;
  }

  const oldId = candidat.id;
  console.warn(`🔧 Réalignement Candidat ${email}: ${oldId} → ${authUserId}`);

  await prisma.$transaction(async (tx) => {
    for (const { table, column } of CANDIDAT_CHILD_UPDATES) {
      await tx.$executeRawUnsafe(
        `UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`,
        authUserId,
        oldId
      );
    }
    await tx.$executeRawUnsafe(`UPDATE "Candidat" SET id = $1 WHERE id = $2`, authUserId, oldId);
  });

  return prisma.candidat.findUnique({
    where: { id: authUserId },
    select: { id: true, role: true, nom: true, prenom: true },
  });
}

module.exports = { alignCandidatIdToAuth };
