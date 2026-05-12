// src/pages/DesignSystemDemo.jsx
// Page de démonstration du système de design Academic Bento-Glass
import AcademicLayout, { 
  BentoCard, 
  BentoGrid, 
  GlassBadge,
  AcademicButton,
  ProgressBar,
  StatCard 
} from '../components/AcademicLayout';

export default function DesignSystemDemo() {
  return (
    <AcademicLayout 
      title="Design System Demo" 
      subtitle="Academic Bento-Glass Ultra-Premium"
      showBackButton={true}
    >
      <div className='space-y-8 animate-slide-in'>
        
        {/* Section 1: Statistiques */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>📊 Cartes de Statistiques</h2>
          <BentoGrid>
            <StatCard
              icon={
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                </svg>
              }
              label="Total Candidats"
              value="1,234"
              trend={12}
            />
            <StatCard
              icon={
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              }
              label="Dossiers Validés"
              value="856"
              trend={8}
            />
            <StatCard
              icon={
                <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              }
              label="En Attente"
              value="378"
              trend={-5}
            />
          </BentoGrid>
        </section>

        {/* Section 2: Badges */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>🏷️ Badges avec Effet Glass</h2>
          <BentoCard>
            <div className='flex flex-wrap gap-3'>
              <GlassBadge variant="success">
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Validé
              </GlassBadge>
              <GlassBadge variant="warning">
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                En attente
              </GlassBadge>
              <GlassBadge variant="error">
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                Rejeté
              </GlassBadge>
              <GlassBadge variant="info">
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Sous réserve
              </GlassBadge>
              <GlassBadge variant="default">
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                </svg>
                Par défaut
              </GlassBadge>
            </div>
          </BentoCard>
        </section>

        {/* Section 3: Boutons */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>🔘 Boutons Académiques</h2>
          <BentoCard>
            <div className='flex flex-wrap gap-4'>
              <AcademicButton variant="primary">
                <svg className='w-5 h-5 inline mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Bouton Principal
              </AcademicButton>
              <AcademicButton variant="glass">
                <svg className='w-5 h-5 inline mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                Bouton Glass
              </AcademicButton>
              <AcademicButton variant="outline">
                <svg className='w-5 h-5 inline mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                Bouton Outline
              </AcademicButton>
            </div>
          </BentoCard>
        </section>

        {/* Section 4: Barres de progression */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>📈 Barres de Progression</h2>
          <BentoGrid columns="2">
            <BentoCard>
              <h3 className='font-semibold mb-4'>Dossier complété</h3>
              <ProgressBar value={85} max={100} showLabel={true} />
            </BentoCard>
            <BentoCard>
              <h3 className='font-semibold mb-4'>Pièces déposées</h3>
              <ProgressBar value={60} max={100} showLabel={true} />
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Section 5: Cartes Bento variées */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>🎴 Cartes Bento</h2>
          <BentoGrid>
            <BentoCard className='col-span-2'>
              <div className='flex items-start gap-4'>
                <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-orange-500 flex items-center justify-center flex-shrink-0'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h3 className='text-xl font-bold mb-2'>Concours EPAC 2026</h3>
                  <p className='text-gray-600 text-sm mb-4'>
                    École Polytechnique d'Abomey-Calavi - Session de printemps
                  </p>
                  <div className='flex items-center gap-3'>
                    <GlassBadge variant="success">Inscrit</GlassBadge>
                    <span className='text-sm text-gray-500'>Date limite : 30 juin 2026</span>
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard>
              <div className='text-center'>
                <div className='w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3'>
                  <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <p className='text-3xl font-black text-green-600 mb-1'>100%</p>
                <p className='text-sm text-gray-600'>Dossier complet</p>
              </div>
            </BentoCard>

            <BentoCard>
              <div className='text-center'>
                <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3'>
                  <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <p className='text-3xl font-black text-blue-600 mb-1'>5/5</p>
                <p className='text-sm text-gray-600'>Pièces déposées</p>
              </div>
            </BentoCard>

            <BentoCard>
              <div className='text-center'>
                <div className='w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3'>
                  <svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <p className='text-3xl font-black text-orange-600 mb-1'>3</p>
                <p className='text-sm text-gray-600'>Jours restants</p>
              </div>
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Section 6: Effets spéciaux */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>✨ Effets Spéciaux</h2>
          <BentoGrid columns="2">
            <BentoCard className='depth-card'>
              <h3 className='font-bold mb-2'>Carte avec Profondeur</h3>
              <p className='text-sm text-gray-600'>
                Cette carte utilise des ombres multiples pour créer un effet de profondeur 3D.
              </p>
            </BentoCard>
            <BentoCard className='glass-card-intense'>
              <h3 className='font-bold mb-2'>Glass Intense</h3>
              <p className='text-sm text-gray-600'>
                Effet de verre plus prononcé avec un flou d'arrière-plan de 30px.
              </p>
            </BentoCard>
          </BentoGrid>
        </section>

        {/* Section 7: Formulaires */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>📝 Formulaires</h2>
          <BentoCard>
            <form className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom complet
                </label>
                <input
                  type='text'
                  placeholder='Jean Dupont'
                  className='input-glass w-full'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email
                </label>
                <input
                  type='email'
                  placeholder='jean.dupont@example.com'
                  className='input-glass w-full'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder='Votre message...'
                  className='input-glass w-full resize-none'
                />
              </div>
              <div className='flex gap-3'>
                <AcademicButton variant='primary' type='submit'>
                  Envoyer
                </AcademicButton>
                <AcademicButton variant='glass' type='button'>
                  Annuler
                </AcademicButton>
              </div>
            </form>
          </BentoCard>
        </section>

        {/* Section 8: Dividers */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>➖ Séparateurs</h2>
          <BentoCard>
            <p className='text-gray-600'>Contenu avant le séparateur</p>
            <div className='academic-divider' />
            <p className='text-gray-600'>Contenu après le séparateur</p>
          </BentoCard>
        </section>

        {/* Section 9: Texte avec gradient */}
        <section>
          <h2 className='text-2xl font-black gradient-text mb-6'>🌈 Texte avec Gradient</h2>
          <BentoCard className='text-center'>
            <h1 className='text-6xl font-black gradient-text mb-4'>
              UniPath
            </h1>
            <p className='text-xl gradient-text font-bold'>
              Plateforme Nationale de Gestion des Concours
            </p>
          </BentoCard>
        </section>

      </div>
    </AcademicLayout>
  );
}
