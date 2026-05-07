# Problèmes à Résoudre

## ✅ 1. Formats de fichiers (RÉSOLU)

**Problème :** Tous les documents acceptaient PDF, JPG, JPEG, PNG

**Solution appliquée :**
- Photo d'identité : images uniquement (JPG, JPEG, PNG)
- Carte d'identité : PDF ou images
- Acte de naissance : PDF uniquement
- Relevé de notes : PDF uniquement
- Quittance : PDF uniquement

**Commit :** 36f1cb3

---

## ⏳ 2. Visualisation des pièces par la commission

**Problème :** La commission ne peut pas voir les pièces justificatives des candidats

**Solution à implémenter :**
1. Ajouter un bouton "Voir" à côté de chaque pièce dans DashboardCommission
2. Créer une modale ou page pour afficher le document
3. Pour les images : afficher directement
4. Pour les PDF : utiliser un viewer PDF ou télécharger

**Fichiers à modifier :**
- `unipath-front/src/pages/DashboardCommission.jsx`
- Créer un composant `DocumentViewer.jsx`

---

## ⏳ 3. Téléchargement fiche de pré-inscription

**Problème :** Le bouton "Télécharger ma fiche de pré-inscription" ne fonctionne pas

**Solution à implémenter :**
1. Vérifier que l'endpoint `/api/candidats/preinscription/:inscriptionId` existe
2. Implémenter la fonction de téléchargement dans DetailConcours.jsx
3. Utiliser le service `convocationService.telechargerPreinscription()`

**Fichiers à modifier :**
- `unipath-front/src/pages/DetailConcours.jsx`
- Vérifier `unipath-api/src/controllers/pdf.controller.js`

---

## ⏳ 4. PDFs non attachés aux emails

**Problème :** Les emails de pré-inscription et convocation n'ont pas les PDFs en pièce jointe

**Cause probable :**
- Les PDFs ne sont pas générés avant l'envoi de l'email
- Le chemin du PDF n'est pas passé à la fonction d'envoi d'email

**Solution à implémenter :**
1. Dans `inscription.controller.js` : générer le PDF avant d'envoyer l'email
2. Passer le chemin du PDF à `emailService.envoyerEmailPreInscription(data, pdfPath)`
3. Même chose pour la validation/convocation

**Fichiers à modifier :**
- `unipath-api/src/controllers/inscription.controller.js`
- `unipath-api/src/controllers/commission.controller.js`

---

## ⏳ 5. Statut "En cours d'analyse" après validation

**Problème :** Même après validation du dossier, le statut reste "En cours d'analyse"

**Cause probable :**
- Le statut de l'inscription n'est pas mis à jour côté frontend
- Le composant ne rafraîchit pas les données après validation

**Solution à implémenter :**
1. Vérifier que le statut est bien mis à jour dans la base de données
2. Rafraîchir les données de l'inscription après validation
3. Afficher le bon statut selon `inscription.statut`

**Fichiers à modifier :**
- `unipath-front/src/pages/DetailConcours.jsx`
- `unipath-front/src/pages/DetailInscription.jsx`

---

## Priorités

1. **URGENT** : PDFs dans les emails (problème 4)
2. **IMPORTANT** : Téléchargement fiche (problème 3)
3. **IMPORTANT** : Statut après validation (problème 5)
4. **MOYEN** : Visualisation pièces commission (problème 2)

---

**Date :** 5 Mai 2026  
**Status :** 1/5 résolu
