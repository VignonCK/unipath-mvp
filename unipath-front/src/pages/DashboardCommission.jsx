// Déclare et exporte le composant fonctionnel DashboardCommission
export default function DashboardCommission() {
  // Retourne le JSX qui sera affiché à l’écran
  return (
    // Conteneur principal avec fond gris clair et padding
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Titre principal du tableau de bord pour la commission */}
      <h1 className='text-3xl font-bold text-blue-800'>
        Tableau de bord — Commission
      </h1>
      {/* Message d’information temporaire */}
      <p className='text-gray-500 mt-2'>
        Contenu à implémenter — Jours 3–5
      </p>
    </div>
  );
}