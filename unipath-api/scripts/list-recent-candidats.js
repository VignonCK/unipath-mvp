const prisma = require('../src/prisma');

async function main() {
  const rows = await prisma.candidat.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: {
      id: true,
      email: true,
      emailConfirme: true,
      role: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
