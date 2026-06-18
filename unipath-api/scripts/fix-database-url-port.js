/**
 * Corrige DATABASE_URL : port 6543 (transaction pooler) → 5432 (session pooler, recommandé Prisma)
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('.env introuvable');
  process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');
const before = content;

// Remplacer uniquement le port du pooler transaction par session mode
content = content.replace(
  /(DATABASE_URL\s*=\s*["']?[^\n]*pooler\.supabase\.com):6543/g,
  '$1:5432'
);
content = content.replace(
  /(DATABASE_URL\s*=\s*["']?[^\n]*):6543(\/)/g,
  '$1:5432$2'
);

if (content === before) {
  console.log('Aucun changement nécessaire (port déjà 5432 ou DATABASE_URL absent).');
} else {
  fs.writeFileSync(envPath, content, 'utf8');
  console.log('✅ DATABASE_URL mis à jour : port 6543 → 5432');
}

// Vérification sans afficher les credentials
require('dotenv').config({ path: envPath, override: true });
const match = (process.env.DATABASE_URL || '').match(/:(\d+)\//);
console.log('Port DATABASE_URL actuel :', match ? match[1] : 'non détecté');
