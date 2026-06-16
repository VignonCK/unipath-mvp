/**
 * Répare les comptes Supabase sans ligne Candidat (inscription interrompue pendant migrations).
 * Usage: node scripts/repair-orphan-candidats.js [email]
 */
const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');
const { genererMatriculeUnique } = require('../src/utils/matricule.helper');

async function repairUser(authUser) {
  const existing = await prisma.candidat.findUnique({ where: { id: authUser.id } });
  if (existing) {
    return { email: authUser.email, status: 'ok', id: existing.id };
  }

  const meta = authUser.user_metadata || {};
  const nom = meta.nom || meta.full_name?.split(' ')?.slice(-1)?.[0];
  const prenom = meta.prenom || meta.full_name?.split(' ')?.[0];
  const anip = meta.anip || null;

  if (!nom || !prenom) {
    return { email: authUser.email, status: 'skip', reason: 'metadata insuffisantes (nom/prenom)' };
  }

  const matricule = await genererMatriculeUnique();
  const candidat = await prisma.candidat.create({
    data: {
      id: authUser.id,
      email: authUser.email,
      nom,
      prenom,
      anip,
      matricule,
      emailConfirme: !!authUser.email_confirmed_at,
      role: 'ETUDIANT',
    },
  });

  return { email: authUser.email, status: 'repaired', id: candidat.id, matricule };
}

async function main() {
  const filterEmail = process.argv[2]?.toLowerCase();

  let page = 1;
  const perPage = 200;
  const results = [];

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      if (filterEmail && user.email?.toLowerCase() !== filterEmail) continue;
      results.push(await repairUser(user));
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  console.log(JSON.stringify(results, null, 2));
  const repaired = results.filter((r) => r.status === 'repaired');
  console.log(`\nRésumé: ${repaired.length} compte(s) réparé(s), ${results.length} analysé(s).`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
