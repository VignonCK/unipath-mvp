require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL || '';
  const hostMatch = url.match(/@([^:/]+)/);
  const host = hostMatch ? hostMatch[1] : '(inconnu)';

  console.log('Host:', host);
  const result = await prisma.$queryRaw`SELECT 1 AS ok`;
  const count = await prisma.candidat.count();
  console.log('DB_OK', result);
  console.log('Candidats en base:', count);
}

main()
  .catch((e) => {
    console.error('DB_FAIL', e.code || e.name);
    console.error(String(e.message || e).slice(0, 500));
    if (e.meta) console.error('meta:', e.meta);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
