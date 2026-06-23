// src/components/BentoGrid.jsx

/**
 * Composant BentoGrid - Grille responsive pour layout Bento
 * Utilise CSS Grid avec auto-fit et minmax pour une disposition fluide
 */
export default function BentoGrid({ children, className = '' }) {
  return (
    <div 
      className={`
        grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6
        auto-rows-auto
        gap-4 md:gap-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
