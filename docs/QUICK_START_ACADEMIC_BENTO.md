# 🚀 Quick Start - Academic Bento-Glass

## En 3 étapes simples

### 1️⃣ Voir la démo
```bash
cd unipath-front
npm run dev
```
Puis ouvre : **http://localhost:5173/design-demo**

### 2️⃣ Importer les composants
```jsx
import AcademicLayout, { 
  BentoCard, 
  BentoGrid, 
  GlassBadge,
  AcademicButton,
  ProgressBar,
  StatCard 
} from '../components/AcademicLayout';
```

### 3️⃣ Utiliser dans ta page
```jsx
export default function MaPage() {
  return (
    <AcademicLayout title="Ma Page" subtitle="Description">
      <BentoGrid>
        <BentoCard>
          <h3>Carte 1</h3>
          <p>Contenu...</p>
        </BentoCard>
        <BentoCard>
          <h3>Carte 2</h3>
          <p>Contenu...</p>
        </BentoCard>
      </BentoGrid>
    </AcademicLayout>
  );
}
```

## 📦 Composants les plus utilisés

### BentoCard - Carte avec effet glass
```jsx
<BentoCard>
  Ton contenu ici
</BentoCard>
```

### BentoGrid - Grille responsive
```jsx
<BentoGrid>
  <BentoCard>Carte 1</BentoCard>
  <BentoCard>Carte 2</BentoCard>
  <BentoCard>Carte 3</BentoCard>
</BentoGrid>
```

### GlassBadge - Badge stylisé
```jsx
<GlassBadge variant="success">Validé</GlassBadge>
<GlassBadge variant="warning">En attente</GlassBadge>
<GlassBadge variant="error">Rejeté</GlassBadge>
```

### AcademicButton - Bouton premium
```jsx
<AcademicButton variant="primary">
  Valider
</AcademicButton>
```

### ProgressBar - Barre de progression
```jsx
<ProgressBar value={75} max={100} showLabel={true} />
```

### StatCard - Carte de statistique
```jsx
<StatCard
  icon={<svg>...</svg>}
  label="Total candidats"
  value="1,234"
  trend={12}
/>
```

## 🎨 Classes CSS utiles

```css
.glass-card          /* Carte avec effet de verre */
.glass-card-intense  /* Effet de verre plus prononcé */
.depth-card          /* Carte avec ombres profondes */
.gradient-text       /* Texte avec dégradé */
.academic-divider    /* Séparateur élégant */
.input-glass         /* Input avec effet de verre */
.animate-slide-in    /* Animation d'entrée */
```

## 💡 Exemple complet

```jsx
import AcademicLayout, { 
  BentoCard, 
  BentoGrid, 
  GlassBadge,
  StatCard,
  ProgressBar 
} from '../components/AcademicLayout';

export default function Dashboard() {
  return (
    <AcademicLayout 
      title="Tableau de bord" 
      subtitle="Espace candidat"
      showBackButton={false}
    >
      {/* Statistiques */}
      <BentoGrid>
        <StatCard
          icon={<svg>...</svg>}
          label="Inscriptions"
          value="3"
          trend={50}
        />
        <StatCard
          icon={<svg>...</svg>}
          label="Validés"
          value="2"
          trend={100}
        />
      </BentoGrid>

      {/* Progression */}
      <BentoCard className="mt-6">
        <h2 className="text-xl font-bold mb-4">
          Complétion du dossier
        </h2>
        <ProgressBar value={85} max={100} />
      </BentoCard>

      {/* Liste */}
      <BentoCard className="mt-6">
        <h2 className="text-xl font-bold mb-4">
          Mes concours
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Concours EPAC</span>
            <GlassBadge variant="success">
              Validé
            </GlassBadge>
          </div>
        </div>
      </BentoCard>
    </AcademicLayout>
  );
}
```

## 🎯 Résultat

Tu obtiens une interface :
- ✨ Ultra-premium avec effets de verre
- 📱 Responsive automatiquement
- 🎨 Cohérente visuellement
- ⚡ Performante et fluide

## 📚 Documentation complète

- [Guide complet](./ACADEMIC_BENTO_GLASS_DESIGN_SYSTEM.md)
- [Implémentation](./IMPLEMENTATION_ACADEMIC_BENTO_GLASS.md)
- [Démo live](http://localhost:5173/design-demo)

---

**C'est tout !** Commence par la démo et explore les composants 🚀
