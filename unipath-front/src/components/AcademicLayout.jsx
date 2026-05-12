// src/components/AcademicLayout.jsx
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function AcademicLayout({ children, title, subtitle, showBackButton = false, headerGradient = 'blue' }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const gradients = {
    blue: 'from-blue-900 to-blue-700',
    slate: 'from-slate-700 to-slate-600',
    orange: 'from-orange-600 to-orange-500',
    purple: 'from-purple-700 to-purple-600',
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen academic-bg custom-scrollbar'>
      {/* Header avec effet glass */}
      <header className={`glass-card-intense sticky top-0 z-50 mb-6`}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              {showBackButton && (
                <button
                  onClick={() => navigate(-1)}
                  className='p-2 rounded-xl hover:bg-white/50 transition-all duration-300'
                  title='Retour'
                >
                  <svg className='w-5 h-5 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                  </svg>
                </button>
              )}
              
              {/* Logo */}
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-orange-500 flex items-center justify-center shadow-lg'>
                  <span className='text-white font-black text-lg'>U</span>
                </div>
                <div>
                  <h1 className='text-xl font-black gradient-text'>{title || 'UniPath'}</h1>
                  {subtitle && <p className='text-xs text-gray-600'>{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* User menu */}
            {user && (
              <div className='flex items-center gap-3'>
                <div className='hidden sm:block text-right'>
                  <p className='text-sm font-semibold text-gray-800'>{user.prenom || user.email}</p>
                  <p className='text-xs text-gray-500'>{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className='p-2 rounded-xl hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-300'
                  title='Déconnexion'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 pb-12'>
        {children}
      </main>

      {/* Footer avec effet glass */}
      <footer className='glass-card mt-12 mx-4 sm:mx-6 mb-6 max-w-7xl mx-auto'>
        <div className='px-6 py-4 text-center'>
          <p className='text-sm text-gray-600'>
            © 2026 UniPath - Plateforme Nationale de Gestion des Concours Universitaires
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            Ministère de l'Enseignement Supérieur et de la Recherche Scientifique - Bénin
          </p>
        </div>
      </footer>
    </div>
  );
}

// Composant pour les cartes Bento
export function BentoCard({ children, className = '', hover = true, ...props }) {
  return (
    <div 
      className={`glass-card p-6 ${hover ? 'hover:shadow-2xl' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Composant pour les grilles Bento
export function BentoGrid({ children, columns = 'auto-fit', className = '' }) {
  const gridClass = columns === 'auto-fit' 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
    : `grid-cols-${columns}`;
  
  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Composant pour les badges avec effet glass
export function GlassBadge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-blue-500/20 text-blue-700 border-blue-300/30',
    success: 'bg-green-500/20 text-green-700 border-green-300/30',
    warning: 'bg-orange-500/20 text-orange-700 border-orange-300/30',
    error: 'bg-red-500/20 text-red-700 border-red-300/30',
    info: 'bg-slate-500/20 text-slate-700 border-slate-300/30',
  };

  return (
    <span className={`badge-glass ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Composant pour les boutons académiques
export function AcademicButton({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'btn-academic',
    glass: 'btn-glass',
    outline: 'border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white',
  };

  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Composant pour les barres de progression
export function ProgressBar({ value, max = 100, className = '', showLabel = true }) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-700'>Progression</span>
          <span className='text-sm font-bold text-orange-600'>{percentage}%</span>
        </div>
      )}
      <div className='progress-glass'>
        <div 
          className='progress-fill' 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Composant pour les statistiques
export function StatCard({ icon, label, value, trend, className = '' }) {
  return (
    <BentoCard className={`text-center ${className}`}>
      <div className='flex flex-col items-center gap-3'>
        {icon && (
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900 to-orange-500 flex items-center justify-center shadow-lg'>
            {icon}
          </div>
        )}
        <div>
          <p className='text-3xl font-black gradient-text'>{value}</p>
          <p className='text-sm text-gray-600 mt-1'>{label}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
