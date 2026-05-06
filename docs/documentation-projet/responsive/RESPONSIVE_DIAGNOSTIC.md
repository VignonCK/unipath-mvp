# Diagnostic Responsive

## Tests effectués

### ✅ Éléments déjà responsive :
1. **index.html** - Viewport correctement configuré
2. **Home.jsx** - Hero section avec classes md: et sm:
3. **Home.jsx** - Grilles avec grid-cols-1 md:grid-cols-3
4. **Home.jsx** - Carrousel mobile pour fonctionnalités
5. **Login.jsx** - Formulaires avec w-full
6. **Boutons** - flex-col sm:flex-row pour mobile

### ❓ Points à vérifier :

1. **Largeur minimale du body/root**
   - Vérifier qu'il n'y a pas de min-width sur body ou #root

2. **Overflow horizontal**
   - Chercher les éléments qui dépassent (images, grids)
   - Vérifier les padding/margin trop larges

3. **Tailles de texte**
   - Vérifier que tous les titres ont des classes responsive
   - Ex: text-2xl md:text-4xl au lieu de text-4xl fixe

4. **Images**
   - Vérifier que toutes les images ont max-w-full
   - Vérifier les images de fond (background-image)

5. **Tables et grids**
   - Vérifier que les grids passent en 1 colonne sur mobile
   - Vérifier les tables qui peuvent déborder

## Commandes de test

```bash
# Tester en mode mobile dans le navigateur
# Chrome DevTools: F12 → Toggle device toolbar (Ctrl+Shift+M)
# Tester avec différentes tailles:
# - iPhone SE (375px)
# - iPhone 12 Pro (390px)
# - iPad (768px)
```

## Corrections à appliquer

### 1. Ajouter overflow-x-hidden au body
```css
body {
  overflow-x: hidden;
}
```

### 2. Vérifier tous les max-w-
Remplacer les max-w-5xl par max-w-full px-4 md:max-w-5xl

### 3. Vérifier les padding fixes
Remplacer px-6 par px-4 md:px-6

### 4. Images responsive
Ajouter w-full h-auto object-cover à toutes les images

## Pages prioritaires à tester :
1. / (Home)
2. /login
3. /register
4. /dashboard
5. /concours
