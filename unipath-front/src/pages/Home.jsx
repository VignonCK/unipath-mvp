// src/pages/Home.jsx
// Page d'accueil de UniPath
import { useNavigate } from 'react-router-dom';
import vignonPhoto from '../assets/equipe/vignon.jpeg';
import harryPhoto from '../assets/equipe/harry.png';
import adebayorPhoto from '../assets/equipe/adebayor.png';

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
      icon: '🎓',
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
      icon: '🏛️',
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
      icon: '📈',
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

  // ── REMPLACEMENT 1 — "Chiffres du projet" → "Pourquoi UniPath ?"
  const avantages = [
    {
      icon: '⏱️',
      titre: 'Gain de temps',
      desc: 'Inscrivez-vous en moins de 5 minutes depuis votre téléphone ou ordinateur, sans vous déplacer.',
    },
    {
      icon: '📍',
      titre: 'Zéro déplacement',
      desc: 'Soumettez tous vos documents en ligne. Plus besoin de faire la queue au bureau des inscriptions.',
    },
    {
      icon: '🔔',
      titre: 'Suivi en temps réel',
      desc: 'Recevez une notification par email dès que votre dossier est validé ou rejeté par la commission.',
    },
    {
      icon: '📄',
      titre: 'Convocation instantanée',
      desc: 'Téléchargez votre convocation PDF directement depuis votre tableau de bord, à tout moment.',
    },
  ];

  // ── REMPLACEMENT 2 — "Stack technique" → "Comment ça marche ?"
  const etapes = [
    {
      numero: '01',
      titre: 'Créez votre compte',
      desc: 'Remplissez le formulaire d\'inscription. Un matricule national UAC vous est attribué automatiquement.',
    },
    {
      numero: '02',
      titre: 'Choisissez vos concours',
      desc: 'Consultez la liste des concours disponibles et inscrivez-vous en un clic. Les conflits de dates sont détectés automatiquement.',
    },
    {
      numero: '03',
      titre: 'Soumettez votre dossier',
      desc: 'Uploadez vos pièces justificatives (relevés, acte de naissance, photo). La commission les examine depuis son espace.',
    },
    {
      numero: '04',
      titre: 'Recevez votre convocation',
      desc: 'Une fois votre dossier validé, téléchargez votre convocation PDF et présentez-vous le jour du concours.',
    },
  ];

  const equipe = [
    { nom: 'KANLINHANON Vignon', role: 'DB Architect', photo: vignonPhoto },
    { nom: 'DEDJI Harry', role: 'Backend / API', photo: harryPhoto },
    { nom: 'ELEGBE Adébayo', role: 'Frontend', photo: adebayorPhoto },
  ];

  return (
    <div className='min-h-screen bg-white'>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-sm'>
            Plateforme universitaire numérique
          </span>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => navigate('/login')}
            className='text-sm border border-blue-400 px-4 py-2 rounded-lg hover:bg-blue-800 transition'>
            Se connecter
          </button>
          <button
            onClick={() => navigate('/register')}
            className='text-sm bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition'>
            Créer un compte
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className='bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white py-20 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='inline-block bg-blue-700 bg-opacity-50 rounded-full px-4 py-1 text-sm text-blue-200 mb-6'>
            EPAC — Université d'Abomey-Calavi · Département GIT · 2025–2026
          </div>
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
            <button
              onClick={() => navigate('/register')}
              className='bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg'>
              Créer mon compte →
            </button>
            <button
              onClick={() => navigate('/login')}
              className='border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition'>
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ─────────────────────────────────── */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>
            Ce que fait UniPath
          </h2>
          <p className='text-center text-gray-500 mb-12'>
            Trois fonctionnalités au cœur du Module 1
          </p>
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

      {/* ── ESPACES UTILISATEURS ────────────────────────────── */}
      <section className='py-16 px-6 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>
            Trois espaces dédiés
          </h2>
          <p className='text-center text-gray-500 mb-12'>
            Chaque acteur dispose de son propre tableau de bord
          </p>
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
                <button
                  onClick={() => navigate(e.lien)}
                  className={`w-full ${e.couleurBadge} text-white py-3 rounded-xl font-bold hover:opacity-90 transition text-sm`}>
                  {e.labelBtn} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI UNIPATH ? ───────────────────────────────── */}
      <section className='py-16 px-6 bg-blue-900 text-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center mb-4'>
            Pourquoi UniPath ?
          </h2>
          <p className='text-center text-blue-300 mb-12'>
            Une plateforme conçue pour simplifier la vie des candidats
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
            {avantages.map((a) => (
              <div key={a.titre} className='bg-blue-800 rounded-2xl p-6 text-center hover:bg-blue-700 transition'>
                <div className='text-4xl mb-4'>{a.icon}</div>
                <h3 className='font-black text-teal-300 text-lg mb-2'>{a.titre}</h3>
                <p className='text-blue-200 text-sm leading-relaxed'>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ? ─────────────────────────────── */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>
            Comment ça marche ?
          </h2>
          <p className='text-center text-gray-500 mb-12'>
            De l'inscription à la convocation en 4 étapes simples
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {etapes.map((e) => (
              <div key={e.numero} className='bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start gap-5 hover:shadow-md transition'>
                <div className='text-3xl font-black text-teal-400 flex-shrink-0'>{e.numero}</div>
                <div>
                  <h3 className='font-black text-blue-900 text-lg mb-1'>{e.titre}</h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÉQUIPE ──────────────────────────────────────────── */}
      <section className='py-16 px-6 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>
            Notre équipe
          </h2>
          <p className='text-center text-gray-500 mb-12'>
            Groupe 2 — Département Génie Informatique et Télécommunications
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {equipe.map((m) => (
              <div key={m.nom} className='text-center'>
                <img
                  src={m.photo}
                  alt={m.nom}
                  className='w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-blue-100 shadow-md'
                />
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

    {/* ── CONTACT ─────────────────────────────────────────── */}
<section className='py-16 px-6 bg-gray-50'>
  <div className='max-w-xl mx-auto text-center'>
    <h2 className='text-3xl font-black text-blue-900 mb-4'>
      Support technique
    </h2>
    <p className='text-gray-500 mb-8'>
      Vous rencontrez un problème sur la plateforme ?
      Notre équipe de développement est disponible pour vous aider.
    </p>
    <div className='bg-white rounded-2xl p-8 border border-gray-100 shadow-sm'>
      <div className='text-5xl mb-4'>📩</div>
      <p className='text-gray-600 text-sm mb-6'>
        Pour toute question technique, signalement de bug ou demande
        d&apos;assistance, contactez-nous directement par email.
      </p>
      <a href='mailto:support.unipath@gmail.com'
        className='inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-md'>
        ✉️ Contacter le support
      </a>
      <p className='text-gray-400 text-xs mt-6'>
        Temps de réponse estimé : 24 à 48 heures ouvrées
      </p>
    </div>
  </div>
</section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className='bg-blue-900 text-white py-10 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-2xl font-black mb-2'>UniPath</p>
          <p className='text-blue-300 text-sm mb-4'>
            Plateforme numérique de gestion du parcours universitaire
          </p>
          <div className='border-t border-blue-800 pt-6 mt-6'>
            <p className='text-blue-400 text-xs'>
              EPAC — École Polytechnique d'Abomey-Calavi · Université d'Abomey-Calavi
              <br />
              Groupe 2 · Année académique 2025–2026 · Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}