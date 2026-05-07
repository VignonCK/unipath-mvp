# Workflow d'Inscription Corrigé

## Date: 7 Mai 2026

## Problème Identifié

Sur les captures d'écran, il y avait une incohérence:
- **Page "Mon compte"**: 4 pièces déposées (Acte, Carte, Photo, Relevé)
- **Page du concours**: Seulement 4 pièces affichées, **la Quittance manquait**

## Cause du Problème

La quittance était filtrée de la liste des pièces requises (`piecesHorsQuittance = toutesLesPieces.filter(p => p !== 'quittance')`) et affichée dans une section séparée qui n'apparaissait qu'APRÈS l'inscription.

## Nouveau Workflow Implémenté

### Étape 1: Compléter le Dossier Général
Le candidat doit d'abord déposer les pièces de son dossier général (partagé entre tous les concours):
- ✅ Acte de naissance
- ✅ Carte d'identité
- ✅ Photo d'identité
- ✅ Relevé de notes Bac

**Bouton**: "Complétez votre dossier pour vous inscrire" (désactivé)

### Étape 2: S'inscrire au Concours
Une fois le dossier général complet, le candidat peut s'inscrire au concours.

**Action**: Cliquer sur "S'inscrire au concours"

**Résultat**: 
- Création d'une inscription avec statut `EN_ATTENTE`
- Message: "Inscription créée ! Veuillez maintenant déposer votre quittance de paiement."

### Étape 3: Déposer la Quittance
Après l'inscription, le candidat peut déposer sa quittance de paiement (spécifique à ce concours).

**Bouton**: "Déposez votre quittance pour soumettre" (désactivé tant que la quittance n'est pas uploadée)

**Action**: Upload de la quittance dans la section "Pièces requises"

### Étape 4: Soumettre le Dossier Complet
Une fois TOUTES les pièces déposées (dossier général + quittance), le candidat peut soumettre son dossier.

**Bouton**: "Soumettre mon dossier complet" (activé)

**Action**: Cliquer sur "Soumettre mon dossier complet"

**Résultat**:
- Dossier marqué comme SOUMIS
- Message: "Dossier soumis avec succès ! Fiche de pré-inscription envoyée par email."

## Architecture des Données

### Table `Dossier` (Dossier Général)
```prisma
model Dossier {
  id              String   @id @default(uuid())
  candidatId      String   @unique
  acteNaissance   String?  // URL Supabase
  carteIdentite   String?  // URL Supabase
  photo           String?  // URL Supabase
  releve          String?  // URL Supabase
  candidat        Candidat @relation(...)
}
```

**Caractéristiques**:
- ✅ Partagé entre tous les concours
- ✅ Uploadé une seule fois
- ✅ Réutilisé pour chaque inscription

### Table `Inscription` (Inscription à un Concours)
```prisma
model Inscription {
  id                String   @id @default(uuid())
  candidatId        String
  concoursId        String
  quittanceUrl      String?  // URL Supabase - SPÉCIFIQUE au concours
  statut            String   @default("EN_ATTENTE")
  piecesExtras      Json?    // Pièces personnalisées
  candidat          Candidat @relation(...)
  concours          Concours @relation(...)
}
```

**Caractéristiques**:
- ✅ Spécifique à chaque concours
- ✅ Contient la quittance de paiement
- ✅ Peut contenir des pièces personnalisées

## Affichage des Pièces Requises

### Avant Inscription
```
Pièces requises                    0/5 fournie

25% — Complétez votre dossier pour pouvoir soumettre

❌ Acte de naissance              [Déposer]
❌ Carte d'identité               [Déposer]
❌ Photo d'identité               [Déposer]
❌ Relevé de notes Bac            [Déposer]
❌ Quittance de paiement          [Déposer] (désactivé - inscription requise)

[Complétez votre dossier pour vous inscrire] (désactivé)
```

### Après Dépôt du Dossier Général
```
Pièces requises                    4/5 fournies

80% — Complétez votre dossier pour pouvoir soumettre

✅ Acte de naissance              [Modifier]
✅ Carte d'identité               [Modifier]
✅ Photo d'identité               [Modifier]
✅ Relevé de notes Bac            [Modifier]
❌ Quittance de paiement          [Déposer] (désactivé - inscription requise)

[S'inscrire au concours] (activé)
```

### Après Inscription (Sans Quittance)
```
Pièces requises                    4/5 fournies

80% — Complétez votre dossier pour pouvoir soumettre

✅ Acte de naissance              [Modifier]
✅ Carte d'identité               [Modifier]
✅ Photo d'identité               [Modifier]
✅ Relevé de notes Bac            [Modifier]
❌ Quittance de paiement          [Déposer] (activé)

[Déposez votre quittance pour soumettre] (désactivé)
```

### Après Dépôt de la Quittance
```
Pièces requises                    5/5 fournies

100% — Dossier complet !

✅ Acte de naissance              [Modifier]
✅ Carte d'identité               [Modifier]
✅ Photo d'identité               [Modifier]
✅ Relevé de notes Bac            [Modifier]
✅ Quittance de paiement          [Modifier]

[Soumettre mon dossier complet] (activé)
```

## Modifications Apportées

### 1. `DetailConcours.jsx` - Affichage des Pièces

**Avant**:
```javascript
const piecesHorsQuittance = toutesLesPieces.filter(p => p !== 'quittance');
// La quittance n'était pas affichée dans la liste
```

**Après**:
```javascript
const toutesLesPieces = getPiecesRequisesConcours(concours);
// Toutes les pièces y compris la quittance sont affichées
```

### 2. `DetailConcours.jsx` - Logique de Soumission

**Avant**:
```javascript
const handleSoumettreDossier = async () => {
  // Vérifier toutes les pièces y compris quittance
  // Créer l'inscription
  // ❌ Impossible car on ne peut pas uploader la quittance avant l'inscription
};
```

**Après**:
```javascript
const handleSoumettreDossier = async () => {
  if (!inscription) {
    // Étape 1: Créer l'inscription (sans vérifier la quittance)
    const piecesDossier = getPiecesRequisesConcours(concours).filter(p => p !== 'quittance');
    // Vérifier seulement les pièces du dossier général
    // Créer l'inscription
    return;
  }
  
  // Étape 2: Soumettre le dossier complet (avec quittance)
  const toutesLesPiecesRequises = getPiecesRequisesConcours(concours);
  // Vérifier TOUTES les pièces y compris la quittance
  // Soumettre le dossier
};
```

### 3. `DetailConcours.jsx` - Texte du Bouton

**Avant**:
```javascript
{dossierComplet ? 'Soumettre mon dossier' : 'Dossier incomplet'}
```

**Après**:
```javascript
{!inscription ? (dossierComplet ? "S'inscrire au concours" : 'Complétez votre dossier') :
 !inscription.quittanceUrl ? 'Déposez votre quittance pour soumettre' :
 'Soumettre mon dossier complet'}
```

## Avantages du Nouveau Workflow

1. ✅ **Clarté**: Le candidat comprend exactement où il en est
2. ✅ **Cohérence**: Toutes les pièces sont affichées au même endroit
3. ✅ **Logique**: On ne peut pas uploader la quittance avant l'inscription
4. ✅ **Réutilisation**: Le dossier général est partagé entre tous les concours
5. ✅ **Traçabilité**: Chaque étape est clairement identifiée

## Fichiers Modifiés

- `unipath-front/src/pages/DetailConcours.jsx` - Workflow complet corrigé

## Tests à Effectuer

1. **Tester le workflow complet**:
   - Se connecter en tant que candidat
   - Aller sur la page d'un concours
   - Vérifier que toutes les pièces (y compris quittance) sont affichées
   - Déposer les pièces du dossier général
   - Cliquer sur "S'inscrire au concours"
   - Vérifier que l'inscription est créée
   - Déposer la quittance
   - Cliquer sur "Soumettre mon dossier complet"
   - Vérifier que le dossier est soumis

2. **Tester la réutilisation du dossier**:
   - S'inscrire à un premier concours
   - Déposer toutes les pièces
   - S'inscrire à un deuxième concours
   - Vérifier que les pièces du dossier général sont déjà marquées comme déposées
   - Déposer seulement la quittance du deuxième concours

## Prochaines Étapes

1. Implémenter l'API pour marquer le dossier comme SOUMIS
2. Envoyer l'email de confirmation avec la fiche de pré-inscription
3. Ajouter des notifications pour chaque étape du workflow
