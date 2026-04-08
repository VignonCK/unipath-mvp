const fs = require('fs');
const path = require('path');

// Lecture manuelle du .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
  }
});

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
const app = require('./src/app');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Serveur UniPath démarré sur http://localhost:${PORT}`);
});