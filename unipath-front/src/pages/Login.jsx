// Importe le hook useState de React pour gérer l’état local du composant
import { useState } from 'react';

// Déclare le composant fonctionnel Login et l’exporte
export default function Login() {
  // Déclare une variable d’état pour l’email, initialisée à une chaîne vide
  const [email, setEmail] = useState('');
  // Déclare une variable d’état pour le mot de passe, initialisée à une chaîne vide
  const [password, setPassword] = useState('');

  // Fonction appelée lors de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault(); // Empêche le rechargement de la page lors de la soumission du formulaire
    console.log('Tentative de connexion :', email); // Affiche l’email dans la console (pour test)
    // La vraie logique sera ajoutée aux jours 3-5
  };

  // Retourne le JSX qui sera affiché à l’écran
  return (
    // Conteneur principal centré verticalement et horizontalement
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      {/* Carte blanche contenant le formulaire de connexion */}
      <div className='bg-white p-8 rounded-xl shadow-md w-full max-w-md'>
        {/* Titre de la page */}
        <h1 className='text-2xl font-bold text-center text-blue-800 mb-6'>
          UniPath — Connexion
        </h1>
        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Champ email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              type='email' // Champ de type email
              value={email} // Valeur liée à l’état email
              onChange={(e) => setEmail(e.target.value)} // Met à jour l’état email à chaque saisie
              className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='votre@email.com' // Texte d’exemple
              required // Champ obligatoire
            />
          </div>
          {/* Champ mot de passe */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Mot de passe
            </label>
            <input
              type='password' // Champ de type mot de passe
              value={password} // Valeur liée à l’état password
              onChange={(e) => setPassword(e.target.value)} // Met à jour l’état password à chaque saisie
              className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='••••••••' // Texte d’exemple
              required // Champ obligatoire
            />
          </div>
          {/* Bouton de soumission */}
          <button
            type='submit' // Déclenche la soumission du formulaire
            className='w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 font-medium'
          >
            Se connecter
          </button>
        </form>
        {/* Lien vers la page d’inscription */}
        <p className='text-center text-sm text-gray-500 mt-4'>
          Pas encore de compte ?{' '}
          <a href='/register' className='text-blue-700 hover:underline'>
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}