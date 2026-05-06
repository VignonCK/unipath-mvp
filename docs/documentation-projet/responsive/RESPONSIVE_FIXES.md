# Corrections Responsive

## Problèmes identifiés

### 1. Textes trop grands sur mobile
- Titres h1, h2 qui ne s'adaptent pas
- Padding/margin fixes qui débordent

### 2. Images et carrousels
- Images qui ne s'adaptent pas à la largeur mobile
- Carrousel qui peut déborder

### 3. Grilles et layouts
- Grids qui ne passent pas en colonne unique sur mobile
- Flex items qui ne wrap pas

### 4. Navigation et header
- Menu qui peut déborder
- Boutons trop larges

## Solutions à appliquer

### Classes Tailwind responsive à utiliser :
- `text-2xl md:text-4xl` au lieu de `text-4xl`
- `px-4 md:px-6` au lieu de `px-6`
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` au lieu de `grid-cols-3`
- `flex-col md:flex-row` pour les flex containers
- `w-full md:w-auto` pour les largeurs
- `text-sm md:text-base` pour les textes

### Pages à corriger :
1. Home.jsx - Hero section, grids
2. Login.jsx - Form layout
3. Register.jsx - Form layout
4. DashboardCandidat.jsx - Cards, grids
5. PageConcours.jsx - Cards grid
6. DetailConcours.jsx - Content width

## Priorités :
1. Home.jsx (page d'accueil)
2. Login/Register (authentification)
3. Dashboards (utilisation principale)
