# DEMO_SCRIPT.md — Script de démonstration UniPath

## Durée totale : 5 à 7 minutes

## Préparation avant la démo
- [ ] Démarrer le backend : cd unipath-api && node server.js
- [ ] Démarrer le frontend : cd unipath-front && npm run dev
- [ ] Ouvrir Chrome sur http://localhost:5173
- [ ] Ouvrir un onglet Supabase (Table Editor)
- [ ] Ouvrir un onglet Resend pour montrer les emails
- [ ] Avoir Postman ouvert

## Étape 1 — Présentation (30 secondes)
"UniPath digitalise les inscriptions aux concours universitaires.
Voici le parcours complet d'un candidat en temps réel."

## Étape 2 — Inscription (1 minute)
- Aller sur http://localhost:5173/register
- Créer un compte : NOM = 'DEMO', Prénom = 'Candidat', Email = candidat.demo@gmail.com
- Montrer dans Supabase que le candidat apparaît avec son matricule UAC-...
- "Le matricule est généré automatiquement par un trigger PostgreSQL."

## Étape 3 — Connexion et inscription à un concours (1 minute)
- Se connecter avec le compte créé
- Montrer le Dashboard avec le matricule
- S'inscrire au concours 'EPAC 2026 Génie Informatique'
- Essayer un autre concours avec conflit de dates → montrer l'erreur
- "Le trigger anti-conflit de dates bloque automatiquement."

## Étape 4 — Upload des pièces (1 minute)
- Uploader une photo d'identité
- Montrer dans Supabase Storage que le fichier est présent

## Étape 5 — Commission (1 minute)
- Aller sur http://localhost:5173/commission
- Valider le dossier du candidat de démo
- Montrer dans Resend que l'email a été envoyé

## Étape 6 — Convocation PDF (30 secondes)
- Retourner sur le Dashboard Candidat
- Télécharger la convocation
- Ouvrir le PDF — généré en PHP avec les couleurs du Bénin

## Étape 7 — Dashboard DGES (30 secondes)
- Aller sur http://localhost:5173/dges
- Montrer les statistiques en temps réel
- "Ces statistiques sont calculées par une vue SQL PostgreSQL."