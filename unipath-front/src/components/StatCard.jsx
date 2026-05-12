// src/components/StatCard.jsx

/**
 * Composant StatCard - Carte de statistique avec animation
 * Affiche une valeur numérique avec label et icône optionnelle
 */
export default function StatCard({ 
  label, 
  value, 
  icon, 
  trend,
  color = 'blue',
  onClick 
}) {
  const colorClasses = {
    blue: 'from-academic-500 to-academic-700 text-white',
    green: 'from-green-500 to-green-700 text-white',
    orange: 'from-accent-500 to-accent-700 text-white',
    red: 'from-red-500 to-red-700 text-white',
    purple: 'from-purple-500 to-purple-700 text-white',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${colorClasses[color]}
        shadow-glass hover:shadow-glow
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        group
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {icon && (
          <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
        
        <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
          {value}
        </div>
        
        <div className="text-sm opacity-90 font-medium">
          {label}
        </div>

        {trend && (
          <div className={`
            mt-3 text-xs font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-full
            ${trend > 0 ? 'bg-white/20' : 'bg-black/20'}
          `}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
      </div>
    </div>
  );
}
