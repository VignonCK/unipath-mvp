# Guide de Contribution

Merci de contribuer à UniPath ! Voici les règles à suivre.

## 🔀 Workflow Git

### Branches

- `main` — Production (protégée)
- `develop` — Développement (branche par défaut)
- `feature/nom-feature` — Nouvelles fonctionnalités
- `fix/nom-bug` — Corrections de bugs
- `hotfix/nom-urgence` — Corrections urgentes en production

### Créer une branche

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-nouvelle-feature
```

### Commits

Utiliser des messages clairs et descriptifs :

```bash
git commit -m "feat: ajout de la validation Zod pour les inscriptions"
git commit -m "fix: correction du bug d'upload de fichiers"
git commit -m "docs: mise à jour du README"
```

Préfixes recommandés :
- `feat:` — Nouvelle fonctionnalité
- `fix:` — Correction de bug
- `docs:` — Documentation
- `style:` — Formatage (pas de changement de code)
- `refactor:` — Refactoring
- `test:` — Ajout de tests
- `chore:` — Tâches de maintenance

### Pull Requests

1. Créer une PR depuis votre branche vers `develop`
2. Remplir le template de PR
3. Attendre la review d'un membre de l'équipe
4. Corriger les commentaires si nécessaire
5. Merger après approbation

## 🧪 Tests

Avant de soumettre une PR :

```bash
# Backend
cd unipath-api
npm test

# Frontend
cd unipath-front
npm run lint
npm run build
```

## 📝 Standards de Code

### Backend

- Utiliser `const` par défaut, `let` si nécessaire
- Nommer les fonctions de manière descriptive
- Ajouter des commentaires pour la logique complexe
- Valider toutes les entrées utilisateur avec Zod
- Gérer les erreurs avec try/catch

### Frontend

- Utiliser des composants fonctionnels avec hooks
- Nommer les composants en PascalCase
- Extraire la logique complexe dans des hooks personnalisés
- Utiliser TailwindCSS pour le styling
- Éviter les props drilling (utiliser Context si nécessaire)

## 🔒 Sécurité

- **Ne jamais commiter de secrets** (`.env`, tokens, mots de passe)
- Vérifier le `.gitignore` avant chaque commit
- Utiliser des variables d'environnement pour les configs sensibles
- Valider et sanitiser toutes les entrées utilisateur

## 📦 Dépendances

Avant d'ajouter une nouvelle dépendance :

1. Vérifier qu'elle est activement maintenue
2. Vérifier les vulnérabilités connues
3. Discuter avec l'équipe si c'est une dépendance majeure

```bash
npm install --save nouvelle-dependance
```

## 🐛 Signaler un Bug

Ouvrir une issue avec :

- Description claire du problème
- Étapes pour reproduire
- Comportement attendu vs comportement actuel
- Captures d'écran si pertinent
- Environnement (OS, navigateur, version Node)

## 💡 Proposer une Fonctionnalité

Ouvrir une issue avec :

- Description de la fonctionnalité
- Cas d'usage
- Mockups ou wireframes si possible
- Impact sur l'architecture existante

## 📞 Questions

Contacter l'équipe sur Discord ou par email.
