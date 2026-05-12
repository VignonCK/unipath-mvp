# 🎨 Academic Bento-Glass Design System

## Vue d'ensemble

Le **Academic Bento-Glass Design System** est un système de design ultra-premium qui combine :
- **Bento Grid** : Disposition en grille modulaire inspirée des boîtes bento japonaises
- **Glassmorphism** : Effets de verre avec transparence et flou d'arrière-plan
- **Academic Aesthetic** : Palette de couleurs professionnelle et typographie académique

## 🎯 Principes de Design

### 1. Hiérarchie Visuelle
- Utilisation de cartes en verre pour créer de la profondeur
- Ombres douces et progressives
- Espacement généreux pour la lisibilité

### 2. Cohérence
- Palette de couleurs unifiée (Bleu académique + Orange accent)
- Bordures arrondies uniformes (16-24px)
- Transitions fluides (300ms cubic-bezier)

### 3. Accessibilité
- Contraste suffisant malgré la transparence
- Tailles de police lisibles (14px minimum)
- États hover/focus clairement visibles

## 🎨 Palette de Couleurs

```css
/* Couleurs principales */
--primary-blue: #1e3a8a     /* Bleu académique profond */
--primary-orange: #f97316   /* Orange accent énergique */
--accent-slate: #334155     /* Gris ardoise pour la commission */

/* Effets de verre */
--glass-bg: rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.18)
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15)
```

## 📦 Composants Disponibles

### AcademicLayout
Layout principal avec header glass et footer

```jsx
import AcademicLayout from '../components/AcademicLayout';

<AcademicLayout 
  title="Tableau de bord" 
  subtitle="Espace candidat"
  showBackButton={true}
>
  {/* Votre contenu */}
</AcademicLayout>
```

### BentoCard
Carte avec effet de verre

```jsx
import { BentoCard } from '../components/AcademicLayout';

<BentoCard hover={true} className="p-6">
  <h3>Titre de la carte</h3>
  <p>Contenu...</p>
</BentoCard>
```

### BentoGrid
Grille responsive pour organiser les cartes

```jsx
import { BentoGrid } from '../components/AcademicLayout';

<BentoGrid columns="auto-fit">
  <BentoCard>Carte 1</BentoCard>
  <BentoCard>Carte 2</BentoCard>
  <BentoCard>Carte 3</BentoCard>
</BentoGrid>
```

### GlassBadge
Badge avec effet de verre

```jsx
import { GlassBadge } from '../components/AcademicLayout';

<GlassBadge variant="success">Validé</GlassBadge>
<GlassBadge variant="warning">En attente</GlassBadge>
<GlassBadge variant="error">Rejeté</GlassBadge>
```

### AcademicButton
Bouton avec style académique

```jsx
import { AcademicButton } from '../components/AcademicLayout';

<AcademicButton variant="primary">
  Valider
</AcademicButton>

<AcademicButton variant="glass">
  Annuler
</AcademicButton>
```

### ProgressBar
Barre de progression avec effet glass

```jsx
import { ProgressBar } from '../components/AcademicLayout';

<ProgressBar value={75} max={100} showLabel={true} />
```

### StatCard
Carte de statistique avec icône

```jsx
import { StatCard } from '../components/AcademicLayout';

<StatCard
  icon={<svg>...</svg>}
  label="Total candidats"
  value="1,234"
  trend={12}
/>
```

## 🎭 Classes CSS Utilitaires

### Backgrounds
```css
.academic-bg          /* Background avec pattern académique */
.glass-card           /* Carte avec effet de verre */
.glass-card-intense   /* Carte avec effet de verre intense */
.depth-card           /* Carte avec ombres profondes */
```

### Layouts
```css
.bento-grid           /* Grille bento responsive */
.bento-item           /* Item de grille bento */
```

### Effets
```css
.gradient-text        /* Texte avec dégradé */
.academic-divider     /* Séparateur académique */
.tooltip-glass        /* Tooltip avec effet de verre */
```

### Animations
```css
.animate-slide-in     /* Animation d'entrée par le bas */
.animate-fade-in      /* Animation de fondu */
```

### Inputs
```css
.input-glass          /* Input avec effet de verre */
```

### Scrollbar
```css
.custom-scrollbar     /* Scrollbar personnalisée */
```

## 📱 Responsive Design

Le système est entièrement responsive avec des breakpoints :
- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px

Les cartes s'adaptent automatiquement :
```css
/* Mobile : 1 colonne */
/* Tablet : 2 colonnes */
/* Desktop : 3 colonnes */
```

## 🚀 Migration des Pages Existantes

### Étape 1 : Importer les composants
```jsx
import AcademicLayout, { 
  BentoCard, 
  BentoGrid, 
  GlassBadge,
  AcademicButton,
  ProgressBar 
} from '../components/AcademicLayout';
```

### Étape 2 : Wrapper la page
```jsx
export default function MaPage() {
  return (
    <AcademicLayout title="Ma Page" subtitle="Description">
      {/* Contenu */}
    </AcademicLayout>
  );
}
```

### Étape 3 : Remplacer les cartes
```jsx
/* Avant */
<div className="bg-white rounded-lg shadow p-6">
  Contenu
</div>

/* Après */
<BentoCard>
  Contenu
</BentoCard>
```

### Étape 4 : Utiliser les grilles
```jsx
/* Avant */
<div className="grid grid-cols-3 gap-4">
  <div>...</div>
  <div>...</div>
  <div>...</div>
</div>

/* Après */
<BentoGrid>
  <BentoCard>...</BentoCard>
  <BentoCard>...</BentoCard>
  <BentoCard>...</BentoCard>
</BentoGrid>
```

## 🎨 Exemples d'Utilisation

### Dashboard Candidat
```jsx
<AcademicLayout title="Tableau de bord" subtitle="Espace candidat">
  <BentoGrid>
    <StatCard
      icon={<svg>...</svg>}
      label="Inscriptions"
      value="3"
      trend={50}
    />
    <StatCard
      icon={<svg>...</svg>}
      label="Dossiers validés"
      value="2"
      trend={100}
    />
  </BentoGrid>

  <BentoCard className="mt-6">
    <h2 className="text-xl font-bold mb-4">Mes concours</h2>
    <ProgressBar value={75} max={100} />
  </BentoCard>
</AcademicLayout>
```

### Liste avec badges
```jsx
<BentoCard>
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold">Concours EPAC</h3>
      <p className="text-sm text-gray-600">Inscription validée</p>
    </div>
    <GlassBadge variant="success">Validé</GlassBadge>
  </div>
</BentoCard>
```

## 🔧 Personnalisation

### Modifier les couleurs
Éditez `src/styles/academicBento.css` :
```css
:root {
  --primary-blue: #votre-couleur;
  --primary-orange: #votre-couleur;
}
```

### Ajouter des variantes
Créez de nouvelles classes dans le fichier CSS :
```css
.glass-card-custom {
  background: rgba(votre-couleur);
  /* ... */
}
```

## 📊 Performance

- **Backdrop-filter** : Utilise l'accélération GPU
- **Transitions** : Optimisées avec `cubic-bezier`
- **Animations** : Utilise `transform` et `opacity` uniquement
- **Images** : Lazy loading recommandé

## ♿ Accessibilité

- Contraste minimum WCAG AA respecté
- Focus visible sur tous les éléments interactifs
- Support clavier complet
- Textes alternatifs sur les icônes

## 🐛 Troubleshooting

### Le flou ne fonctionne pas
- Vérifiez le support de `backdrop-filter` dans votre navigateur
- Ajoutez le préfixe `-webkit-backdrop-filter` pour Safari

### Les cartes ne s'affichent pas correctement
- Vérifiez que le CSS est bien importé dans App.jsx
- Assurez-vous que Tailwind CSS est configuré

### Les animations sont saccadées
- Réduisez le nombre d'éléments animés simultanément
- Utilisez `will-change` avec parcimonie

## 📚 Ressources

- [Glassmorphism Generator](https://glassmorphism.com/)
- [Bento Grid Examples](https://bentogrids.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🎯 Roadmap

- [ ] Mode sombre
- [ ] Thèmes personnalisables
- [ ] Plus de variantes de composants
- [ ] Storybook pour la documentation
- [ ] Tests visuels automatisés

---

**Créé avec ❤️ pour UniPath**
*Version 1.0.0 - Mai 2026*
