// Déclare et exporte le composant fonctionnel Register
export default function Register() {
  // Retourne le JSX qui sera affiché à l’écran
  return (
    // Conteneur principal centré verticalement et horizontalement
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      {/* Carte blanche contenant le contenu d’inscription */}
      <div className='bg-white p-8 rounded-xl shadow-md w-full max-w-lg'>
        {/* Titre de la page */}
        <h1 className='text-2xl font-bold text-blue-800 mb-4'>
          Créer un compte candidat
        </h1>
        {/* Message d’information */}
        <p className='text-gray-500'>
          Formulaire complet à implémenter — Jours 3–5
        </p>
        {/* Lien pour retourner à la page de connexion */}
        <a href='/login' className='text-blue-700 hover:underline text-sm mt-4 block'>
          ← Retour à la connexion
        </a>
      </div>
    </div>
  );
}