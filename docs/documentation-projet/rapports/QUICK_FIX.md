# 🚀 Correction Rapide - Sécurité

## ⚡ Actions Immédiates (5 minutes)

### 1. Changer le mot de passe Gmail

```
1. Ouvrir: https://myaccount.google.com/apppasswords
2. Révoquer: cowh fjvw kzzj uovp
3. Générer un nouveau mot de passe
4. Copier le nouveau mot de passe
```

### 2. Mettre à jour le fichier .env LOCAL

```bash
# Éditer unipath-api/.env
# Remplacer EMAIL_PASS par le nouveau mot de passe
# NE PAS COMMITER CE FICHIER
```

### 3. Installer les hooks de sécurité

```bash
# Windows PowerShell
bash scripts/install-git-hooks.sh

# Ou manuellement
chmod +x scripts/install-git-hooks.sh
./scripts/install-git-hooks.sh
```

---

## 🔍 Vérifier si le secret est dans Git

```bash
# Vérifier les fichiers trackés
git ls-files | grep .env

# Si rien n'apparaît, c'est bon ✅
# Si des fichiers .env apparaissent, c'est un problème ❌
```

---

## 🧹 Si le secret est dans l'historique Git

### Option A : Utiliser GitHub (Plus simple)

1. Aller sur: https://github.com/VignonCK/unipath-mvp/security
2. Cliquer sur l'alerte GitGuardian
3. Cliquer sur "Dismiss" après avoir changé le mot de passe

### Option B : Nettoyer avec BFG (Plus complet)

```bash
# Télécharger BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Créer un fichier avec le secret
echo "cowh fjvw kzzj uovp" > secrets.txt

# Nettoyer
java -jar bfg.jar --replace-text secrets.txt

# Push forcé
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

---

## ✅ Vérification Finale

```bash
# Vérifier qu'aucun secret n'est présent
bash scripts/check-secrets.sh

# Devrait afficher: ✅ Aucun secret détecté
```

---

## 📋 Checklist

- [ ] Mot de passe Gmail changé
- [ ] `.env` local mis à jour
- [ ] Hooks Git installés
- [ ] Alerte GitGuardian résolue
- [ ] Vérification des secrets OK

---

## 🆘 Besoin d'aide ?

Lire le fichier complet: `SECURITY_ALERT.md`
