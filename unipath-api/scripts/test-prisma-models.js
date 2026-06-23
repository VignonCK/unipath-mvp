const prisma = require('../src/prisma');

async function main() {
  console.log('application:', typeof prisma.application?.findMany);
  console.log('adminEtablissement:', typeof prisma.adminEtablissement?.findMany);
  console.log('campagneInscription:', typeof prisma.campagneInscription?.findMany);
  const apps = await prisma.application.findMany({ take: 1 });
  console.log('application count sample:', apps.length);
}

main()
  .catch((e) => console.error(e.message))
  .finally(() => prisma.$disconnect());
