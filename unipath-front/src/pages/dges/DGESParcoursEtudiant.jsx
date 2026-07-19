import DGESLayout from '../../components/DGESLayout';
import { BentoCard } from '../../components/AcademicLayout';
import ParcoursParMatriculePanel from '../../components/ParcoursParMatriculePanel';

export default function DGESParcoursEtudiant() {
  return (
    <DGESLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Parcours étudiant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez le parcours académique national d&apos;un étudiant à partir de son matricule UniPath
            (tous établissements).
          </p>
        </div>

        <BentoCard className="p-4 sm:p-6">
          <ParcoursParMatriculePanel
            accent="blue"
            perimetreHint="Périmètre national DGES : toutes les inscriptions académiques de la plateforme."
          />
        </BentoCard>
      </div>
    </DGESLayout>
  );
}
