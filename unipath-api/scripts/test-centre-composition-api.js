require('dotenv').config();
const prisma = require('../src/prisma');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

const INSCRIPTION_ID = '817df7ff-f49c-4532-a286-810f325651ae';

async function main() {
  const inscription = await prisma.inscription.findUnique({
    where: { id: INSCRIPTION_ID },
    include: { candidat: true },
  });

  if (!inscription) throw new Error('Inscription not found');

  const token = jwt.sign(
    { id: inscription.candidat.id, role: 'CANDIDAT' },
    config.jwtSecret,
    { expiresIn: '1h' },
  );

  const url = `${config.appUrl.replace(/\/$/, '')}/api/inscriptions/${INSCRIPTION_ID}/centre-composition`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ville: 'Cotonou', nom: 'Collège Notre Dame des Apôtres' }),
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));
  console.log('Body:', text.slice(0, 500));

  if (response.headers.get('content-type')?.includes('json')) {
    const data = JSON.parse(text);
    if (data.centreCompositionChoisi) {
      console.log('\n✅ Centre enregistré:', data.centreCompositionChoisi);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
