# Configuration Redirection Email Supabase

## Ce qui a été fait

1. Page de callback créée : unipath-front/src/pages/AuthCallback.jsx
2. Route ajoutée : /auth/callback dans App.jsx
3. Gestion des confirmations : Success, Error, Loading states

## Configuration Supabase REQUISE

### Etape 1 : Configurer URL de redirection

1. Va sur https://krqxuoqijkwxouixqudo.supabase.co
2. Authentication → URL Configuration
3. Ajoute les URLs de redirection :

Developpement local :
http://localhost:5173/auth/callback

Production Vercel :
https://unipath-mvp.vercel.app/auth/callback

### Etape 2 : Configurer Site URL

Dans la meme section URL Configuration :

Site URL developpement :
http://localhost:5173

Site URL production :
https://unipath-mvp.vercel.app

### Etape 3 : Verifier template email Brevo

1. Authentication → Email Templates
2. Selectionne Confirm signup
3. Le template doit contenir {{ .ConfirmationURL }}

## Tester

1. Va sur http://localhost:5173/register
2. Cree un compte avec un vrai email
3. Verifie ta boite mail Brevo
4. Clique sur le lien de confirmation
5. Tu devrais etre redirige vers /auth/callback
6. Puis vers /login avec un message de succes

## Depannage

Probleme : Invalid redirect URL
Solution : Verifie que URL est bien ajoutee dans Authentication → URL Configuration
URL doit etre EXACTEMENT : http://localhost:5173/auth/callback

Probleme : Redirection vers mauvaise URL
Solution : Verifie le Site URL dans Supabase
Doit etre : http://localhost:5173

## Checklist

- URL de redirection ajoutee : http://localhost:5173/auth/callback
- Site URL configure : http://localhost:5173
- Template email verifie
- Page AuthCallback creee et route ajoutee
- Test de creation de compte effectue
- Email de confirmation recu
- Clic sur le lien fonctionne
- Redirection vers /login avec message de succes

Date : 5 Mai 2026
Status : Page de callback creee, configuration Supabase requise
