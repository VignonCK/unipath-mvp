const prisma = require('../src/prisma');
const { alignCandidatIdToAuth } = require('../src/utils/candidat-alignment.helper');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/align-candidat-id.js <email>');
    process.exit(1);
  }

  const { supabaseAdmin } = require('../src/supabase');
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const authUser = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) {
    console.error('Utilisateur Supabase introuvable:', email);
    process.exit(1);
  }

  const aligned = await alignCandidatIdToAuth(authUser.id, authUser.email);
  console.log(aligned ? '✅ Aligné:' : 'Rien à faire:', aligned || email);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
