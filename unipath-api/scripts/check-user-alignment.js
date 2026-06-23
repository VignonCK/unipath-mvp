const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');

async function main() {
  const email = (process.argv[2] || 'harrydedji@gmail.com').toLowerCase();

  const candidat = await prisma.candidat.findUnique({
    where: { email },
    select: { id: true, email: true, nom: true, prenom: true, role: true, emailConfirme: true },
  });
  console.log('Candidat DB:', candidat);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const authUser = data.users.find((u) => u.email?.toLowerCase() === email);
  console.log('Supabase auth:', authUser ? {
    id: authUser.id,
    email: authUser.email,
    email_confirmed_at: authUser.email_confirmed_at,
    user_metadata: authUser.user_metadata,
  } : 'NOT_FOUND');

  if (candidat && authUser && candidat.id !== authUser.id) {
    console.log('\n⚠️  ID MISMATCH — cause probable du 503');
    console.log(`   Candidat.id: ${candidat.id}`);
    console.log(`   Supabase.id: ${authUser.id}`);
  } else if (candidat && authUser) {
    console.log('\n✅ IDs alignés');
  }
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
