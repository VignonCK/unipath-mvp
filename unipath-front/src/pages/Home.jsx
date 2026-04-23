// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/examen-eleves.jpg';

export default function Home() {
  const navigate = useNavigate();

  const fonctionnalites = [
    {
      icon: '🎓',
      titre: 'Inscription numérique',
      desc: 'Les bacheliers s\'inscrivent en ligne aux concours universitaires. Fini les déplacements physiques et les formulaires papier.',
    },
    {
      icon: '📁',
      titre: 'Gestion des dossiers',
      desc: 'Upload sécurisé des pièces justificatives. La commission étudie et valide les dossiers depuis son espace dédié.',
    },
    {
      icon: '📊',
      titre: 'Statistiques en temps réel',
      desc: 'La DGES dispose d\'un tableau de bord national avec graphiques et taux de validation calculés automatiquement.',
    },
  ];

  const espaces = [
    {
      role: 'Candidat',
      icon: '👤',
      couleur: 'bg-blue-50 border-blue-200',
      couleurBadge: 'bg-blue-700',
      actions: [
        'Créer un compte et recevoir son matricule national',
        'S\'inscrire à un ou plusieurs concours',
        'Uploader ses pièces justificatives',
        'Consulter son statut et télécharger sa convocation PDF',
      ],
      lien: '/register',
      labelBtn: 'Créer un compte',
    },
    {
      role: 'Commission',
      icon: '✅',
      couleur: 'bg-teal-50 border-teal-200',
      couleurBadge: 'bg-teal-700',
      actions: [
        'Consulter la liste des dossiers soumis',
        'Visualiser les pièces justificatives de chaque candidat',
        'Valider ou rejeter les dossiers',
        'Déclencher l\'envoi automatique de notifications email',
      ],
      lien: '/commission',
      labelBtn: 'Accès commission',
    },
    {
      role: 'DGES',
      icon: '🏛️',
      couleur: 'bg-purple-50 border-purple-200',
      couleurBadge: 'bg-purple-700',
      actions: [
        'Tableau de bord national en temps réel',
        'Statistiques par concours (inscrits, validés, rejetés)',
        'Taux de validation calculé automatiquement via vue SQL',
        'Graphiques interactifs de suivi',
      ],
      lien: '/dges',
      labelBtn: 'Tableau de bord',
    },
  ];

  const chiffres = [
    { valeur: '4', label: 'Tables PostgreSQL' },
    { valeur: '2', label: 'Triggers SQL' },
    { valeur: '1', label: 'Vue statistique' },
    { valeur: '14', label: 'Routes API REST' },
    { valeur: '3', label: 'Rôles utilisateurs' },
    { valeur: '5', label: 'Pièces gérées' },
  ];

  const stack = [
    { nom: 'React + Vite', desc: 'Interface utilisateur' },
    { nom: 'Tailwind CSS', desc: 'Design responsive' },
    { nom: 'Node.js + Express', desc: 'API REST backend' },
    { nom: 'PHP + FPDF', desc: 'Génération PDF' },
    { nom: 'PostgreSQL', desc: 'Base de données' },
    { nom: 'Supabase', desc: 'Auth + Storage' },
    { nom: 'Prisma ORM', desc: 'Gestion des données' },
    { nom: 'Resend', desc: 'Notifications email' },
  ];

  const equipe = [
    { nom: 'KANLINHANON Vignon', role: 'DB Architect', taches: 'PostgreSQL · Prisma · Triggers · Vues SQL' },
    { nom: 'DEDJI Harry', role: 'Backend / API', taches: 'Node.js · Express · Auth · PHP · Email' },
    { nom: 'ELEGBE Adébayo', role: 'Frontend', taches: 'React · Tailwind · Dashboard · Responsive' },
  ];

  return (
    <div className='min-h-screen bg-white'>

      {/* NAVBAR */}
      <nav className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-sm'>Plateforme universitaire numérique</span>
        </div>
        <div className='flex gap-3'>
          <button onClick={() => navigate('/login')} className='text-sm border border-blue-400 px-4 py-2 rounded-lg hover:bg-blue-800 transition'>
            Se connecter
          </button>
          <button onClick={() => navigate('/register')} className='text-sm bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition'>
            Créer un compte
          </button>
        </div>
      </nav>

      {/* HERO avec image de fond */}
      <section className='relative text-white px-6' style={{minHeight: '550px', paddingTop: '8rem', paddingBottom: '8rem'}}>
        {/* Image de fond */}
        <img
          src={bgImage}
          alt='background'
          className='absolute inset-0 w-full h-full object-cover'
        />
        {/* Overlay sombre */}
        <div className='absolute inset-0' style={{backgroundColor: 'rgba(30, 58, 138, 0.6)'}} />

        {/* Contenu */}
        <div className='relative max-w-4xl mx-auto text-center'>
            
          <h1 className='text-4xl md:text-6xl font-black mb-6 leading-tight'>
            Gérez votre parcours
            <span className='text-teal-300'> universitaire</span>
            <br />en toute simplicité
          </h1>
          <p className='text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-10'>
            UniPath digitalise les inscriptions aux concours universitaires.
            De la candidature à la convocation, tout se fait en ligne.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button onClick={() => navigate('/register')} className='bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg'>
              Créer mon compte →
            </button>
            <button onClick={() => navigate('/login')} className='border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition'>
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Ce que fait UniPath</h2>
          <p className='text-center text-gray-500 mb-12'>Trois fonctionnalités au cœur du Module 1</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {fonctionnalites.map((f) => (
              <div key={f.titre} className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition'>
                <div className='text-5xl mb-4'>{f.icon}</div>
                <h3 className='text-xl font-bold text-blue-900 mb-3'>{f.titre}</h3>
                <p className='text-gray-600 leading-relaxed'>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESPACES */}
      <section className='py-16 px-6 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Trois espaces dédiés</h2>
          <p className='text-center text-gray-500 mb-12'>Chaque acteur dispose de son propre tableau de bord</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {espaces.map((e) => (
              <div key={e.role} className={`rounded-2xl p-8 border-2 ${e.couleur}`}>
                <div className='text-4xl mb-3'>{e.icon}</div>
                <h3 className='text-xl font-black text-blue-900 mb-4'>{e.role}</h3>
                <ul className='space-y-2 mb-6'>
                  {e.actions.map((a, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                      <span className='text-green-500 mt-0.5 flex-shrink-0'>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(e.lien)} className={`w-full ${e.couleurBadge} text-white py-3 rounded-xl font-bold hover:opacity-90 transition text-sm`}>
                  {e.labelBtn} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHIFFRES */}
      <section className='py-16 px-6 bg-blue-900 text-white'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center mb-4'>UniPath en chiffres</h2>
          <p className='text-center text-blue-300 mb-12'>L'architecture technique du projet</p>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-6'>
            {chiffres.map((c) => (
              <div key={c.label} className='bg-blue-800 rounded-2xl p-6 text-center'>
                <div className='text-5xl font-black text-teal-300 mb-2'>{c.valeur}</div>
                <div className='text-blue-200 text-sm font-medium'>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Stack technologique</h2>
          <p className='text-center text-gray-500 mb-12'>Technologies modernes choisies pour leur robustesse</p>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {stack.map((s) => (
              <div key={s.nom} className='bg-white rounded-xl p-5 border border-gray-200 shadow-sm'>
                <p className='font-bold text-blue-900 text-sm'>{s.nom}</p>
                <p className='text-gray-500 text-xs mt-0.5'>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉQUIPE */}
      <section className='py-16 px-6 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Notre équipe</h2>
          <p className='text-center text-gray-500 mb-12'>Groupe 2 — Département Génie Informatique et Télécommunications</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {equipe.map((m) => (
              <div key={m.nom} className='text-center'>
                <div className='w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-4'>👨‍💻</div>
                <h3 className='font-bold text-blue-900'>{m.nom}</h3>
                <p className='text-teal-600 font-medium text-sm mt-1'>{m.role}</p>
                <p className='text-gray-500 text-xs mt-2'>{m.taches}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10 text-gray-500 text-sm'>
            <p>Sous la supervision du <strong>Professeur DJARA Tahirou</strong></p>
            <p>Sous l'encadrement du <strong>Dr ASSOUMA Abdoul Kamal</strong></p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='bg-blue-900 text-white py-10 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-2xl font-black mb-2'>UniPath</p>
          <p className='text-blue-300 text-sm mb-4'>Plateforme numérique de gestion du parcours universitaire</p>
          <div className='border-t border-blue-800 pt-6 mt-6'>
            <p className='text-blue-400 text-xs'>
              EPAC — École Polytechnique d'Abomey-Calavi · Université d'Abomey-Calavi<br />
              Groupe 2 · Année académique 2025–2026 · Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}