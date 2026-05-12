// src/pages/AccueilCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';
import BentoGrid from '../components/BentoGrid';
import BentoCard from '../components/BentoCard';
import StatCard from '../components/StatCard';

function salutation() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function joursRestants(dateFin) {
  const diff = new Date(dateFin) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AccueilCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([candidatService.getProfil(), concoursService.getAll()])
      .then(([p, c]) => {
        setCandidат(p);
        setConcours(c);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  // Calculs
  const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
  const nbPieces = pieces.filter(p => candidat?.dossier?.[p]).length;
  const pct = Math.round((nbPieces / pieces.length) * 100);
  const nbInscriptions = candidat?.inscriptions?.length || 0;
  const nbValides = candidat?.inscriptions?.filter(i => i.statut === 'VALIDE').length || 0;
  const nbRejetes = candidat?.inscriptions?.filter(i => i.statut === 'REJETE').length || 0;
  const profilOk = ['telephone', 'dateNaiss', 'lieuNaiss'].every(c => candidat?.[c]);

  // Concours avec clôture proche (< 7 jours) et non inscrit
  const urgents = concours.filter(c => {
    const jours = joursRestants(c.dateFin);
    const inscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
    return jours > 0 && jours <= 7 && !inscrit;
  });

  // Notifications
  const notifications = [];
  if (!profilOk) {
    notifications.push({ type: 'warning', msg: 'Votre profil est incomplet. Renseignez vos informations pour vous inscrire.' });
  }
  candidat?.inscriptions?.forEach(ins => {
    if (ins.statut === 'VALIDE') {
      notifications.push({ type: 'success', msg: `Votre dossier pour "${ins.concours?.libelle}" a été validé. Téléchargez votre convocation.` });
    }
    if (ins.statut === 'REJETE') {
      notifications.push({ type: 'error', msg: `Votre dossier pour "${ins.concours?.libelle}" a été rejeté.` });
    }
  });
  if (pct > 0 && pct < 100) {
    notifications.push({ type: 'info', msg: `Votre dossier est complété à ${pct}%. Déposez les pièces manquantes.` });
  }

  const notifColors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      {/* Background avec effet de profondeur */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20 dark:from-gray-950 dark:via-academic-950 dark:to-gray-900" />
      
      <div className='max-w-7xl mx-auto space-y-8 animate-slide-up'>

        {/* Hero Section - Message de bienvenue avec glassmorphism */}
        <BentoCard size="full" variant="gradient" glow className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-academic-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <p className='text-accent-200 text-sm font-medium mb-2 tracking-wide uppercase'>{salutation()}</p>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight'>
                {candidat?.prenom} <span className="text-accent-300">{candidat?.nom}</span>
              </h1>
              <p className='text-academic-100 text-base md:text-lg mb-4 font-light'>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className='inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20'>
                <svg className="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <span className='text-sm text-white font-mono font-semibold tracking-wider'>{candidat?.matricule}</span>
              </div>
            </div>

            {/* Photo de profil avec effet glow */}
            {photoUrl && (
              <div className="relative group">
                <div className="absolute inset-0 bg-accent-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <img 
                  src={photoUrl} 
                  alt="Profil" 
                  className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white/30 shadow-2xl"
                />
              </div>
            )}
          </div>
        </BentoCard>

        {/* Bento Grid - KPIs et Stats */}
        <BentoGrid>
          {/* Stat Cards avec couleurs dynamiques */}
          <div className="col-span-1 md:col-span-2">
            <StatCard
              label="Inscriptions"
              value={nbInscriptions}
              color="blue"
              onClick={() => navigate('/mon-compte')}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <StatCard
              label="Dossiers validés"
              value={nbValides}
              color="green"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <StatCard
              label="Dossiers rejetés"
              value={nbRejetes}
              color="red"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Progression du dossier - Large card */}
          <BentoCard size="lg" variant="glass" magnetic glow>
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    Progression du dossier
                  </h3>
                  <div className={`
                    text-4xl font-black
                    ${pct === 100 ? 'text-green-500' : pct >= 50 ? 'text-accent-500' : 'text-gray-400'}
                  `}>
                    {pct}%
                  </div>
                </div>

                {/* Progress bar avec effet glow */}
                <div className="relative h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
                  <div 
                    className={`
                      absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out
                      ${pct === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-accent-500 to-accent-600'}
                    `}
                    style={{ width: `${pct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </div>
                </div>

                {/* Liste des pièces */}
                <div className="space-y-3">
                  {[
                    { key: 'acteNaissance', label: 'Acte de naissance', icon: '📄' },
                    { key: 'carteIdentite', label: 'Carte d\'identité', icon: '🪪' },
                    { key: 'photo', label: 'Photo d\'identité', icon: '📸' },
                    { key: 'releve', label: 'Relevé de notes', icon: '📊' },
                  ].map(({ key, label, icon }) => {
                    const isComplete = candidat?.dossier?.[key];
                    return (
                      <div key={key} className="flex items-center gap-3 group">
                        <div className={`
                          w-8 h-8 rounded-xl flex items-center justify-center text-sm
                          transition-all duration-300
                          ${isComplete 
                            ? 'bg-green-500 text-white scale-100' 
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 scale-95'
                          }
                        `}>
                          {isComplete ? '✓' : icon}
                        </div>
                        <span className={`
                          text-sm font-medium transition-colors
                          ${isComplete ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                        `}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {pct < 100 && (
                <button
                  onClick={() => navigate('/mon-compte')}
                  className="mt-6 w-full bg-gradient-to-r from-accent-500 to-accent-600 text-white py-4 rounded-2xl font-bold hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
                >
                  Compléter mon dossier →
                </button>
              )}
            </div>
          </BentoCard>

          {/* Concours urgents */}
          {urgents.length > 0 && (
            <BentoCard size="md" variant="glass" className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 animate-glow-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-700 dark:text-red-400">
                    Clôture imminente
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                    {urgents.length} concours {urgents.length > 1 ? 'se terminent' : 'se termine'} bientôt
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {urgents.slice(0, 2).map(c => {
                  const jours = joursRestants(c.dateFin);
                  return (
                    <div key={c.id} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-4 border border-red-200 dark:border-red-900/30">
                      <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">{c.libelle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {jours === 1 ? '⚠️ Dernier jour !' : `⏰ ${jours} jours restants`}
                        </span>
                        <button
                          onClick={() => navigate('/concours')}
                          className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl hover:shadow-glow transition-all font-bold"
                        >
                          S'inscrire
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}
        </BentoGrid>

        {/* Notifications avec glassmorphism */}
        {notifications.length > 0 && (
          <BentoCard size="full" variant="glass">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
              Notifications
            </h2>
            <div className="space-y-3">
              {notifications.map((n, i) => {
                const icons = {
                  success: '✅',
                  error: '❌',
                  warning: '⚠️',
                  info: 'ℹ️',
                };
                const colors = {
                  success: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-700 dark:text-green-400',
                  error: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-700 dark:text-red-400',
                  warning: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-700 dark:text-orange-400',
                  info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-700 dark:text-blue-400',
                };
                return (
                  <div 
                    key={i} 
                    className={`
                      bg-gradient-to-r ${colors[n.type]}
                      backdrop-blur-sm border rounded-2xl p-4
                      flex items-start gap-3
                      animate-slide-down
                    `}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="text-2xl flex-shrink-0">{icons[n.type]}</span>
                    <p className="text-sm font-medium leading-relaxed">{n.msg}</p>
                  </div>
                );
              })}
            </div>
          </BentoCard>
        )}

        {/* Accès rapide - Bento Grid */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
            Accès rapide
          </h2>
          <BentoGrid>
            {[
              { 
                label: 'Voir les concours', 
                path: '/concours', 
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                gradient: 'from-academic-600 to-academic-800',
                size: 'md'
              },
              { 
                label: 'Ma carte candidat', 
                path: '/ma-carte', 
                icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
                gradient: 'from-green-600 to-green-800',
                size: 'md'
              },
              { 
                label: 'Déposer des pièces', 
                path: '/mon-compte', 
                icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
                gradient: 'from-accent-600 to-accent-800',
                size: 'md'
              },
              { 
                label: 'Mon dossier', 
                path: '/mon-compte', 
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                gradient: 'from-purple-600 to-purple-800',
                size: 'md'
              },
            ].map(({ label, path, icon, gradient, size }) => (
              <BentoCard
                key={label}
                size={size}
                variant="glass"
                magnetic
                onClick={() => navigate(path)}
                className={`bg-gradient-to-br ${gradient} text-white cursor-pointer`}
              >
                <div className="flex flex-col h-full justify-between">
                  <svg className="w-10 h-10 mb-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold">{label}</h3>
                    <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                      Accéder <span>→</span>
                    </div>
                  </div>
                </div>
              </BentoCard>
            ))}
          </BentoGrid>
        </div>

        {/* Mes inscriptions récentes */}
        {nbInscriptions > 0 && (
          <BentoCard size="full" variant="glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                Mes inscriptions récentes
              </h2>
              <button 
                onClick={() => navigate('/mon-compte')} 
                className="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-bold flex items-center gap-2 group"
              >
                Voir tout 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidat.inscriptions.slice(0, 3).map(ins => {
                const statusConfig = {
                  VALIDE: {
                    bg: 'from-green-500/20 to-green-600/20',
                    border: 'border-green-500/30',
                    text: 'text-green-700 dark:text-green-400',
                    icon: '✓',
                    label: 'Validé'
                  },
                  REJETE: {
                    bg: 'from-red-500/20 to-red-600/20',
                    border: 'border-red-500/30',
                    text: 'text-red-700 dark:text-red-400',
                    icon: '✗',
                    label: 'Rejeté'
                  },
                  EN_ATTENTE: {
                    bg: 'from-yellow-500/20 to-yellow-600/20',
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-700 dark:text-yellow-400',
                    icon: '⏳',
                    label: 'En attente'
                  },
                };
                const config = statusConfig[ins.statut];
                
                return (
                  <div 
                    key={ins.id} 
                    className={`
                      bg-gradient-to-br ${config.bg}
                      backdrop-blur-sm border ${config.border}
                      rounded-2xl p-5
                      hover:scale-[1.02] transition-transform duration-300
                      cursor-pointer
                    `}
                    onClick={() => navigate(`/inscription/${ins.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`
                        w-10 h-10 rounded-xl ${config.bg} border ${config.border}
                        flex items-center justify-center text-xl
                      `}>
                        {config.icon}
                      </div>
                      <span className={`
                        text-xs px-3 py-1 rounded-full font-bold
                        ${config.bg} border ${config.border} ${config.text}
                      `}>
                        {config.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                      {ins.concours?.libelle}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(ins.dateInscription).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                );
              })}
            </div>
          </BentoCard>
        )}

      </div>
    </CandidatLayout>
  );
}
