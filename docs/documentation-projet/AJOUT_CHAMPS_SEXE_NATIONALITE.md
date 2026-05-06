# Ajout des champs Sexe et Nationalité

## Date : 6 mai 2026

## Modifications effectuées

### 1. Base de données (Prisma Schema)
✅ **Fichier** : `unipath-api/prisma/schema.prisma`

Ajout de 2 nouveaux champs au modèle `Candidat` :
```prisma
model Candidat {
  // ... autres champs
  sexe String? // Sexe du candidat (M/F)
  nationalite String? // Nationalité du candidat
  // ... autres champs
}
```

✅ **Migration** : `npx prisma db push` exécuté avec succès

### 2. Backend (API)
✅ **Fichier** : `unipath-api/src/controllers/auth.controller.js`

Modification de la fonction `register` pour accepter les nouveaux champs :
```javascript
const { email, password, nom, prenom, sexe, nationalite, telephone, dateNaiss, lieuNaiss } = req.body;

const candidat = await prisma.candidat.create({
  data: {
    // ... autres champs
    sexe: sexe || null,
    nationalite: nationalite || null,
    // ... autres champs
  },
});
```

### 3. Frontend - Page d'inscription
✅ **Fichier** : `unipath-front/src/pages/Register.jsx`

**État du formulaire** :
```javascript
const [form, setForm] = useState({
  nom: "", 
  prenom: "", 
  sexe: "",           // ← Nouveau
  nationalite: "",    // ← Nouveau
  telephone: "",
  dateNaiss: "", 
  lieuNaiss: "",
  email: "", 
  password: "", 
  confirmPassword: "",
});
```

**Validation** :
```javascript
if (!form.nom || !form.prenom || !form.sexe || !form.nationalite || !form.telephone || !form.dateNaiss || !form.lieuNaiss) {
  setError('Tous les champs sont obligatoires');
  return;
}
```

**Champs visuels ajoutés** (Étape 1) :
- **Sexe** : Select avec options Masculin/Féminin
- **Nationalité** : Input texte (ex: "Béninoise")

### 4. Frontend - Page Mon Compte
✅ **Fichier** : `unipath-front/src/pages/MonCompte.jsx`

**Affichage dans la carte profil** :
- Sexe : Affiche "Masculin" ou "Féminin" (ou "Non renseigné")
- Nationalité : Affiche la nationalité (ou "Non renseigné")

**Formulaire d'édition** :
- Sexe : Select avec options
- Nationalité : Input texte

### 5. Frontend - Dashboard Candidat
✅ **Fichier** : `unipath-front/src/pages/DashboardCandidat.jsx`

**Affichage dans la carte profil** :
- Sexe : Affiche "Masculin" ou "Féminin" (ou "Non renseigné")
- Nationalité : Affiche la nationalité (ou "Non renseigné")

**Formulaire d'édition** :
- Sexe : Select avec options
- Nationalité : Input texte

## Résumé des fichiers modifiés

### Backend
1. `unipath-api/prisma/schema.prisma` - Ajout des champs dans le modèle
2. `unipath-api/src/controllers/auth.controller.js` - Accepter les champs à l'inscription

### Frontend
1. `unipath-front/src/pages/Register.jsx` - Formulaire d'inscription
2. `unipath-front/src/pages/MonCompte.jsx` - Affichage et édition du profil
3. `unipath-front/src/pages/DashboardCandidat.jsx` - Affichage et édition du profil

## Format des données

### Sexe
- **Type** : String (optionnel)
- **Valeurs** : 
  - `"M"` pour Masculin
  - `"F"` pour Féminin
  - `null` si non renseigné

### Nationalité
- **Type** : String (optionnel)
- **Format** : Texte libre (ex: "Béninoise", "Française", "Togolaise")
- **Valeur** : `null` si non renseigné

## Affichage

### Dans les formulaires
```jsx
// Sexe
<Field label="Sexe" required>
  <Select value={form.sexe} onChange={set("sexe")}>
    <option value="">Sélectionner</option>
    <option value="M">Masculin</option>
    <option value="F">Féminin</option>
  </Select>
</Field>

// Nationalité
<Field label="Nationalité" required>
  <Input 
    value={form.nationalite} 
    onChange={set("nationalite")} 
    placeholder="Béninoise" 
  />
</Field>
```

### Dans les cartes profil
```jsx
{ label: 'Sexe', value: candidat?.sexe === 'M' ? 'Masculin' : candidat?.sexe === 'F' ? 'Féminin' : <span className='text-orange-500 text-xs'>Non renseigné</span> },
{ label: 'Nationalité', value: candidat?.nationalite || <span className='text-orange-500 text-xs'>Non renseigné</span> },
```

## Tests à effectuer

### 1. Inscription
- [ ] Créer un nouveau compte avec Sexe et Nationalité
- [ ] Vérifier que les champs sont obligatoires
- [ ] Vérifier que les données sont bien enregistrées

### 2. Affichage
- [ ] Vérifier l'affichage dans Mon Compte
- [ ] Vérifier l'affichage dans Dashboard Candidat
- [ ] Vérifier l'affichage "Non renseigné" pour les anciens comptes

### 3. Modification
- [ ] Modifier le sexe depuis Mon Compte
- [ ] Modifier la nationalité depuis Mon Compte
- [ ] Modifier depuis Dashboard Candidat
- [ ] Vérifier que les modifications sont sauvegardées

### 4. Anciens comptes
- [ ] Les anciens comptes (sans sexe/nationalité) doivent afficher "Non renseigné"
- [ ] Ils doivent pouvoir ajouter ces informations via l'édition du profil

## Notes

- Les champs sont **optionnels** dans la base de données (nullable)
- Ils sont **obligatoires** à l'inscription (validation frontend)
- Les anciens comptes peuvent fonctionner sans ces champs
- L'affichage gère gracieusement les valeurs null

## Statut

✅ **TERMINÉ** - Tous les fichiers ont été modifiés et la base de données a été mise à jour.
