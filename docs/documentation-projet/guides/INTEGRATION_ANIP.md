# Intégration de l'Identifiant ANIP

## Vue d'ensemble

L'identifiant ANIP (Numéro Personnel d'Identification) est un code unique à 12 chiffres attribué à chaque citoyen béninois enregistré au Registre National des Personnes Physiques (RNPP). Il sert de base pour l'obtention de documents sécurisés (CIP, carte biométrique) et l'accès aux services publics en ligne.

## Spécifications

### Format
- **Type** : Numérique uniquement
- **Longueur** : Exactement 12 chiffres
- **Exemple** : `123456789012`
- **Obligatoire** : Oui, pour tous les candidats

### Validation

#### Backend (`auth.controller.js`)
```javascript
// Vérification de présence
if (!anip) {
  return res.status(400).json({ 
    error: 'L\'identifiant ANIP est obligatoire pour l\'inscription' 
  });
}

// Vérification du format (12 chiffres exactement)
if (!/^\d{12}$/.test(anip)) {
  return res.status(400).json({ 
    error: 'Format ANIP invalide. L\'ANIP doit contenir exactement 12 chiffres' 
  });
}

// Vérification d'unicité
const anipExistant = await prisma.candidat.findFirst({
  where: { anip }
});

if (anipExistant) {
  return res.status(400).json({ 
    error: 'Cet identifiant ANIP est déjà enregistré dans le système' 
  });
}
```

#### Frontend (`Register.jsx`)
```javascript
// Validation dans handleStep1
if (!/^\d{12}$/.test(form.anip)) {
  setError('L\'ANIP doit contenir exactement 12 chiffres');
  return;
}
```

### Champ de formulaire

```jsx
<Field label="Identifiant ANIP (Numéro Personnel d'Identification)" required>
  <Input 
    value={form.anip} 
    onChange={set("anip")} 
    placeholder="123456789012"
    maxLength="12"
    pattern="\d{12}"
    title="L'ANIP doit contenir exactement 12 chiffres"
  />
  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
    Code unique à 12 chiffres du Registre National des Personnes Physiques (RNPP)
  </div>
</Field>
```

## Base de données

### Schéma Prisma
```prisma
model Candidat {
  id String @id @default(uuid())
  matricule String @unique
  nom String
  prenom String
  anip String? // Identifiant ANIP du candidat
  serie String?
  sexe String?
  nationalite String?
  email String @unique
  // ... autres champs
}
```

**Note** : Le champ `anip` est marqué comme optionnel (`String?`) dans le schéma Prisma pour la flexibilité, mais la validation applicative le rend obligatoire lors de l'inscription.

## Sécurité et confidentialité

### Bonnes pratiques
1. **Unicité** : Chaque ANIP ne peut être utilisé qu'une seule fois dans le système
2. **Validation stricte** : Format vérifié côté client et serveur
3. **Confidentialité** : L'ANIP est une donnée personnelle sensible
4. **Audit** : Les tentatives d'utilisation d'ANIP déjà enregistrés sont rejetées

### Recommandations futures
- [ ] Intégration avec l'API du RNPP pour vérification en temps réel
- [ ] Chiffrement de l'ANIP dans la base de données
- [ ] Logs d'audit pour les accès à l'ANIP
- [ ] Conformité RGPD/protection des données personnelles

## Flux d'inscription

1. **Candidat saisit son ANIP** (12 chiffres)
2. **Validation frontend** : Format et longueur
3. **Validation backend** : 
   - Format correct
   - ANIP non déjà utilisé
4. **Création du compte** avec ANIP enregistré
5. **Génération du matricule** unique pour le candidat

## Messages d'erreur

| Situation | Message |
|-----------|---------|
| ANIP manquant | "L'identifiant ANIP est obligatoire pour l'inscription" |
| Format invalide | "Format ANIP invalide. L'ANIP doit contenir exactement 12 chiffres" |
| ANIP déjà utilisé | "Cet identifiant ANIP est déjà enregistré dans le système" |

## Tests

### Cas de test à valider
- ✅ ANIP valide (12 chiffres) : accepté
- ✅ ANIP trop court (< 12 chiffres) : rejeté
- ✅ ANIP trop long (> 12 chiffres) : rejeté
- ✅ ANIP avec lettres : rejeté
- ✅ ANIP avec caractères spéciaux : rejeté
- ✅ ANIP déjà enregistré : rejeté
- ✅ ANIP vide : rejeté

## Évolutions futures

### Phase 2 : Vérification RNPP
Intégration avec l'API du Registre National des Personnes Physiques pour :
- Vérifier l'existence de l'ANIP
- Récupérer automatiquement les informations du citoyen
- Pré-remplir le formulaire (nom, prénom, date de naissance, etc.)

### Phase 3 : Authentification ANIP
Permettre la connexion avec l'ANIP comme identifiant principal.

## Support

Pour toute question concernant l'ANIP :
- Documentation RNPP : [À compléter]
- Contact technique : [À compléter]
