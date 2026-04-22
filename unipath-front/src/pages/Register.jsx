// src/pages/Register.jsx
// Page d'inscription — Formulaire multi-étapes
// Étape 1 : Informations personnelles
// Étape 2 : Email et mot de passe

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function Register() {
  // useNavigate permet de rediriger vers une autre page
  const navigate = useNavigate();

  // Étape actuelle du formulaire : 1 ou 2
  const [etape, setEtape] = useState(1);

  // true pendant l'appel API pour désactiver le bouton
  const [loading, setLoading] = useState(false);

  // Message d'erreur à afficher si quelque chose échoue
  const [error, setError] = useState('');

  // Toutes les données du formulaire dans un seul objet
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    dateNaiss: '',
    lieuNaiss: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Mise à jour d'un champ quand l'utilisateur tape
  // e.target.name = nom du champ, e.target.value = valeur saisie
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Effacer l'erreur quand l'utilisateur tape
  };

  // Validation et passage à l'étape 2
  const handleEtape1 = (e) => {
    e.preventDefault(); // Empêcher le rechargement de la page
    if (!formData.nom || !formData.prenom) {
      setError('Nom et prénom sont obligatoires');
      return;
    }
    setEtape(2); // Passer à l'étape 2
  };

  // Soumission finale du formulaire à l'étape 2
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que les deux mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      // Appel API → backend de Harry → Supabase Auth + table Candidat
      await authService.register(formData);

      // Rediriger vers Login avec un message de confirmation
      navigate('/login', {
        state: { message: 'Compte créé ! Connectez-vous.' }
      });
    } catch (err) {
      // Afficher l'erreur renvoyée par le backend
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl shadow-md w-full max-w-lg p-8'>

        {/* Titre */}
        <h1 className='text-2xl font-bold text-blue-800 mb-2'>
          Créer un compte
        </h1>

        {/* Barre de progression — bleue si étape atteinte, grise sinon */}
        <div className='flex items-center gap-2 mb-6'>
          <div className={`h-2 flex-1 rounded ${etape >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded ${etape >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        {/* Message d'erreur — visible uniquement si error n'est pas vide */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Informations personnelles ── */}
        {etape === 1 && (
          <form onSubmit={handleEtape1} className='space-y-4'>
            <p className='text-sm text-gray-500 mb-4'>
              Étape 1/2 — Informations personnelles
            </p>

            {/* On génère les champs dynamiquement depuis un tableau */}
            {[
              { name: 'nom', label: 'Nom', type: 'text', required: true },
              { name: 'prenom', label: 'Prénom', type: 'text', required: true },
              { name: 'telephone', label: 'Téléphone', type: 'tel', required: false },
              { name: 'dateNaiss', label: 'Date de naissance', type: 'date', required: false },
              { name: 'lieuNaiss', label: 'Lieu de naissance', type: 'text', required: false },
            ].map((field) => (
              <div key={field.name}>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {field.label}{' '}
                  {/* Astérisque rouge pour les champs obligatoires */}
                  {field.required && <span className='text-red-500'>*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            ))}

            <button
              type='submit'
              className='w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 font-medium'
            >
              Suivant →
            </button>
          </form>
        )}

        {/* ── ÉTAPE 2 : Email et mot de passe ── */}
        {etape === 2 && (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <p className='text-sm text-gray-500 mb-4'>
              Étape 2/2 — Connexion
            </p>

            {[
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'password', label: 'Mot de passe', type: 'password', required: true },
              { name: 'confirmPassword', label: 'Confirmer le mot de passe', type: 'password', required: true },
            ].map((field) => (
              <div key={field.name}>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            ))}

            <div className='flex gap-3'>
              {/* Bouton retour à l'étape 1 */}
              <button
                type='button'
                onClick={() => setEtape(1)}
                className='flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50'
              >
                ← Retour
              </button>

              {/* Bouton de soumission — désactivé pendant le chargement */}
              <button
                type='submit'
                disabled={loading}
                className='flex-1 bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50'
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        )}

        {/* Lien vers Login */}
        <p className='text-center text-sm text-gray-500 mt-4'>
          Déjà un compte ?{' '}
          <a href='/login' className='text-blue-700 hover:underline'>
            Se connecter
          </a>
        </p>
        <p className='text-center text-sm text-gray-500 mt-4'>
  <a href='/' className='text-blue-700 hover:underline'>← Retour à l'accueil</a>
</p>
      </div>
    </div>
  );
}