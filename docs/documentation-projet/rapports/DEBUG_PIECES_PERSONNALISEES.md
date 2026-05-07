# Diagnostic: Pièces Personnalisées N'apparaissent Pas

## Date: 7 Mai 2026

## Problème Rapporté

Les pièces personnalisées ajoutées à un concours n'apparaissent pas dans l'interface.

## Ce N'est PAS un Problème de Base de Données

**Raison**: Les pièces requises sont stockées dans le champ JSON `piecesRequises` de la table `Concours`. Ce champ peut contenir n'importe quelle structure JSON, donc il n'y a pas de contrainte de base de données qui empêcherait l'ajout de pièces personnalisées.

## Diagnostic Ajouté

J'ai ajouté des logs de débogage détaillés dans deux fichiers:

### 1. `PiecesConfiguration.jsx` - Composant d'ajout de pièces

**Logs ajoutés dans `ajouterPiecePersonnalisee()`**:
```javascript
console.log('=== AJOUT PIÈCE PERSONNALISÉE ===');
console.log('Nom saisi:', nouvellepiece.nom);
console.log('Formats:', nouvellepiece.formats);
console.log('Nouvelle pièce créée:', nouvellePiece);
console.log('Pièces actuelles AVANT ajout:', piecesRequises);
console.log('Pièces APRÈS ajout:', nouvellesPieces);
console.log('✅ Pièce ajoutée, formulaire réinitialisé');
```

### 2. `GestionConcours.jsx` - Composant parent

**Logs ajoutés dans le `onChange` de PiecesConfiguration**:
```javascript
console.log('=== ONCHANGE PIECES APPELÉ ===');
console.log('Nombre de pièces reçues:', pieces.length);
console.log('Pièces reçues:', pieces);
console.log('formData.piecesRequises AVANT:', formData.piecesRequises);
console.log('formData.piecesRequises APRÈS:', newFormData.piecesRequises);
```

## Comment Diagnostiquer

### Étape 1: Ouvrir la Console du Navigateur

1. Ouvrir l'application dans le navigateur
2. Appuyer sur `F12` pour ouvrir les DevTools
3. Aller dans l'onglet "Console"

### Étape 2: Tester l'Ajout d'une Pièce Personnalisée

1. Aller dans "Gestion des concours"
2. Cliquer sur "Nouveau concours" ou modifier un concours existant
3. Dans la section "Pièces requises", cliquer sur "Ajouter une pièce personnalisée"
4. Entrer un nom (ex: "Lettre de recommandation")
5. Sélectionner les formats
6. Cliquer sur "Ajouter"

### Étape 3: Analyser les Logs

**Scénario 1: Les logs n'apparaissent pas du tout**
- ❌ Le bouton "Ajouter" ne déclenche pas la fonction
- **Solution**: Vérifier que le bouton n'est pas désactivé (vérifier `disabled={...}`)

**Scénario 2: Les logs apparaissent mais la pièce n'est pas dans la liste**
```
=== AJOUT PIÈCE PERSONNALISÉE ===
Nom saisi: Lettre de recommandation
Formats: ["PDF"]
Nouvelle pièce créée: {id: "lettre_de_recommandation", nom: "Lettre de recommandation", ...}
Pièces actuelles AVANT ajout: [...]
Pièces APRÈS ajout: [...] // ✅ La pièce est bien dans le tableau
```

Si vous voyez cela mais que la pièce n'apparaît pas visuellement:
- ❌ Le problème est dans le rendu du composant
- **Solution**: Vérifier la section "Pièces personnalisées" dans le JSX

**Scénario 3: onChange n'est pas appelé**
```
=== AJOUT PIÈCE PERSONNALISÉE ===
...
✅ Pièce ajoutée, formulaire réinitialisé
```

Mais pas de log `=== ONCHANGE PIECES APPELÉ ===`:
- ❌ Le `onChange` n'est pas passé correctement au composant
- **Solution**: Vérifier que `<PiecesConfiguration onChange={...} />` est bien défini

**Scénario 4: onChange est appelé mais formData n'est pas mis à jour**
```
=== ONCHANGE PIECES APPELÉ ===
Nombre de pièces reçues: 6
formData.piecesRequises AVANT: [5 pièces]
formData.piecesRequises APRÈS: [6 pièces] // ✅ Mis à jour
```

Si vous voyez cela mais que la pièce n'apparaît toujours pas:
- ❌ Le problème est dans le re-render du composant
- **Solution**: Vérifier que React détecte bien le changement d'état

## Causes Possibles

### 1. Problème de Référence d'Objet

Si `piecesRequises` est un tableau, React doit détecter que c'est un nouveau tableau pour re-render.

**Vérification**:
```javascript
// ❌ Mauvais - modifie le tableau existant
piecesRequises.push(nouvellePiece);
onChange(piecesRequises);

// ✅ Bon - crée un nouveau tableau
onChange([...piecesRequises, nouvellePiece]);
```

### 2. Problème de Clé React

Si les pièces personnalisées utilisent la même clé que les pièces prédéfinies, React peut ne pas les afficher.

**Vérification dans le JSX**:
```javascript
{piecesRequises.filter(p => !p.predefined).map(piece => (
  <div key={piece.id}> // ✅ Chaque pièce doit avoir un ID unique
    ...
  </div>
))}
```

### 3. Problème de Filtre

Si le filtre `!p.predefined` ne fonctionne pas correctement.

**Vérification**:
```javascript
console.log('Pièces personnalisées:', piecesRequises.filter(p => !p.predefined));
```

Si ce tableau est vide alors que vous avez ajouté des pièces:
- ❌ Le champ `predefined` n'est pas défini correctement
- **Solution**: S'assurer que `predefined: false` est bien défini lors de la création

### 4. Problème de Condition d'Affichage

Si la section "Pièces personnalisées" a une condition qui empêche l'affichage.

**Vérification dans le JSX**:
```javascript
{piecesRequises.filter(p => !p.predefined).length > 0 && (
  <div>
    <p>Pièces personnalisées</p>
    ...
  </div>
)}
```

Si `length > 0` est faux alors que vous avez ajouté des pièces:
- ❌ Le filtre ne trouve pas les pièces personnalisées
- **Solution**: Vérifier le champ `predefined`

## Solution Temporaire: Vérification Manuelle

Si les logs montrent que tout fonctionne mais que l'affichage ne se met pas à jour, essayez de:

1. **Fermer et rouvrir le modal**
   - Cliquer sur "Annuler"
   - Rouvrir le modal de création/modification
   - Vérifier si les pièces personnalisées apparaissent maintenant

2. **Rafraîchir la page**
   - Appuyer sur `F5`
   - Rouvrir le modal
   - Vérifier si les pièces sont toujours là

Si les pièces apparaissent après avoir fermé/rouvert le modal:
- ❌ Le problème est un problème de re-render React
- **Solution**: Forcer un re-render avec une clé unique sur le composant

## Prochaines Étapes

1. **Tester avec les logs** et me communiquer ce que vous voyez dans la console
2. **Prendre une capture d'écran** de la console avec les logs
3. **Me dire exactement ce qui se passe**:
   - Les logs apparaissent-ils ?
   - Quel est le contenu des logs ?
   - La pièce apparaît-elle après avoir fermé/rouvert le modal ?

Avec ces informations, je pourrai identifier précisément le problème et le corriger.

## Fichiers Modifiés pour le Diagnostic

- `unipath-front/src/components/PiecesConfiguration.jsx` - Logs ajoutés dans `ajouterPiecePersonnalisee()`
- `unipath-front/src/pages/GestionConcours.jsx` - Logs ajoutés dans le `onChange`

## Commande pour Tester

```bash
cd unipath-front
npm run dev
```

Puis ouvrir http://localhost:5173 et suivre les étapes de diagnostic ci-dessus.
