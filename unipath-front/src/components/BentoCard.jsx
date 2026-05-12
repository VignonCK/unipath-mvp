// src/components/BentoCard.jsx
import { useState } from 'react';

/**
 * Composant BentoCard - Carte glassmorphism avec effet magnetic hover
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {string} variant - 'glass' | 'solid' | 'gradient'
 * @param {boolean} glow - Active l'effet de lueur
 * @param {boolean} magnetic - Active l'effet magnetic hover
 * @param {string} className - Classes additionnelles
 */
export default function BentoCard({ 
  children, 
  size = 'md', 
  variant = 'glass',
  glow = false,
  magnetic = false,
  onClick,
  className = '' 
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!magnetic) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'col-span-1 row-span-1 min-h-[180px]',
    md: 'col-span-1 md:col-span-2 row-span-1 min-h-[220px]',
    lg: 'col-span-1 md:col-span-2 row-span-2 min-h-[320px]',
    xl: 'col-span-1 md:col-span-3 row-span-2 min-h-[400px]',
    full: 'col-span-full row-span-1 min-h-[200px]',
  };

  const variantClasses = {
    glass: `
      bg-white/40 dark:bg-gray-900/40 
      backdrop-blur-xl 
      border border-white/20 dark:border-gray-700/30
      shadow-glass
    `,
    solid: `
      bg-white dark:bg-gray-900 
      border border-gray-200 dark:border-gray-800
      shadow-lg
    `,
    gradient: `
      bg-gradient-to-br from-academic-600 to-academic-800
      border border-academic-500/20
      shadow-glow
      text-white
    `,
  };

  const glowClass = glow ? 'before:absolute before:inset-0 before:rounded-3xl before:bg-glow-radial before:from-accent-500/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:-z-10' : '';

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${glowClass}
        relative overflow-hidden rounded-3xl p-6 md:p-8
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${magnetic ? 'hover:scale-[1.02]' : 'hover:scale-[1.01]'}
        group
        ${className}
      `}
      style={{
        transform: magnetic && isHovered 
          ? `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
          : 'translate(0, 0)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Grain texture overlay */}
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
