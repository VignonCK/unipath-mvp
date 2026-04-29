// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Import de toutes les images pour le carrousel
import examEleves from '../assets/examen-eleves.jpg';
import resultatsExam from '../assets/resultats_exam.jpg';
import universite from '../assets/universite.jpg';
import etudiants from '../assets/etudiants.jpg';
import etudiantsUac from '../assets/etudiants_uac.jpg';

// ── Carousel mobile ──────────────────────────────────────────────────────────
function MobileCarousel({ items, renderItem, interval = 10000 }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const goTo = (i) => {
    setIndex(i);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex(p => (p + 1) % items.length), interval);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setIndex(p => (p + 1) % items.length), interval);
    return () => clearInterval(timerRef.current);
  }, [items.length, interval]);

  return (
    <div className='relative overflow-hidden'>
      {/* Slides */}
      <div
        className='flex transition-transform duration-700 ease-in-out'
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={i} className='w-full flex-shrink-0'>
            {renderItem(item)}
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className='flex justify-center gap-2 mt-6'>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === index ? 'bg-orange-500 w-4' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  // Carrousel d'images pour la section HERO
  const images = [
    { src: examEleves, alt: 'Étudiants en examen' },
    { src: resultatsExam, alt: 'Résultats d\'examen' },
    { src: universite, alt: 'Campus universitaire' },
    { src: etudiants, alt: 'Étudiants' },
    { src: etudiantsUac, alt: 'Étudiants UAC' },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Changer d'image toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [images.length]);

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
      <nav className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-orange-300 text-sm'>Plateforme universitaire numérique</span>
        </div>
        <div className='flex gap-3'>
          <button onClick={() => navigate('/login')} className='text-sm border-2 border-orange-400 px-4 py-2 rounded-lg hover:bg-orange-400 hover:text-blue-900 transition'>
            Se connecter
          </button>
          <button onClick={() => navigate('/register')} className='text-sm bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition'>
            Créer un compte
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className='relative text-white px-6' style={{minHeight: '550px', paddingTop: '8rem', paddingBottom: '8rem'}}>
        {/* Carrousel d'images avec effet de glissement */}
        <div className='absolute inset-0 overflow-hidden'>
          <div 
            className='flex h-full transition-transform duration-1000 ease-in-out'
            style={{ 
              transform: `translateX(-${currentImageIndex * 100}vw)`,
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className='relative flex-shrink-0 w-screen h-full'
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className='w-full h-full object-cover'
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Overlay */}
        <div className='absolute inset-0' style={{backgroundColor: 'rgba(30, 58, 138, 0.4)'}} />
        
        {/* Indicateurs du carrousel */}
        <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10'>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-orange-400 scale-110' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Contenu du hero */}
        <div className='relative max-w-4xl mx-auto text-center z-10'>
          <h1 className='text-3xl md:text-6xl font-black mb-4 leading-tight'>
            Gérez votre parcours
            <span className='text-orange-400'> universitaire</span>
            <br />en toute simplicité
          </h1>
          <p className='text-base md:text-xl text-blue-100 max-w-2xl mx-auto mb-8'>
            UniPath digitalise les inscriptions aux concours universitaires.
            De la candidature à la convocation, tout se fait en ligne.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button onClick={() => navigate('/register')} className='bg-orange-500 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-600 transition'>
              Créer mon compte →
            </button>
            <button onClick={() => navigate('/login')} className='border-2 border-orange-400 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-400 hover:text-blue-900 transition'>
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

          {/* Desktop : grille */}
          <div className='hidden md:grid grid-cols-3 gap-8'>
            {fonctionnalites.map((f) => (
              <div key={f.titre} className='bg-white p-8 border-l-4 border-orange-500 hover:border-orange-600 transition'>
                <div className='text-5xl mb-4'>{f.icon}</div>
                <h3 className='text-xl font-bold text-blue-900 mb-3'>{f.titre}</h3>
                <p className='text-gray-600 leading-relaxed'>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile : carousel */}
          <div className='md:hidden'>
            <MobileCarousel
              items={fonctionnalites}
              renderItem={(f) => (
                <div className='bg-white p-8 border-l-4 border-orange-500 mx-1'>
                  <div className='text-5xl mb-4'>{f.icon}</div>
                  <h3 className='text-xl font-bold text-blue-900 mb-3'>{f.titre}</h3>
                  <p className='text-gray-600 leading-relaxed'>{f.desc}</p>
                </div>
              )}
            />
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
                  <div className='hidden md:block absolute top-10 left-3/4 w-1/2 h-1 bg-orange-200 z-0' />
                )}
                <div className='relative z-10 w-20 h-20 bg-orange-500 flex items-center justify-center text-3xl mx-auto mb-4 text-white'>
                  {e.icon}
                </div>
                <span className='text-xs font-black text-orange-600 tracking-widest'>{e.numero}</span>
                <h3 className='text-base font-bold text-blue-900 mt-1 mb-2'>{e.titre}</h3>
                <p className='text-gray-500 text-sm leading-relaxed'>{e.desc}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10'>
            <button onClick={() => navigate('/register')} className='bg-orange-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-600 transition'>
              Commencer maintenant →
            </button>
          </div>
        </div>
      </section>

      {/* FAQ - QUESTIONS FRÉQUENTES */}
      <section className='py-16 px-6 bg-gray-50'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Questions fréquentes</h2>
          <p className='text-center text-gray-500 mb-12'>Tout ce que vous devez savoir sur UniPath</p>
          <div className='space-y-4'>
            {[
              {
                question: 'Comment créer mon compte ?',
                reponse: 'Cliquez sur "Créer un compte", remplissez vos informations personnelles (nom, prénom, email, téléphone) et créez un mot de passe. Vous recevrez immédiatement votre matricule national unique.',
              },
              {
                question: 'Quels documents dois-je fournir ?',
                reponse: 'Vous devez uploader 5 pièces justificatives : acte de naissance, carte d\'identité, photo d\'identité, relevé de notes du Bac et quittance d\'inscription. Tous les documents doivent être au format PDF, JPG ou PNG.',
              },
              {
                question: 'Puis-je m\'inscrire à plusieurs concours ?',
                reponse: 'Oui ! Vous pouvez vous inscrire à autant de concours que vous le souhaitez. Le système vérifie automatiquement les conflits de dates pour éviter les chevauchements.',
              },
              {
                question: 'Comment savoir si mon dossier est validé ?',
                reponse: 'Vous recevrez une notification par email dès que la commission aura traité votre dossier. Vous pouvez aussi consulter le statut en temps réel depuis votre tableau de bord.',
              },
              {
                question: 'Quand puis-je télécharger ma convocation ?',
                reponse: 'Votre convocation PDF sera disponible automatiquement dès que votre dossier sera validé par la commission. Un bouton de téléchargement apparaîtra dans votre espace candidat.',
              },
              {
                question: 'Que faire si j\'ai oublié mon mot de passe ?',
                reponse: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe en toute sécurité.',
              },
            ].map((faq, index) => (
              <details key={index} className='bg-white border-l-4 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-orange-500 transition group'>
                <summary className='font-bold text-blue-900 flex justify-between items-center'>
                  <span>{faq.question}</span>
                  <span className='text-orange-500 text-xl group-open:rotate-180 transition-transform'>▼</span>
                </summary>
                <p className='text-gray-600 mt-4 leading-relaxed'>{faq.reponse}</p>
              </details>
            ))}
          </div>
          <div className='text-center mt-10'>
            <p className='text-gray-500 text-sm mb-4'>Vous avez d'autres questions ?</p>
            <button onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })} className='text-orange-600 font-medium hover:underline'>
              Contactez notre support →
            </button>
          </div>
        </div>
      </section>

      {/* POURQUOI UNIPATH */}
      <section className='py-16 px-6 bg-blue-900 text-white'>
        <div className='max-w-5xl mx-auto'>
          <h2 className='text-3xl font-black text-center mb-4'>Pourquoi UniPath ?</h2>
          <p className='text-center text-orange-300 mb-12'>Une plateforme pensée pour simplifier la vie des étudiants béninois</p>

          {/* Desktop : grille */}
          <div className='hidden md:grid grid-cols-2 gap-8'>
            {avantages.map((a) => (
              <div key={a.titre} className='bg-blue-800 p-8 flex gap-5 items-start hover:bg-blue-700 transition'>
                <div className='text-4xl flex-shrink-0'>{a.icon}</div>
                <div>
                  <h3 className='text-lg font-bold text-orange-400 mb-2'>{a.titre}</h3>
                  <p className='text-blue-100 text-sm leading-relaxed'>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile : carousel */}
          <div className='md:hidden'>
            <MobileCarousel
              items={avantages}
              renderItem={(a) => (
                <div className='bg-blue-800 p-8 flex gap-5 items-start mx-1'>
                  <div className='text-4xl flex-shrink-0'>{a.icon}</div>
                  <div>
                    <h3 className='text-lg font-bold text-orange-400 mb-2'>{a.titre}</h3>
                    <p className='text-blue-100 text-sm leading-relaxed'>{a.desc}</p>
                  </div>
                </div>
              )}
            />
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
              <div key={m.nom} className='text-center bg-gray-50 p-8 border-b-4 border-blue-900'>
                {m.photo ? (
                  <img src={m.photo} alt={m.nom} className='w-24 h-24 object-cover mx-auto mb-4 border-4 border-blue-100' />
                ) : (
                  <div className='w-24 h-24 bg-blue-100 flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-blue-200'>
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
      <section id='contact-section' className='py-16 px-6 bg-gray-50'>
        <div className='max-w-2xl mx-auto'>
          <h2 className='text-3xl font-black text-center text-blue-900 mb-4'>Contacter le support</h2>
          <p className='text-center text-gray-500 mb-10'>Une question ou un problème technique ? Notre équipe vous répond dans les plus brefs délais.</p>
          <div className='bg-white border-l-4 border-orange-500 p-8 rounded-lg'>
            <form onSubmit={handleContactSubmit} className='space-y-5'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Nom complet</label>
                <input
                  name='nom'
                  type='text'
                  required
                  placeholder='Ex: AGOSSOU Kofi'
                  className='w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Adresse email</label>
                <input
                  name='email'
                  type='email'
                  required
                  placeholder='votre@email.com'
                  className='w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Message</label>
                <textarea
                  name='message'
                  required
                  rows={5}
                  placeholder='Décrivez votre problème ou votre question...'
                  className='w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 text-sm resize-none'
                />
              </div>
              <button
                type='submit'
                className='w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition'
              >
                Envoyer le message →
              </button>
            </form>
            <div className='mt-6 pt-6 border-t border-gray-100 text-center'>
              <p className='text-gray-500 text-sm'>Ou contactez-nous directement par email :</p>
              <a href='mailto:support.unipath@gmail.com' className='text-orange-600 font-medium text-sm hover:underline'>
                support.unipath@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='bg-blue-900 text-white py-10 px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-2xl font-black mb-2 text-orange-400'>UniPath</p>
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
