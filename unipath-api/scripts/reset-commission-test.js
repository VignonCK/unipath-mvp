require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.membreCommission.updateMany({
    where: { email: 'commission@test.com' },
    data: { sousRole: 'MEMBRE' },
  });
  console.log('commission@test.com → sousRole MEMBRE:', result.count);

  const epac = await prisma.membreCommission.updateMany({
    where: { email: 'commission@epac.bj' },
    data: { sousRole: 'MEMBRE' },
  });
  console.log('commission@epac.bj → sousRole MEMBRE:', epac.count);

  const member = await prisma.membreCommission.findUnique({
    where: { email: 'commission@test.com' },
    select: { email: true, sousRole: true, prenom: true, nom: true },
  });
  console.log(member);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
