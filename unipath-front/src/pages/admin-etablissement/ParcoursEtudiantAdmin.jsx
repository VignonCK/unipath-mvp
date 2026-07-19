import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import ParcoursParMatriculePanel from '../../components/ParcoursParMatriculePanel';

export default function ParcoursEtudiantAdmin() {
  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Parcours étudiant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez le parcours académique d&apos;un étudiant à partir de son matricule UniPath
            (tous établissements).
          </p>
        </div>

        <BentoCard className="p-4 sm:p-6">
          <ParcoursParMatriculePanel
            accent="teal"
            perimetreHint="Périmètre national : toutes les inscriptions académiques de la plateforme."
          />
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
