/**
 * Migration ponctuelle — 5 emails commission Module 1 → aliases forsuree15+
 * Usage: node scripts/migrate-commission-emails-forsuree15.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');

const MIGRATIONS = [
  { from: 'examinateur@test.com', to: 'forsuree15+examinateur1@gmail.com' },
  { from: 'examinateur2@test.com', to: 'forsuree15+examinateur2@gmail.com' },
  { from: 'controleur-commission@test.com', to: 'forsuree15+controleur1@gmail.com' },
  { from: 'commission@test.com', to: 'forsuree15+commission@gmail.com' },
  { from: 'examinateur-epac-gc@test.com', to: 'forsuree15+examinateur-epac-gc@gmail.com' },
];

const PROTECTED = 'forsuree15@gmail.com';

async function findAuthByEmail(email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  console.log('=== Migration emails commission → forsuree15+ ===\n');

  const protectedBefore = await prisma.membreCommission.findUnique({
    where: { email: PROTECTED },
    select: { id: true, email: true, concoursId: true, sousRole: true, nom: true, prenom: true },
  });
  if (!protectedBefore) {
    console.warn(`⚠️  ${PROTECTED} introuvable en Prisma (ok si absent)`);
  } else {
    console.log(`Protégé (ne pas toucher): ${PROTECTED} id=${protectedBefore.id} concoursId=${protectedBefore.concoursId}`);
  }

  const beforeSnap = [];

  for (const { from, to } of MIGRATIONS) {
    console.log(`\n→ ${from}  =>  ${to}`);

    const membre = await prisma.membreCommission.findUnique({
      where: { email: from },
      select: {
        id: true,
        email: true,
        concoursId: true,
        etablissementId: true,
        sousRole: true,
        nom: true,
        prenom: true,
      },
    });
    if (!membre) {
      // déjà migré ?
      const already = await prisma.membreCommission.findUnique({
        where: { email: to },
        select: { id: true, email: true, concoursId: true, sousRole: true },
      });
      if (already) {
        console.log(`  déjà sur ${to} (id=${already.id}) — skip`);
        beforeSnap.push({ from, to, id: already.id, concoursId: already.concoursId, status: 'already' });
        continue;
      }
      throw new Error(`Compte Prisma introuvable: ${from}`);
    }

    const conflict = await prisma.membreCommission.findUnique({ where: { email: to } });
    if (conflict && conflict.id !== membre.id) {
      throw new Error(`Conflit Prisma: ${to} existe déjà (id=${conflict.id})`);
    }

    beforeSnap.push({
      from,
      to,
      id: membre.id,
      concoursId: membre.concoursId,
      etablissementId: membre.etablissementId,
      sousRole: membre.sousRole,
      status: 'pending',
    });

    // Auth
    let authUser = await findAuthByEmail(from);
    if (!authUser) {
      authUser = await findAuthByEmail(to);
      if (authUser && authUser.id === membre.id) {
        console.log('  Auth déjà sur nouvel email');
      } else if (!authUser) {
        throw new Error(`Auth introuvable pour ${from}`);
      } else {
        throw new Error(`Auth ${to} existe avec un autre id (${authUser.id} vs ${membre.id})`);
      }
    } else if (authUser.id !== membre.id) {
      throw new Error(`Désync Auth/Prisma: auth=${authUser.id} prisma=${membre.id}`);
    }

    if (authUser.email?.toLowerCase() !== to.toLowerCase()) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(membre.id, {
        email: to,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          email: to,
        },
      });
      if (authErr) throw new Error(`Auth update failed for ${from}: ${authErr.message}`);
      console.log('  ✅ Auth email mis à jour');
    }

    await prisma.membreCommission.update({
      where: { id: membre.id },
      data: { email: to },
    });
    console.log(`  ✅ Prisma email mis à jour (concoursId=${membre.concoursId})`);
  }

  // Vérifs finales
  console.log('\n=== Vérifications ===');
  for (const row of beforeSnap) {
    const after = await prisma.membreCommission.findUnique({
      where: { id: row.id },
      select: { email: true, concoursId: true, etablissementId: true, sousRole: true },
    });
    const oldGone = !(await prisma.membreCommission.findUnique({ where: { email: row.from } }));
    const okEmail = after?.email === row.to;
    const okScope = after?.concoursId === row.concoursId;
    console.log(
      `${okEmail && oldGone && okScope ? '✅' : '❌'} ${row.to} | email=${after?.email} concoursId=${after?.concoursId} oldGone=${oldGone}`,
    );
  }

  const protectedAfter = await prisma.membreCommission.findUnique({
    where: { email: PROTECTED },
    select: { id: true, email: true, concoursId: true, sousRole: true, nom: true, prenom: true },
  });
  if (protectedBefore && protectedAfter) {
    const same =
      protectedAfter.id === protectedBefore.id
      && protectedAfter.email === protectedBefore.email
      && protectedAfter.concoursId === protectedBefore.concoursId
      && protectedAfter.sousRole === protectedBefore.sousRole;
    console.log(same
      ? `✅ ${PROTECTED} inchangé`
      : `❌ ${PROTECTED} MODIFIÉ — avant=${JSON.stringify(protectedBefore)} après=${JSON.stringify(protectedAfter)}`);
  }

  // Doublons sur les nouvelles adresses
  for (const { to } of MIGRATIONS) {
    const count = await prisma.membreCommission.count({ where: { email: to } });
    console.log(count === 1 ? `✅ pas de doublon ${to}` : `❌ doublons ${to}: ${count}`);
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
