const prisma = require('../src/prisma');

async function main() {
  const candidatCount = await prisma.candidat.count();
  console.log('Candidats:', candidatCount);

  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM _prisma_migrations
    ORDER BY started_at DESC
    LIMIT 8
  `;
  console.log('Recent migrations:', JSON.stringify(migrations, null, 2));

  const roles = await prisma.$queryRaw`
    SELECT unnest(enum_range(NULL::"Role"))::text AS role
  `;
  console.log('Role enum:', roles.map((r) => r.role).join(', '));

  const blocking = await prisma.$queryRaw`
    SELECT migration_name, started_at, logs
    FROM _prisma_migrations
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  `;
  console.log('Blocking failed migrations:', JSON.stringify(blocking, null, 2));

  const candidats = await prisma.candidat.findMany({
    select: { id: true, email: true, role: true, emailConfirme: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Recent candidats:', JSON.stringify(candidats, null, 2));
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
