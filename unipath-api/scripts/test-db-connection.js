require('dotenv').config();
const prisma = require('../src/prisma');

(async () => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log(`DB OK (${Date.now() - started}ms)`);
  } catch (e) {
    console.log(`DB FAIL (${Date.now() - started}ms):`, e.code || e.name);
    console.log((e.message || '').split('\n').slice(0, 3).join('\n'));
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
