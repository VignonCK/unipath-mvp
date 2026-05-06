# Utilitaires ANIP - Guide d'utilisation

## 📋 Description

Le script `anip-utils.js` fournit des outils en ligne de commande pour gérer les identifiants ANIP dans la base de données UniPath.

## 🚀 Installation

Aucune installation supplémentaire n'est nécessaire. Le script utilise les dépendances existantes du projet.

## 📖 Commandes disponibles

### 1. Statistiques (`stats`)

Affiche un résumé des ANIP dans la base de données.

```bash
node scripts/anip-utils.js stats
```

**Sortie :**
```
📊 Statistiques ANIP

Total candidats: 150
Avec ANIP: 145 (96.67%)
Sans ANIP: 5
Doublons: 0
```

### 2. Liste des candidats sans ANIP (`sans-anip`)

Liste les candidats qui n'ont pas d'ANIP enregistré.

```bash
# Liste les 10 premiers candidats sans ANIP
node scripts/anip-utils.js sans-anip

# Liste les 50 premiers candidats sans ANIP
node scripts/anip-utils.js sans-anip 50
```

**Sortie :**
```
📋 Candidats sans ANIP

┌─────────┬──────────────────────────────────────┬─────────────┬────────┬────────┬─────────────────────────┐
│ (index) │                  id                  │  matricule  │  nom   │ prenom │        createdAt        │
├─────────┼──────────────────────────────────────┼─────────────┼────────┼────────┼─────────────────────────┤
│    0    │ '123e4567-e89b-12d3-a456-426614174000'│ 'UAC-2026-001'│ 'DEDJI'│ 'Harry'│ 2026-01-15T10:30:00.000Z│
└─────────┴──────────────────────────────────────┴─────────────┴────────┴────────┴─────────────────────────┘
```

### 3. Validation des ANIP (`valider`)

Vérifie que tous les ANIP enregistrés respectent le format (12 chiffres).

```bash
node scripts/anip-utils.js valider
```

**Sortie :**
```
✅ Validation de tous les ANIP

Total: 145
Valides: 143
Invalides: 2

ANIP invalides:
┌─────────┬──────────────────────────────────────┬─────────────┬────────┬────────┬──────────────┐
│ (index) │                  id                  │  matricule  │  nom   │ prenom │     anip     │
├─────────┼──────────────────────────────────────┼─────────────┼────────┼────────┼──────────────┤
│    0    │ '123e4567-e89b-12d3-a456-426614174001'│ 'UAC-2026-002'│ 'KOFFI'│ 'Jean' │ '12345'      │
│    1    │ '123e4567-e89b-12d3-a456-426614174002'│ 'UAC-2026-003'│ 'SOSSA'│ 'Marie'│ 'ANIP12345678'│
└─────────┴──────────────────────────────────────┴─────────────┴────────┴────────┴──────────────┘
```

### 4. Recherche par ANIP (`rechercher`)

Recherche un candidat par son identifiant ANIP.

```bash
node scripts/anip-utils.js rechercher 123456789012
```

**Sortie :**
```
🔍 Recherche de l'ANIP: 123456789012

Candidat trouvé:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "matricule": "UAC-2026-001",
  "nom": "DEDJI",
  "prenom": "Harry",
  "anip": "123456789012",
  "email": "harry.dedji@example.com",
  "inscriptions": [
    {
      "id": "...",
      "concoursId": "...",
      "statut": "VALIDE",
      "concours": {
        "libelle": "Concours Médecine 2026"
      }
    }
  ],
  "dossier": {
    "id": "...",
    "acteNaissance": "https://...",
    "carteIdentite": "https://..."
  }
}
```

### 5. Nettoyage des ANIP (`nettoyer`)

Nettoie les ANIP en supprimant les espaces et caractères non numériques.

⚠️ **Attention** : Cette commande modifie la base de données. Faites un backup avant.

```bash
node scripts/anip-utils.js nettoyer
```

**Sortie :**
```
🧹 Nettoyage des ANIP

Candidats traités: 145
Candidats mis à jour: 3

┌─────────┬──────────────────────────────────────┬──────────────────┬──────────────┐
│ (index) │                  id                  │   ancienANIP     │ nouveauANIP  │
├─────────┼──────────────────────────────────────┼──────────────────┼──────────────┤
│    0    │ '123e4567-e89b-12d3-a456-426614174003'│ '123 456 789 012'│ '123456789012'│
│    1    │ '123e4567-e89b-12d3-a456-426614174004'│ '123-456-789-012'│ '123456789012'│
│    2    │ '123e4567-e89b-12d3-a456-426614174005'│ 'ANIP123456789012'│ '123456789012'│
└─────────┴──────────────────────────────────────┴──────────────────┴──────────────┘
```

### 6. Génération d'ANIP de test (`generer-test`)

Génère des ANIP aléatoires pour les tests.

⚠️ **Ne pas utiliser en production** : Ces ANIP sont fictifs.

```bash
# Génère 1 ANIP
node scripts/anip-utils.js generer-test

# Génère 5 ANIP
node scripts/anip-utils.js generer-test 5
```

**Sortie :**
```
🎲 Génération de 5 ANIP de test

174623456789
174623456790
174623456791
174623456792
174623456793
```

## 🔧 Utilisation programmatique

Vous pouvez également importer les fonctions dans vos propres scripts :

```javascript
const {
  validerFormatANIP,
  anipExiste,
  statistiquesANIP,
  rechercherParANIP
} = require('./scripts/anip-utils');

// Valider un ANIP
const estValide = validerFormatANIP('123456789012');
console.log(estValide); // true

// Vérifier l'existence
const existe = await anipExiste('123456789012');
console.log(existe); // true ou false

// Obtenir les statistiques
const stats = await statistiquesANIP();
console.log(stats);

// Rechercher un candidat
const candidat = await rechercherParANIP('123456789012');
console.log(candidat);
```

## 📊 Cas d'usage

### Avant la migration

```bash
# Vérifier l'état actuel
node scripts/anip-utils.js stats

# Lister les candidats sans ANIP
node scripts/anip-utils.js sans-anip 100

# Valider les ANIP existants
node scripts/anip-utils.js valider
```

### Après la migration

```bash
# Vérifier que tous les candidats ont un ANIP
node scripts/anip-utils.js stats

# Nettoyer les ANIP mal formatés (si nécessaire)
node scripts/anip-utils.js nettoyer

# Valider à nouveau
node scripts/anip-utils.js valider
```

### Maintenance régulière

```bash
# Vérification hebdomadaire
node scripts/anip-utils.js stats
node scripts/anip-utils.js valider
```

### Support utilisateur

```bash
# Rechercher un candidat par ANIP
node scripts/anip-utils.js rechercher 123456789012
```

## 🛡️ Sécurité

### Bonnes pratiques

1. **Backup avant nettoyage** : Toujours faire un backup avant d'exécuter `nettoyer`
2. **Environnement de test** : Tester les commandes en développement d'abord
3. **Logs** : Conserver les logs des opérations de maintenance
4. **Accès restreint** : Limiter l'accès au script aux administrateurs

### Commandes sûres (lecture seule)

Ces commandes ne modifient pas la base de données :
- `stats`
- `sans-anip`
- `valider`
- `rechercher`
- `generer-test`

### Commandes à risque (modification)

Ces commandes modifient la base de données :
- `nettoyer` ⚠️

## 🐛 Dépannage

### Erreur : "Cannot find module '@prisma/client'"

```bash
cd unipath-api
npm install
npx prisma generate
```

### Erreur : "Database connection failed"

Vérifiez votre fichier `.env` et la variable `DATABASE_URL`.

### Erreur : "Format ANIP invalide"

L'ANIP doit contenir exactement 12 chiffres. Utilisez la commande `valider` pour identifier les ANIP problématiques.

## 📝 Logs

Pour conserver un historique des opérations :

```bash
# Rediriger la sortie vers un fichier
node scripts/anip-utils.js stats > logs/anip-stats-$(date +%Y%m%d).log

# Avec horodatage
node scripts/anip-utils.js valider | tee logs/anip-validation-$(date +%Y%m%d-%H%M%S).log
```

## 🔄 Automatisation

### Cron job pour vérification quotidienne

```bash
# Ajouter au crontab
0 2 * * * cd /path/to/unipath-api && node scripts/anip-utils.js stats >> logs/anip-daily.log 2>&1
```

### Script de monitoring

```bash
#!/bin/bash
# monitoring-anip.sh

cd /path/to/unipath-api

echo "=== Vérification ANIP - $(date) ===" >> logs/monitoring.log
node scripts/anip-utils.js stats >> logs/monitoring.log
node scripts/anip-utils.js valider >> logs/monitoring.log
echo "" >> logs/monitoring.log
```

## 📚 Ressources

- Documentation ANIP : `INTEGRATION_ANIP.md`
- Guide de migration : `MIGRATION_ANIP.md`
- Tests : `tests/anip.test.js`

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités au script :

1. Ajouter la fonction dans `anip-utils.js`
2. Ajouter le cas dans le `switch` de la fonction `main()`
3. Mettre à jour ce README
4. Ajouter des tests si nécessaire

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation technique
- Vérifier les logs d'erreur
- Contacter l'équipe technique
