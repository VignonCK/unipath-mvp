# 🚨 ALERTE SÉCURITÉ - ACTION IMMÉDIATE REQUISE

**Date** : 29 avril 2026  
**Gravité** : CRITIQUE  
**Détecté par** : GitGuardian

---

## ⚠️ PROBLÈME

GitGuardian a détecté l'exposition d'un **mot de passe email d'entreprise** dans le repository GitHub.

**Détails :**
- Repository : VignonCK/unipath-mvp
- Type : Company Email Password
- Date de push : 29 avril 2026, 16:42:25 UTC

---

## 🔥 ACTIONS IMMÉDIATES (À FAIRE MAINTENANT)

### 1. Changer le mot de passe email Gmail

**URGENT - À faire dans les 5 prochaines minutes :**

1. Aller sur : https://myaccount.google.com/apppasswords
2. Révoquer le mot de passe d'application actuel : `cowh fjvw kzzj uovp`
3. Générer un nouveau mot de passe d'application
4. Mettre à jour `unipath-api/.env` en LOCAL uniquement (ne PAS commiter)

### 2. Vérifier les accès non autorisés

1. Aller sur : https://myaccount.google.com/device-activity
2. Vérifier s'il y a des connexions suspectes
3. Déconnecter tous les appareils non reconnus

### 3. Activer l'authentification à deux facteurs (2FA)

Si ce n'est pas déjà fait :
1. https://myaccount.google.com/signinoptions/two-step-verification
2. Activer la 2FA pour plus de sécurité

---

## 🔍 IDENTIFIER LA SOURCE

Le mot de passe a probablement été exposé dans un de ces fichiers :

- ❌ `unipath-api/.env` (commité par erreur)
- ❌ Un commit précédent
- ❌ Un fichier de configuration

**Vérifier sur GitHub :**
1. https://github.com/VignonCK/unipath-mvp/settings/security_analysis
2. Cliquer sur "View alerts"
3. Identifier exactement quel commit contient le secret

---

## 🧹 NETTOYER LE REPOSITORY

### Option 1 : Utiliser GitHub Secret Scanning (Recommandé)

1. Aller sur : https://github.com/VignonCK/unipath-mvp/security
2. Cliquer sur l'alerte GitGuardian
3. Suivre les instructions pour "Revoke and rotate"

### Option 2 : Nettoyer manuellement avec BFG

Si le secret est dans l'historique Git :

```bash
# Installer BFG Repo-Cleaner
# Windows (avec Chocolatey)
choco install bfg

# Ou télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/

# Créer un fichier avec les secrets à supprimer
echo "cowh fjvw kzzj uovp" > passwords.txt

# Nettoyer le repo
bfg --replace-text passwords.txt

# Forcer le push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

---

## 📋 CHECKLIST DE SÉCURITÉ

- [ ] Mot de passe email changé
- [ ] Nouveau mot de passe mis à jour dans `.env` local
- [ ] Vérification des accès Gmail
- [ ] 2FA activé sur Gmail
- [ ] Alerte GitGuardian résolue sur GitHub
- [ ] Repository nettoyé (si nécessaire)
- [ ] Tous les secrets révoqués et régénérés :
  - [ ] EMAIL_PASS
  - [ ] SUPABASE_SERVICE_KEY (si exposé)
  - [ ] DATABASE_URL (si exposé)

---

## 🛡️ PRÉVENTION FUTURE

### 1. Installer git-secrets

```bash
# Windows (PowerShell)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
./install.ps1

# Configurer dans le repo
cd path/to/unipath-mvp
git secrets --install
git secrets --register-aws
git secrets --add 'password.*=.*'
git secrets --add '[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}\s[a-zA-Z]{4}'
```

### 2. Hook pre-commit

Créer `.git/hooks/pre-commit` :

```bash
#!/bin/bash
if git diff --cached --name-only | grep -E '\.env$'; then
  echo "❌ ERREUR : Tentative de commit d'un fichier .env"
  echo "Les fichiers .env ne doivent JAMAIS être commités"
  exit 1
fi

# Vérifier les patterns de secrets
if git diff --cached | grep -E 'password.*=|api[_-]?key.*=|secret.*='; then
  echo "❌ ERREUR : Possible secret détecté dans le commit"
  echo "Vérifiez que vous ne commitez pas de credentials"
  exit 1
fi
```

### 3. Utiliser GitHub Secrets pour CI/CD

Au lieu de commiter les secrets, utiliser GitHub Secrets :

1. https://github.com/VignonCK/unipath-mvp/settings/secrets/actions
2. Ajouter les secrets nécessaires
3. Les référencer dans `.github/workflows/ci.yml`

---

## 📞 SUPPORT

Si tu as besoin d'aide :
1. Documentation GitHub : https://docs.github.com/en/code-security/secret-scanning
2. Support GitGuardian : https://www.gitguardian.com/
3. Email : harrydedji@gmail.com

---

## ⏰ TIMELINE

- **T+0 min** : Changer le mot de passe email (URGENT)
- **T+5 min** : Vérifier les accès Gmail
- **T+10 min** : Résoudre l'alerte GitGuardian
- **T+30 min** : Nettoyer le repository si nécessaire
- **T+1 heure** : Mettre en place les préventions

---

**⚠️ NE PAS IGNORER CETTE ALERTE**

Un mot de passe exposé peut permettre à un attaquant de :
- Envoyer des emails en ton nom
- Accéder à tes emails
- Utiliser ton compte pour du spam
- Compromettre d'autres services liés

**AGIS MAINTENANT !**
