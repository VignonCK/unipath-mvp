# ⚡ Quick Start - Page Détail Commission

## 🎯 En Bref

Une nouvelle page permet aux membres de la commission de voir le profil complet d'un candidat et de prendre des décisions (VALIDÉ, REJETÉ, SOUS RÉSERVE).

---

## 🚀 Démarrage Rapide

### 1. Lancer l'Application

```bash
# Terminal 1 - Backend
cd unipath-api
npm run dev

# Terminal 2 - Frontend
cd unipath-front
npm run dev
```

### 2. Se Connecter

- URL : `http://localhost:5173/login`
- Email : `commission@unipath.bj`
- Mot de passe : [Votre mot de passe]

### 3. Accéder à la Page

1. Dashboard Commission → `/commission`
2. Cliquer sur **"Voir le profil complet"** d'un dossier
3. Page de détail → `/commission/candidat/:id`

---

## 📋 Fonctionnalités Principales

### 1. Voir le Profil
- ✅ Informations personnelles complètes
- ✅ Informations du concours
- ✅ Statut du dossier

### 2. Examiner les Pièces
- ✅ Liste de toutes les pièces (5 + quittance)
- ✅ Indicateur de complétude (X/5)
- ✅ Bouton "Voir" pour visualiser
- ✅ Téléchargement possible

### 3. Prendre une Décision

#### Valider
- Clic sur **"Valider le dossier"** (vert)
- Email de convocation envoyé automatiquement

#### Sous Réserve
- Clic sur **"Sous réserve"** (orange)
- Saisir les conditions à remplir
- Email envoyé au candidat

#### Rejeter
- Clic sur **"Rejeter"** (rouge)
- Saisir le motif du rejet
- Email envoyé au candidat

---

## 🎨 Codes Couleurs

- 🟡 **Jaune** : En attente
- 🟢 **Vert** : Validé
- 🟠 **Orange** : Sous réserve
- 🔴 **Rouge** : Rejeté

---

## 📁 Fichiers Créés

### Code
1. `unipath-front/src/pages/DetailCandidatCommission.jsx` ⭐ **NOUVEAU**
2. `unipath-front/src/App.jsx` (modifié)
3. `unipath-front/src/pages/DashboardCommission.jsx` (modifié)

### Documentation
1. `PAGE_DETAIL_CANDIDAT_COMMISSION.md` - Doc technique
2. `GUIDE_UTILISATION_COMMISSION.md` - Guide utilisateur
3. `FLUX_COMMISSION_VISUAL.md` - Flux visuels
4. `TESTS_PAGE_DETAIL_COMMISSION.md` - Plan de tests
5. `EXEMPLE_TEST_MANUEL.md` - Scénarios de test
6. `CAPTURES_ECRAN_ATTENDUES.md` - Référence visuelle
7. `RESUME_PAGE_DETAIL_COMMISSION.md` - Résumé
8. `IMPLEMENTATION_COMPLETE.md` - Statut complet

---

## 🧪 Test Rapide

### Scénario Complet (5 minutes)

1. **Connexion** (30s)
   - Se connecter en tant que commission
   - Vérifier la redirection vers `/commission`

2. **Navigation** (30s)
   - Cliquer sur "Voir le profil complet"
   - Vérifier l'affichage de la page de détail

3. **Examen** (2 min)
   - Vérifier les informations du candidat
   - Cliquer sur "Voir" pour une pièce
   - Vérifier l'affichage du document

4. **Action** (1 min)
   - Cliquer sur "Valider" (ou "Sous réserve" ou "Rejeter")
   - Vérifier le message de confirmation
   - Vérifier le changement de statut

5. **Retour** (30s)
   - Cliquer sur la flèche de retour
   - Vérifier le retour au dashboard

---

## 📚 Documentation

### Pour Commencer
- 📖 **Guide utilisateur** : `GUIDE_UTILISATION_COMMISSION.md`
- 🧪 **Test manuel** : `EXEMPLE_TEST_MANUEL.md`

### Pour Approfondir
- 🔧 **Doc technique** : `PAGE_DETAIL_CANDIDAT_COMMISSION.md`
- 🎨 **Flux visuels** : `FLUX_COMMISSION_VISUAL.md`
- 📸 **Captures d'écran** : `CAPTURES_ECRAN_ATTENDUES.md`

### Pour Tester
- ✅ **Plan de tests** : `TESTS_PAGE_DETAIL_COMMISSION.md`
- 🎯 **Scénarios** : `EXEMPLE_TEST_MANUEL.md`

---

## 🔑 Points Clés

### Navigation
```
Dashboard → Clic "Voir le profil" → Page de détail → Retour
```

### Actions Disponibles
```
EN_ATTENTE → [Valider] [Sous réserve] [Rejeter]
VALIDÉ     → Aucune action (statut final)
REJETÉ     → Aucune action (statut final)
SOUS_RESERVE → Aucune action (en attente de correction)
```

### Emails Automatiques
```
Valider       → Email + PDF de convocation
Sous réserve  → Email + Conditions à remplir
Rejeter       → Email + Motif du rejet
```

---

## ⚠️ Points d'Attention

### Champs Obligatoires
- ❗ **Rejet** : Le motif est obligatoire
- ❗ **Sous réserve** : Les conditions sont obligatoires

### Statuts
- ⚠️ Les dossiers **VALIDÉS** et **REJETÉS** ne peuvent plus être modifiés
- ⚠️ Les dossiers **SOUS_RESERVE** attendent une correction du candidat

### Documents
- 📄 Seules les pièces **déposées** peuvent être visualisées
- 💾 Le téléchargement est possible pour toutes les pièces déposées

---

## 🆘 Problèmes Courants

### Le document ne s'affiche pas
- Vérifier la connexion internet
- Essayer de télécharger le document
- Vérifier que la pièce est bien déposée

### Je ne peux pas prendre de décision
- Vérifier que le dossier est en statut **EN_ATTENTE**
- Les autres statuts ne permettent pas d'action

### Le commentaire est obligatoire
- Pour **Rejeter** et **Sous réserve**, un commentaire est obligatoire
- Rédiger un message clair et professionnel

---

## 📞 Support

### Documentation
- 📖 Consulter les 8 fichiers MD créés
- 🔍 Rechercher dans `GUIDE_UTILISATION_COMMISSION.md`

### Technique
- 🐛 Vérifier les logs du backend
- 🌐 Vérifier la console du navigateur
- 📧 Contacter l'équipe de développement

---

## ✅ Checklist de Validation

### Avant de Commencer
- [ ] Backend démarré
- [ ] Frontend démarré
- [ ] Compte commission créé
- [ ] Données de test disponibles

### Test Rapide
- [ ] Connexion réussie
- [ ] Navigation vers page de détail
- [ ] Affichage des informations
- [ ] Visualisation d'un document
- [ ] Prise d'une décision
- [ ] Retour au dashboard

### Validation
- [ ] Aucune erreur dans la console
- [ ] Emails reçus
- [ ] Statuts mis à jour
- [ ] Interface responsive

---

## 🎯 Prochaines Étapes

1. ✅ **Tester** avec des données réelles
2. ✅ **Former** les utilisateurs
3. ✅ **Déployer** en production
4. ✅ **Recueillir** les retours

---

## 🏆 Résultat

**Page opérationnelle et prête à l'emploi !** 🚀

Les membres de la commission peuvent maintenant :
- ✅ Voir le profil complet des candidats
- ✅ Examiner les pièces justificatives
- ✅ Prendre des décisions éclairées
- ✅ Notifier automatiquement les candidats

---

## 📊 En Chiffres

- **1** nouvelle page
- **3** actions possibles
- **5** pièces à examiner
- **8** fichiers de documentation
- **~600** lignes de code
- **~50** pages de documentation

---

## 💡 Astuce

Pour un test rapide, utilisez le scénario de 5 minutes dans la section "Test Rapide" ci-dessus. Cela vous permettra de valider rapidement que tout fonctionne correctement.

---

**Date** : 6 mai 2026
**Statut** : ✅ PRÊT
**Version** : 1.0.0

🎉 **Bonne utilisation !**
