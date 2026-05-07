# Réponse: Pourquoi les Pièces Personnalisées N'apparaissent Pas ?

## Date: 7 Mai 2026

## ❌ Ce N'est PAS un Problème de Base de Données

**Raison**: Les pièces requises sont stockées dans un champ JSON `piecesRequises` dans la table `Concours`. Ce champ peut contenir n'importe quelle structure JSON, donc il n'y a **aucune contrainte de base de données** qui empêcherait l'ajout de pièces personnalisées.

```sql
-- Structure de la table Concours
CREATE TABLE "Concours" (
  ...
  "piecesRequises" JSONB,  -- ✅ Peut contenir n'importe quel JSON
  ...
);
```

## 🔍 Diagnostic Ajouté

J'ai ajouté des **logs de débogage détaillés** dans votre code pour identifier exactement où le problème se situe.

### Logs Ajoutés

1. **Dans `PiecesConfiguration.jsx`** (composant d'ajout):
   - Log quand vous cliquez sur "Ajouter"
   - Log de la pièce créée
   - Log des pièces avant et après l'ajout
   - Log à chaque render du composant

2. **Dans `GestionConcours.jsx`** (composant parent):
   - Log quand le `onChange` est appelé
   - Log du nombre de pièces reçues
   - Log de `formData` avant et après la mise à jour

## 📋 Comment Diagnostiquer

### Étape 1: Ouvrir la Console du Navigateur

1. Ouvrir votre application dans Chrome/Firefox
2. Appuyer sur **F12** pour ouvrir les DevTools
3. Aller dans l'onglet **"Console"**

### Étape 2: Tester l'Ajout d'une Pièce

1. Aller dans **"Gestion des concours"**
2. Cliquer sur **"Nouveau concours"** ou modifier un concours
3. Scroller jusqu'à la section **"Pièces requises"**
4. Cliquer sur **"Ajouter une pièce personnalisée"**
5. Entrer un nom (ex: "Lettre de recommandation")
6. Cliquer sur **"Ajouter"**

### Étape 3: Observer les Logs dans la Console

Vous devriez voir quelque chose comme:

```
=== RENDER PiecesConfiguration ===
{totalPieces: 5, piecesPersonnalisees: 0, pieces: Array(5)}

=== AJOUT PIÈCE PERSONNALISÉE ===
Nom saisi: Lettre de recommandation
Formats: ["PDF"]
Nouvelle pièce créée: {id: "lettre_de_recommandation", nom: "Lettre de recommandation", ...}
Pièces actuelles AVANT ajout: [5 pièces]
Pièces APRÈS ajout: [6 pièces]
✅ Pièce ajoutée, formulaire réinitialisé

=== ONCHANGE PIECES APPELÉ ===
Nombre de pièces reçues: 6
Pièces reçues: [6 pièces avec la nouvelle]
formData.piecesRequises AVANT: [5 pièces]
formData.piecesRequises APRÈS: [6 pièces]

=== RENDER PiecesConfiguration ===
{totalPieces: 6, piecesPersonnalisees: 1, pieces: Array(6)}
```

## 🎯 Interprétation des Logs

### Scénario A: Tout Fonctionne ✅

Si vous voyez tous les logs ci-dessus ET que `piecesPersonnalisees: 1`:
- ✅ La pièce est bien ajoutée au state
- ✅ Le composant se re-render
- ❓ **Mais pourquoi ne la voyez-vous pas ?**

**Possibilités**:
1. La section "Pièces personnalisées" est cachée visuellement (CSS)
2. La pièce est ajoutée mais avec `predefined: true` au lieu de `false`
3. Le scroll ne vous montre pas la section des pièces personnalisées

**Action**: Scroller vers le bas dans la section "Pièces requises" pour voir si la section "Pièces personnalisées" apparaît.

### Scénario B: onChange N'est Pas Appelé ❌

Si vous voyez:
```
=== AJOUT PIÈCE PERSONNALISÉE ===
...
✅ Pièce ajoutée, formulaire réinitialisé
```

Mais PAS de log `=== ONCHANGE PIECES APPELÉ ===`:
- ❌ Le `onChange` n'est pas passé au composant
- **Solution**: Problème de props

### Scénario C: Aucun Log N'apparaît ❌

Si vous ne voyez AUCUN log:
- ❌ Le code n'est pas exécuté
- **Solution**: Le fichier n'est pas rechargé ou le serveur n'est pas redémarré

**Action**: Redémarrer le serveur frontend:
```bash
cd unipath-front
npm run dev
```

### Scénario D: piecesPersonnalisees Reste à 0 ❌

Si après l'ajout, vous voyez:
```
=== RENDER PiecesConfiguration ===
{totalPieces: 6, piecesPersonnalisees: 0, pieces: Array(6)}
```

- ❌ La pièce est ajoutée mais avec `predefined: true`
- **Solution**: Vérifier que `predefined: false` est bien défini

## 🛠️ Solutions Possibles

### Solution 1: Vérifier le Champ `predefined`

Dans `PiecesConfiguration.jsx`, ligne ~48:
```javascript
const nouvellePiece = {
  id,
  nom: nouvellepiece.nom.trim(),
  formats: nouvellepiece.formats,
  obligatoire: nouvellepiece.obligatoire,
  predefined: false,  // ✅ DOIT être false
};
```

### Solution 2: Forcer un Re-render

Si le problème persiste, essayez de fermer et rouvrir le modal:
1. Cliquer sur "Annuler"
2. Rouvrir le modal
3. Vérifier si la pièce apparaît maintenant

### Solution 3: Vérifier le Scroll

La section "Pièces personnalisées" peut être en dessous des pièces prédéfinies. Scrollez vers le bas dans la section "Pièces requises".

## 📸 Ce Que Je Dois Voir

Pour vous aider efficacement, j'ai besoin de:

1. **Une capture d'écran de la console** avec tous les logs
2. **Me dire si vous voyez**:
   - Le log `=== AJOUT PIÈCE PERSONNALISÉE ===` ?
   - Le log `=== ONCHANGE PIECES APPELÉ ===` ?
   - Le log `=== RENDER PiecesConfiguration ===` avec `piecesPersonnalisees: 1` ?
3. **Une capture d'écran de l'interface** montrant la section "Pièces requises"

## 🚀 Prochaines Étapes

1. **Redémarrer le serveur frontend** pour charger les nouveaux logs:
   ```bash
   cd unipath-front
   npm run dev
   ```

2. **Ouvrir la console** (F12)

3. **Tester l'ajout** d'une pièce personnalisée

4. **Me communiquer** ce que vous voyez dans la console

Avec ces informations, je pourrai identifier précisément le problème et le corriger immédiatement.

## 📁 Fichiers Modifiés

- `unipath-front/src/components/PiecesConfiguration.jsx` - Logs de débogage ajoutés
- `unipath-front/src/pages/GestionConcours.jsx` - Logs de débogage ajoutés
- `docs/documentation-projet/rapports/DEBUG_PIECES_PERSONNALISEES.md` - Guide de diagnostic détaillé
