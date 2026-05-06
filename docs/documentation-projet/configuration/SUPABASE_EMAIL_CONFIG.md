# Configuration Email Supabase

## Problème
Les comptes créés nécessitent une confirmation par email, mais Supabase n'envoie pas les emails car le SMTP n'est pas configuré.

## Solution 1 : Configurer SMTP Custom (Recommandé)

### Étapes :
1. Aller sur https://krqxuoqijkwxouixqudo.supabase.co
2. **Settings → Project Settings → SMTP Settings**
3. Activer **"Enable Custom SMTP"**
4. Configurer :
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: harrydedji@gmail.com
   Password: xcsd cvlh gtvj eakk
   Sender email: harrydedji@gmail.com
   Sender name: UniPath
   ```
5. Tester l'envoi d'email

### Personnaliser le template d'email :
1. **Settings → Auth → Email Templates**
2. Modifier le template "Confirm signup"
3. Personnaliser le message

## Solution 2 : Désactiver la confirmation email (Développement uniquement)

### Étapes :
1. Aller sur https://krqxuoqijkwxouixqudo.supabase.co
2. **Authentication → Settings**
3. Désactiver **"Enable email confirmations"**
4. Les comptes seront actifs immédiatement

⚠️ **Attention** : En production, il faut TOUJOURS activer la confirmation email pour éviter les faux comptes.

## Solution 3 : Utiliser un service email tiers

### Option A : Resend (Gratuit jusqu'à 3000 emails/mois)
1. Créer un compte sur https://resend.com
2. Obtenir une API key
3. Configurer dans Supabase SMTP Settings

### Option B : SendGrid (Gratuit jusqu'à 100 emails/jour)
1. Créer un compte sur https://sendgrid.com
2. Obtenir une API key
3. Configurer dans Supabase SMTP Settings

## Vérifier si ça marche

### Test 1 : Créer un compte
```bash
# Frontend
npm run dev

# Créer un compte avec un vrai email
# Vérifier si l'email de confirmation arrive
```

### Test 2 : Vérifier les logs Supabase
1. **Logs → Auth Logs**
2. Chercher les erreurs d'envoi d'email

### Test 3 : Vérifier le statut du compte
```sql
-- Dans Supabase SQL Editor
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

Si `email_confirmed_at` est NULL, le compte n'est pas confirmé.

## Forcer la confirmation d'un compte (Développement)

```sql
-- Dans Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'email@example.com';
```

## Configuration actuelle

**SMTP configuré dans .env :**
- Host: smtp.gmail.com
- Port: 587
- User: harrydedji@gmail.com
- Pass: xcsd cvlh gtvj eakk

**Action requise :**
Configurer ces mêmes credentials dans Supabase Dashboard pour que les emails de confirmation soient envoyés.

---

**Date:** 5 Mai 2026  
**Status:** ⏳ Configuration SMTP Supabase requise
