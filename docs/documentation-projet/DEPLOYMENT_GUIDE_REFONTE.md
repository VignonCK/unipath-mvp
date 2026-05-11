# Guide de Déploiement - Refonte Dossier & Inscription

## 📋 Vue d'ensemble

Ce guide détaille les étapes pour déployer la refonte du système de dossiers et inscriptions en production.

**Durée estimée** : 2-3 heures  
**Fenêtre de maintenance** : Requise (30-60 minutes)  
**Risque** : Moyen (migration de données)

---

## ✅ Pré-requis

### Environnement

- [ ] Node.js 18+ installé
- [ ] PostgreSQL 14+ accessible
- [ ] Accès SSH au serveur de production
- [ ] Accès à Supabase (pour le stockage des fichiers)
- [ ] Variables d'environnement configurées

### Permissions

- [ ] Accès administrateur à la base de données
- [ ] Droits de déploiement sur le serveur
- [ ] Accès au système de monitoring
- [ ] Accès aux logs de production

### Backups

- [ ] Backup automatique configuré
- [ ] Espace disque suffisant pour le backup (min 2x taille DB)
- [ ] Procédure de restauration testée

---

## 🧪 Tests en Staging

### 1. Déploiement en staging

```bash
# 1. Cloner le code
git clone https://github.com/your-org/unipath.git
cd unipath/unipath-api

# 2. Checkout de la branche de refonte
git checkout feature/refonte-dossier-inscription

# 3. Installer les dépendances
npm install

# 4. Configurer les variables d'environnement
cp .env.example .env.staging
# Éditer .env.staging avec les valeurs de staging

# 5. Générer le client Prisma
npx prisma generate

# 6. Exécuter la migration
npx prisma migrate deploy

# 7. Exécuter la migration des données
node prisma/migrations/data-migration-dossier-inscription.js

# 8. Démarrer le serveur
npm run start:staging
```

### 2. Tests de validation

#### Test 1 : Vérification de l'intégrité des données

```bash
# Vérifier que chaque Inscription a un DossierInscription
npx prisma studio
# Requête SQL :
# SELECT COUNT(*) FROM "Inscription" WHERE id NOT IN (SELECT "inscriptionId" FROM "DossierInscription");
# Résultat attendu : 0
```

#### Test 2 : Vérification des ActionHistory

```bash
# Vérifier que tous les ActionHistory ont un dossierInscriptionId valide
# SELECT COUNT(*) FROM "ActionHistory" WHERE "dossierInscriptionId" NOT IN (SELECT id FROM "DossierInscription");
# Résultat attendu : 0
```

#### Test 3 : Tests fonctionnels

```bash
# Exécuter les tests d'intégration
npm run test:integration

# Tests manuels :
# 1. Créer une inscription → Vérifier DossierInscription créé
# 2. Uploader documents de base → Vérifier dans Dossier
# 3. Uploader quittance → Vérifier dans DossierInscription
# 4. Créer 2ème inscription → Vérifier réutilisation documents de base
# 5. Mettre à jour document de base → Vérifier impact multi-inscription
```

#### Test 4 : Tests de performance

```bash
# Test de charge avec Artillery
npm run test:load

# Vérifier :
# - Temps de réponse < 500ms pour GET dossier-complet
# - Temps de réponse < 1s pour upload de documents
# - Pas d'erreurs 500
```

### 3. Validation du rollback

```bash
# 1. Créer un backup de staging
pg_dump $STAGING_DATABASE_URL > backup_staging_test.sql

# 2. Effectuer des modifications
# (créer inscriptions, uploader documents, etc.)

# 3. Tester le rollback
psql $STAGING_DATABASE_URL < backup_staging_test.sql

# 4. Vérifier que les données sont restaurées
npx prisma studio
```

---

## 🚀 Déploiement en Production

### Phase 1 : Préparation (J-1)

#### 1.1 Communication

```markdown
**Objet** : Maintenance planifiée - Système UniPath
**Date** : [DATE] de [HEURE_DEBUT] à [HEURE_FIN]
**Durée** : 30-60 minutes
**Impact** : Indisponibilité complète du système

Chers utilisateurs,

Une maintenance est planifiée pour améliorer le système de gestion des dossiers.
Pendant cette période, le système sera inaccessible.

Merci de votre compréhension.

L'équipe UniPath
```

#### 1.2 Préparation des scripts

```bash
# Créer un dossier de déploiement
mkdir -p ~/deployment-refonte-$(date +%Y%m%d)
cd ~/deployment-refonte-$(date +%Y%m%d)

# Copier les scripts nécessaires
cp /path/to/unipath-api/prisma/migrations/data-migration-dossier-inscription.js .
cp /path/to/deployment-scripts/* .

# Vérifier les scripts
ls -la
# Attendu :
# - data-migration-dossier-inscription.js
# - rollback.sh
# - health-check.sh
# - monitoring.sh
```

#### 1.3 Vérification des backups automatiques

```bash
# Vérifier le dernier backup
ls -lh /var/backups/postgresql/

# Vérifier l'espace disque
df -h

# Tester la restauration du dernier backup (sur une DB de test)
pg_restore -d test_db /var/backups/postgresql/latest.dump
```

### Phase 2 : Backup (J-Day, H-1h)

#### 2.1 Backup complet de la base de données

```bash
# Créer un backup avec timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_before_refonte_${TIMESTAMP}.sql"

echo "Création du backup : $BACKUP_FILE"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Vérifier la taille du backup
ls -lh $BACKUP_FILE

# Compresser le backup
gzip $BACKUP_FILE

# Copier le backup vers un emplacement sécurisé
cp ${BACKUP_FILE}.gz /var/backups/critical/
aws s3 cp ${BACKUP_FILE}.gz s3://unipath-backups/critical/

echo "✅ Backup créé et sauvegardé"
```

#### 2.2 Backup des fichiers uploadés

```bash
# Backup Supabase Storage (si applicable)
# Note : Supabase gère ses propres backups, mais vérifier la configuration

# Vérifier les backups Supabase
# Se connecter à Supabase Dashboard > Settings > Backups
# Vérifier que les backups automatiques sont activés
```

### Phase 3 : Activation du mode maintenance (J-Day, H-30min)

#### 3.1 Activer le mode maintenance

```bash
# Méthode 1 : Via variable d'environnement
echo "MAINTENANCE_MODE=true" >> /etc/unipath/.env
pm2 restart unipath-api

# Méthode 2 : Via Nginx
sudo cp /etc/nginx/sites-available/unipath-maintenance.conf /etc/nginx/sites-enabled/unipath.conf
sudo nginx -t
sudo systemctl reload nginx

# Vérifier que le mode maintenance est actif
curl https://api.unipath.com/health
# Attendu : {"status": "MAINTENANCE", "message": "Maintenance en cours"}
```

#### 3.2 Vérifier qu'aucune requête n'est en cours

```bash
# Vérifier les connexions actives à la DB
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'unipath';"

# Attendre que le nombre de connexions soit minimal (< 5)
# Si nécessaire, forcer la fermeture des connexions :
# psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'unipath' AND pid <> pg_backend_pid();"
```

### Phase 4 : Migration (J-Day, H-0)

#### 4.1 Exécuter la migration Prisma

```bash
cd /var/www/unipath/unipath-api

# Vérifier la version actuelle du schéma
npx prisma migrate status

# Exécuter la migration
echo "🚀 Exécution de la migration Prisma..."
npx prisma migrate deploy

# Vérifier le statut
npx prisma migrate status
# Attendu : "Database schema is up to date!"

echo "✅ Migration Prisma terminée"
```

#### 4.2 Exécuter la migration des données

```bash
# Exécuter le script de migration des données
echo "🚀 Exécution de la migration des données..."
node prisma/migrations/data-migration-dossier-inscription.js > migration_log_${TIMESTAMP}.txt 2>&1

# Vérifier les logs
tail -n 50 migration_log_${TIMESTAMP}.txt

# Vérifier le rapport de migration
cat migration_report_${TIMESTAMP}.json

echo "✅ Migration des données terminée"
```

#### 4.3 Validation post-migration

```bash
# Script de validation
cat > validate_migration.sql << 'EOF'
-- Vérifier que chaque Inscription a un DossierInscription
SELECT 'Inscriptions sans DossierInscription' AS check_name, COUNT(*) AS count
FROM "Inscription" 
WHERE id NOT IN (SELECT "inscriptionId" FROM "DossierInscription");

-- Vérifier que tous les ActionHistory ont un dossierInscriptionId valide
SELECT 'ActionHistory avec dossierInscriptionId invalide' AS check_name, COUNT(*) AS count
FROM "ActionHistory" 
WHERE "dossierInscriptionId" NOT IN (SELECT id FROM "DossierInscription");

-- Compter les enregistrements
SELECT 'Total Inscriptions' AS check_name, COUNT(*) AS count FROM "Inscription"
UNION ALL
SELECT 'Total DossierInscription' AS check_name, COUNT(*) AS count FROM "DossierInscription"
UNION ALL
SELECT 'Total ActionHistory' AS check_name, COUNT(*) AS count FROM "ActionHistory";
EOF

# Exécuter la validation
psql $DATABASE_URL -f validate_migration.sql

# Résultats attendus :
# - Inscriptions sans DossierInscription : 0
# - ActionHistory invalides : 0
# - Total Inscriptions = Total DossierInscription
```

### Phase 5 : Déploiement du code (J-Day, H+15min)

#### 5.1 Déployer le nouveau code

```bash
cd /var/www/unipath/unipath-api

# Pull du code
git fetch origin
git checkout feature/refonte-dossier-inscription
git pull origin feature/refonte-dossier-inscription

# Installer les dépendances
npm ci --production

# Générer le client Prisma
npx prisma generate

# Build (si nécessaire)
npm run build

echo "✅ Code déployé"
```

#### 5.2 Redémarrer l'application

```bash
# Redémarrer avec PM2
pm2 restart unipath-api

# Vérifier les logs
pm2 logs unipath-api --lines 50

# Attendre que l'application démarre
sleep 10

echo "✅ Application redémarrée"
```

### Phase 6 : Tests de smoke (J-Day, H+20min)

#### 6.1 Health check

```bash
# Vérifier que l'API répond
curl https://api.unipath.com/health
# Attendu : {"status": "OK", ...}

# Vérifier la connexion à la DB
curl https://api.unipath.com/api/health/db
# Attendu : {"status": "OK", "database": "connected"}
```

#### 6.2 Tests fonctionnels critiques

```bash
# Script de tests smoke
cat > smoke_tests.sh << 'EOF'
#!/bin/bash

API_URL="https://api.unipath.com"
TOKEN="YOUR_TEST_TOKEN"

echo "🧪 Tests de smoke..."

# Test 1 : Authentification
echo "Test 1 : Authentification"
curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq '.token' > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# Test 2 : Récupérer dossier personnel
echo "Test 2 : Dossier personnel"
curl -X GET "$API_URL/api/dossier/candidats/TEST_CANDIDAT_ID/dossier-personnel" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.piecesBase' > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# Test 3 : Récupérer dossier complet
echo "Test 3 : Dossier complet"
curl -X GET "$API_URL/api/completion/inscriptions/TEST_INSCRIPTION_ID/dossier-complet" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.completudeGlobale' > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# Test 4 : Historique
echo "Test 4 : Historique"
curl -X GET "$API_URL/api/history/dossiers-inscription/TEST_DOSSIER_INSCRIPTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.actions' > /dev/null && echo "✅ OK" || echo "❌ FAIL"

echo "✅ Tests de smoke terminés"
EOF

chmod +x smoke_tests.sh
./smoke_tests.sh
```

### Phase 7 : Désactivation du mode maintenance (J-Day, H+30min)

#### 7.1 Désactiver le mode maintenance

```bash
# Méthode 1 : Via variable d'environnement
sed -i '/MAINTENANCE_MODE/d' /etc/unipath/.env
pm2 restart unipath-api

# Méthode 2 : Via Nginx
sudo cp /etc/nginx/sites-available/unipath-production.conf /etc/nginx/sites-enabled/unipath.conf
sudo nginx -t
sudo systemctl reload nginx

# Vérifier que le système est accessible
curl https://api.unipath.com/health
# Attendu : {"status": "OK", ...}

echo "✅ Mode maintenance désactivé"
```

#### 7.2 Communication

```markdown
**Objet** : Maintenance terminée - Système UniPath

Chers utilisateurs,

La maintenance est terminée. Le système est de nouveau accessible.

Nouvelles fonctionnalités :
- Gestion optimisée des dossiers
- Réutilisation automatique des documents de base
- Traçabilité améliorée

Merci de votre patience.

L'équipe UniPath
```

### Phase 8 : Monitoring (J-Day, H+1h à J+7)

#### 8.1 Monitoring immédiat (H+1h à H+4h)

```bash
# Surveiller les logs en temps réel
pm2 logs unipath-api

# Surveiller les métriques
pm2 monit

# Surveiller les erreurs
tail -f /var/log/unipath/error.log | grep -i "error\|exception"

# Surveiller la base de données
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'unipath';"
```

#### 8.2 Métriques à surveiller

| Métrique | Seuil | Action si dépassé |
|----------|-------|-------------------|
| Taux d'erreur API | < 1% | Investiguer les logs |
| Temps de réponse moyen | < 500ms | Vérifier les requêtes DB |
| Connexions DB actives | < 50 | Vérifier les connexions non fermées |
| CPU serveur | < 70% | Vérifier les processus |
| Mémoire serveur | < 80% | Vérifier les fuites mémoire |
| Espace disque | > 20% libre | Nettoyer les logs |

#### 8.3 Monitoring à long terme (J+1 à J+7)

```bash
# Créer un script de monitoring quotidien
cat > daily_monitoring.sh << 'EOF'
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="monitoring_report_${TIMESTAMP}.txt"

echo "📊 Rapport de monitoring - $(date)" > $REPORT_FILE
echo "========================================" >> $REPORT_FILE

# Statistiques de la base de données
echo -e "\n📈 Statistiques DB:" >> $REPORT_FILE
psql $DATABASE_URL -c "
SELECT 
  'Inscriptions' AS table_name, COUNT(*) AS count FROM \"Inscription\"
UNION ALL
SELECT 
  'DossierInscription' AS table_name, COUNT(*) AS count FROM \"DossierInscription\"
UNION ALL
SELECT 
  'ActionHistory' AS table_name, COUNT(*) AS count FROM \"ActionHistory\";
" >> $REPORT_FILE

# Erreurs dans les logs
echo -e "\n❌ Erreurs (dernières 24h):" >> $REPORT_FILE
grep -i "error" /var/log/unipath/error.log | tail -n 20 >> $REPORT_FILE

# Temps de réponse moyen
echo -e "\n⏱️ Temps de réponse moyen:" >> $REPORT_FILE
# (Nécessite un outil de monitoring comme New Relic ou DataDog)

echo "✅ Rapport généré : $REPORT_FILE"
EOF

chmod +x daily_monitoring.sh

# Ajouter au cron pour exécution quotidienne
echo "0 9 * * * /path/to/daily_monitoring.sh" | crontab -
```

---

## 🔄 Procédure de Rollback

### Quand effectuer un rollback ?

- Taux d'erreur > 5%
- Perte de données détectée
- Fonctionnalité critique cassée
- Temps de réponse > 5s
- Impossibilité de se connecter

### Étapes de rollback

#### 1. Activer le mode maintenance

```bash
echo "MAINTENANCE_MODE=true" >> /etc/unipath/.env
pm2 restart unipath-api
```

#### 2. Restaurer la base de données

```bash
# Identifier le backup à restaurer
ls -lh /var/backups/critical/

# Restaurer le backup
BACKUP_FILE="backup_before_refonte_YYYYMMDD_HHMMSS.sql.gz"
gunzip -c /var/backups/critical/$BACKUP_FILE | psql $DATABASE_URL

echo "✅ Base de données restaurée"
```

#### 3. Revenir au code précédent

```bash
cd /var/www/unipath/unipath-api

# Revenir à la version précédente
git checkout main
git pull origin main

# Réinstaller les dépendances
npm ci --production

# Régénérer le client Prisma
npx prisma generate

# Redémarrer
pm2 restart unipath-api

echo "✅ Code restauré"
```

#### 4. Vérifier le système

```bash
# Health check
curl https://api.unipath.com/health

# Tests de smoke
./smoke_tests.sh

echo "✅ Système vérifié"
```

#### 5. Désactiver le mode maintenance

```bash
sed -i '/MAINTENANCE_MODE/d' /etc/unipath/.env
pm2 restart unipath-api

echo "✅ Rollback terminé"
```

#### 6. Communication

```markdown
**Objet** : Incident technique - Système UniPath

Chers utilisateurs,

Suite à un incident technique, nous avons dû restaurer le système à son état précédent.
Le système est de nouveau opérationnel.

Nous nous excusons pour la gêne occasionnée.

L'équipe UniPath
```

---

## 📊 Checklist de déploiement

### Pré-déploiement

- [ ] Tests en staging réussis
- [ ] Validation du rollback testée
- [ ] Communication envoyée (J-1)
- [ ] Backup automatique vérifié
- [ ] Scripts de déploiement préparés
- [ ] Équipe de support alertée

### Déploiement

- [ ] Mode maintenance activé
- [ ] Backup créé et vérifié
- [ ] Migration Prisma exécutée
- [ ] Migration des données exécutée
- [ ] Validation post-migration OK
- [ ] Code déployé
- [ ] Application redémarrée
- [ ] Tests de smoke réussis
- [ ] Mode maintenance désactivé
- [ ] Communication envoyée

### Post-déploiement

- [ ] Monitoring actif (H+1 à H+4)
- [ ] Aucune erreur critique détectée
- [ ] Métriques dans les seuils
- [ ] Rapport de déploiement rédigé
- [ ] Documentation mise à jour
- [ ] Équipe de support informée
- [ ] Monitoring quotidien configuré

---

## 📞 Contacts d'urgence

| Rôle | Nom | Téléphone | Email |
|------|-----|-----------|-------|
| Lead Dev | [NOM] | [TEL] | [EMAIL] |
| DBA | [NOM] | [TEL] | [EMAIL] |
| DevOps | [NOM] | [TEL] | [EMAIL] |
| Product Owner | [NOM] | [TEL] | [EMAIL] |

---

**Version** : 1.0  
**Date** : 11 mai 2026  
**Auteur** : Équipe UniPath
