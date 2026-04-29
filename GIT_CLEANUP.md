# Nettoyage Git — Retirer les Secrets

⚠️ **IMPORTANT** : Les fichiers `.env` contenant des secrets ont été détectés dans l'historique Git. Ils doivent être retirés avant de pousser sur un repo public.

---

## 🚨 Problème

Les fichiers suivants contiennent des secrets et sont dans l'historique Git :
- `unipath-api/.env`
- `unipath-front/.env.local`
- `.env.local`

Ces fichiers contiennent :
- Mots de passe de base de données
- Clés API Supabase
- Mots de passe email
- Tokens Vercel

---

## 🛠️ Solution

### Option 1 : BFG Repo-Cleaner (Recommandé)

BFG est plus rapide et plus simple que `git filter-branch`.

#### Installation

**macOS :**
```bash
brew install bfg
```

**Windows :**
```bash
# Télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/
# Ou utiliser scoop
scoop install bfg
```

**Linux :**
```bash
# Télécharger le JAR depuis https://rtyley.github.io/bfg-repo-cleaner/
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar bfg-1.14.0.jar'
```

#### Utilisation

```bash
# 1. Faire un backup du repo
cp -r unipath-mvp unipath-mvp-backup

# 2. Créer un fichier avec les noms de fichiers à supprimer
cat > files-to-delete.txt << EOF
.env
.env.local
EOF

# 3. Exécuter BFG
cd unipath-mvp
bfg --delete-files .env
bfg --delete-files .env.local

# 4. Nettoyer les refs
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Vérifier
git log --all --full-history -- "*/.env"
# Ne devrait rien retourner

# 6. Force push (ATTENTION : coordonner avec l'équipe)
git push origin --force --all
git push origin --force --tags
```

---

### Option 2 : git filter-repo (Alternative)

Plus moderne que `filter-branch`, mais nécessite installation.

#### Installation

```bash
# macOS
brew install git-filter-repo

# Linux
pip3 install git-filter-repo

# Windows
pip install git-filter-repo
```

#### Utilisation

```bash
# 1. Backup
cp -r unipath-mvp unipath-mvp-backup

# 2. Supprimer les fichiers
cd unipath-mvp
git filter-repo --path unipath-api/.env --invert-paths
git filter-repo --path unipath-front/.env.local --invert-paths
git filter-repo --path .env.local --invert-paths

# 3. Vérifier
git log --all --full-history -- "*/.env"

# 4. Re-ajouter le remote (filter-repo le supprime)
git remote add origin <votre-url-git>

# 5. Force push
git push origin --force --all
git push origin --force --tags
```

---

### Option 3 : git filter-branch (Natif mais lent)

Si vous ne pouvez pas installer d'outils externes.

```bash
# 1. Backup
cp -r unipath-mvp unipath-mvp-backup

# 2. Supprimer les fichiers de l'historique
cd unipath-mvp

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch unipath-api/.env unipath-front/.env.local .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Nettoyer
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Vérifier
git log --all --full-history -- "*/.env"

# 5. Force push
git push origin --force --all
git push origin --force --tags
```

---

## ⚠️ Précautions

### Avant de Force Push

1. **Coordonner avec l'équipe**
   - Prévenir tous les collaborateurs
   - Choisir un moment où personne ne travaille

2. **Faire un backup**
   ```bash
   cp -r unipath-mvp unipath-mvp-backup
   ```

3. **Vérifier les branches**
   ```bash
   git branch -a
   ```

### Après le Force Push

1. **Tous les collaborateurs doivent :**
   ```bash
   # Sauvegarder leur travail local
   git stash
   
   # Supprimer leur copie locale
   cd ..
   rm -rf unipath-mvp
   
   # Re-cloner
   git clone <url>
   cd unipath-mvp
   
   # Restaurer leur travail
   git stash pop
   ```

2. **Révoquer les secrets compromis**
   - Changer le mot de passe de la base de données
   - Régénérer les clés Supabase
   - Changer le mot de passe email
   - Révoquer les tokens Vercel

---

## 🔒 Prévention Future

### 1. Vérifier avant chaque commit

```bash
# Ajouter ce hook pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
  echo "❌ ERREUR : Tentative de commit d'un fichier .env"
  echo "Les fichiers .env ne doivent JAMAIS être commités"
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

### 2. Utiliser git-secrets

```bash
# Installation
brew install git-secrets  # macOS
# ou
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# Configuration
cd unipath-mvp
git secrets --install
git secrets --register-aws
git secrets --add '\.env$'
git secrets --add 'password.*=.*'
git secrets --add 'api[_-]?key.*=.*'
```

### 3. Scanner régulièrement

```bash
# Installer truffleHog
pip install truffleHog

# Scanner le repo
trufflehog --regex --entropy=True .
```

---

## 📋 Checklist

Avant de considérer le nettoyage terminé :

- [ ] Backup du repo créé
- [ ] Fichiers .env retirés de l'historique
- [ ] Vérification : `git log --all --full-history -- "*/.env"` ne retourne rien
- [ ] Force push effectué
- [ ] Équipe notifiée et repos locaux mis à jour
- [ ] Secrets compromis révoqués et régénérés
- [ ] Nouveaux secrets configurés en production
- [ ] Hook pre-commit installé
- [ ] `.gitignore` vérifié et à jour

---

## 🆘 En Cas de Problème

### Le force push échoue

```bash
# Vérifier les protections de branche
# Sur GitHub : Settings → Branches → Branch protection rules
# Désactiver temporairement "Require pull request reviews"
```

### Conflits après re-clone

```bash
# Sauvegarder les changements locaux
git diff > my-changes.patch

# Re-cloner
cd ..
rm -rf unipath-mvp
git clone <url>
cd unipath-mvp

# Appliquer les changements
git apply my-changes.patch
```

### Historique toujours présent

```bash
# Vérifier toutes les branches
git log --all --full-history -- "*/.env"

# Si présent, répéter le nettoyage avec --all
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch unipath-api/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consulter la [documentation Git](https://git-scm.com/docs)
2. Demander de l'aide sur [Stack Overflow](https://stackoverflow.com/questions/tagged/git)
3. Contacter l'équipe : harrydedji@gmail.com

---

**⚠️ RAPPEL** : Ne jamais commiter de secrets. Toujours utiliser des variables d'environnement et des fichiers `.env.example`.
