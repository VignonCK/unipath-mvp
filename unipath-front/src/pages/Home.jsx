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
      couleur: 'bg-amber-50 border-amber-200',
      couleurBadge: 'bg-amber-600',
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
      couleur: 'bg-blue-50 border-blue-300',
      couleurBadge: 'bg-blue-800',
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

  const etapes = [
    {
      numero: '01',
      titre: 'Créez votre compte',
      desc: 'Inscrivez-vous en quelques minutes. Vous recevez immédiatement votre matricule national unique.',
      icon: '📝',
    },
    {
      numero: '02',
      titre: 'Choisissez vos concours',
      desc: 'Consultez les concours disponibles et inscrivez-vous. Le système vérifie automatiquement les conflits de dates.',
      icon: '🎯',
    },
    {
      numero: '03',
      titre: 'Déposez vos pièces',
      desc: 'Uploadez vos documents depuis chez vous : acte de naissance, carte d\'identité, relevé de notes et quittance.',
      icon: '📎',
    },
    {
      numero: '04',
      titre: 'Recevez votre convocation',
      desc: 'Après validation de votre dossier par la commission, recevez votre convocation PDF par email.',
      icon: '📬',
    },
  ];

  const avantages = [
    {
      icon: '⚡',
      titre: 'Gain de temps',
      desc: 'Plus besoin de se déplacer au campus. Tout se fait en ligne depuis votre téléphone ou ordinateur, 24h/24.',
    },
    {
      icon: '🔒',
      titre: 'Sécurisé',
      desc: 'Vos données personnelles sont protégées. L\'accès est sécurisé par authentification JWT et chiffrement.',
    },
    {
      icon: '📡',
      titre: 'Suivi en temps réel',
      desc: 'Consultez l\'état de votre dossier à tout moment. Soyez notifié par email dès qu\'une décision est prise.',
    },
    {
      icon: '📄',
      titre: 'Convocation instantanée',
      desc: 'Votre convocation PDF est générée automatiquement et disponible au téléchargement dès validation.',
    },
  ];

  const equipe = [
    { nom: 'KANLINHANON Vignon', photo: null },
    { nom: 'DEDJI Harry', photo: null },
    { nom: 'ELEGBE Adébayo', photo: null },
    { nom: 'KOUSSEDOH Borgia', photo: null },
    { nom: 'GBAGUIDI Emmanuela', photo: null },
    { nom: 'SOSSOU Elnis', photo: null },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const nom = e.target.nom.value;
    const email = e.target.email.value;
    const message = e.target.message.value;
    window.location.href = `mailto:support.unipath@gmail.com?subject=Support UniPath - ${nom}&body=${message}%0A%0AEnvoyé par: ${email}`;
  };

  return (
    <div className='min-h-screen bg-white'>

      {/* NAVBAR */}
      <nav className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-amber-300 text-sm'>Plateforme universitaire numérique</span>
        </div>
        <div className='flex gap-3'>
          <button onClick={() => navigate('/login')} className='text-sm border border-amber-400 px-4 py-2 rounded-lg hover:bg-blue-800 transition'>
            Se connecter
          </button>
          <button onClick={() => navigate('/register')} className='text-sm bg-amber-400 text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition'>
            Créer un compte
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className='relative text-white px-6' style={{minHeight: '550px', paddingTop: '8rem', paddingBottom: '8rem'}}>
        <img src={bgImage} alt='background' className='absolute inset-0 w-full h-full object-cover' />
        <div className='absolute inset-0' style={{backgroundColor: 'rgba(30, 58, 138, 0.6)'}} />
        <div className='relative max-w-4xl mx-auto text-center'>
          <h1 className='text-4xl md:text-6xl font-black mb-6 leading-tight'>
            Gérez votre parcours
            <span className='text-amber-400'> universitaire</span>
            <br />en toute simplicité
          </h1>
          <p className='text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10'>
            UniPath digitalise les inscriptions aux concours universitaires.
            De la candidature à la convocation, tout se fait en ligne.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button onClick={() => navigate('/register')} className='bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition shadow-lg'>
              Créer mon compte →
            </button>
            <button onClick={() => navigate('/login')} className='border-2 border-amber-400 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition'>
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

      {/* COMMENT ÇA MARCHE */}
      <section className='py-16 px-6 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Comment ça marche ?</h2>
          <p className='text-center text-gray-500 mb-12'>4 étapes simples pour compléter votre inscription</p>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {etapes.map((e, i) => (
              <div key={e.numero} className='relative text-center'>
                {i < etapes.length - 1 && (
                  <div className='hidden md:block absolute top-10 left-3/4 w-1/2 h-0.5 bg-amber-200 z-0' />
                )}
                <div className='relative z-10 w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-3xl mx-auto mb-4'>
                  {e.icon}
                </div>
                <span className='text-xs font-black text-amber-600 tracking-widest'>{e.numero}</span>
                <h3 className='text-base font-bold text-blue-900 mt-1 mb-2'>{e.titre}</h3>
                <p className='text-gray-500 text-sm leading-relaxed'>{e.desc}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10'>
            <button onClick={() => navigate('/register')} className='bg-amber-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-amber-600 transition'>
              Commencer maintenant →
            </button>
          </div>
        </div>
      </section>

      {/* ESPACES */}
      <section className='py-16 px-6 bg-gray-50'>
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

      {/* POURQUOI UNIPATH */}
      <section className='py-16 px-6 bg-blue-900 text-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center mb-4'>Pourquoi UniPath ?</h2>
          <p className='text-center text-amber-300 mb-12'>Une plateforme pensée pour simplifier la vie des étudiants béninois</p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {avantages.map((a) => (
              <div key={a.titre} className='bg-blue-800 rounded-2xl p-8 flex gap-5 items-start hover:bg-blue-700 transition'>
                <div className='text-4xl flex-shrink-0'>{a.icon}</div>
                <div>
                  <h3 className='text-lg font-bold text-amber-400 mb-2'>{a.titre}</h3>
                  <p className='text-blue-100 text-sm leading-relaxed'>{a.desc}</p>
                </div>
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
          <div className='grid grid-cols-2 md:grid-cols-3 gap-8'>
            {equipe.map((m) => (
              <div key={m.nom} className='text-center bg-gray-50 rounded-2xl p-8 border border-gray-100'>
                {m.photo ? (
                  <img src={m.photo} alt={m.nom} className='w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-blue-100' />
                ) : (
                  <div className='w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-blue-200'>
                    👨‍💻
                  </div>
                )}
                <h3 className='font-bold text-blue-900 text-sm'>{m.nom}</h3>
              </div>
            ))}
          </div>
          <div className='text-center mt-10 text-gray-500 text-sm'>
            <p>Sous la supervision du <strong>Professeur DJARA Tahirou</strong></p>
            <p>Sous l'encadrement du <strong>Dr ASSOUMA Abdoul Kamal</strong></p>
          </div>
        </div>
      </section>

      {/* CONTACT SUPPORT */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-2xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Contacter le support</h2>
          <p className='text-center text-gray-500 mb-10'>Une question ou un problème technique ? Notre équipe vous répond dans les plus brefs délais.</p>
          <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
            <form onSubmit={handleContactSubmit} className='space-y-5'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Nom complet</label>
                <input
                  name='nom'
                  type='text'
                  required
                  placeholder='Ex: AGOSSOU Kofi'
                  className='w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Adresse email</label>
                <input
                  name='email'
                  type='email'
                  required
                  placeholder='votre@email.com'
                  className='w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Message</label>
                <textarea
                  name='message'
                  required
                  rows={5}
                  placeholder='Décrivez votre problème ou votre question...'
                  className='w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none'
                />
              </div>
              <button
                type='submit'
                className='w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition'
              >
                Envoyer le message →
              </button>
            </form>
            <div className='mt-6 pt-6 border-t border-gray-100 text-center'>
              <p className='text-gray-500 text-sm'>Ou contactez-nous directement par email :</p>
              <a href='mailto:support.unipath@gmail.com' className='text-amber-600 font-medium text-sm hover:underline'>
                support.unipath@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='bg-blue-900 text-white py-10 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-2xl font-black mb-2 text-amber-400'>UniPath</p>
          <p className='text-blue-200 text-sm mb-4'>Plateforme numérique de gestion du parcours universitaire</p>
          <div className='border-t border-blue-700 pt-6 mt-6'>
            <p className='text-blue-300 text-xs'>
              EPAC — École Polytechnique d'Abomey-Calavi · Université d'Abomey-Calavi<br />
              Groupe 2 · Année académique 2025–2026 · Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}