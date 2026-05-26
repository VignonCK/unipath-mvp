import { useEffect, useState } from 'react';
import { etablissementService, filiereService } from '../services/api';

function EspaceEtablissement() {
  const [loading, setLoading] = useState(true);
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);
  const [error, setError] = useState('');
  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [selectedEtablissement, setSelectedEtablissement] = useState('');
  const [filters, setFilters] = useState({ filiere: '', annee: '' });

  useEffect(() => {
    const chargerEtablissements = async () => {
      try {
        setLoading(true);
        const data = await etablissementService.getAll();
        const list = data.etablissements || [];
        setEtablissements(list);
        if (list.length > 0) {
          setSelectedEtablissement(list[0].id);
        }
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des etablissements');
      } finally {
        setLoading(false);
      }
    };

    chargerEtablissements();
  }, []);

  useEffect(() => {
    const chargerDonnees = async () => {
      if (!selectedEtablissement) return;
      try {
        setLoadingEtudiants(true);
        const [filieresData, etudiantsData] = await Promise.all([
          filiereService.getByEtablissement(selectedEtablissement),
          etablissementService.getEtudiants(selectedEtablissement, filters),
        ]);
        setFilieres(filieresData.filieres || []);
        setEtudiants(etudiantsData.etudiants || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des etudiants');
      } finally {
        setLoadingEtudiants(false);
      }
    };

    chargerDonnees();
  }, [selectedEtablissement, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className='p-6 text-slate-600'>Chargement de l espace etablissement...</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-8'>
      <div className='mx-auto max-w-6xl space-y-4'>
        <h1 className='text-2xl font-semibold text-slate-900'>Espace Etablissement</h1>

        {error && <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</div>}

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div>
              <label htmlFor='etablissement' className='mb-1 block text-sm font-medium text-slate-700'>
                Etablissement
              </label>
              <select
                id='etablissement'
                value={selectedEtablissement}
                onChange={(e) => setSelectedEtablissement(e.target.value)}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              >
                {etablissements.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='filiere' className='mb-1 block text-sm font-medium text-slate-700'>
                Filiere
              </label>
              <select
                id='filiere'
                name='filiere'
                value={filters.filiere}
                onChange={handleFilterChange}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              >
                <option value=''>Toutes</option>
                {filieres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='annee' className='mb-1 block text-sm font-medium text-slate-700'>
                Annee academique
              </label>
              <input
                id='annee'
                name='annee'
                value={filters.annee}
                onChange={handleFilterChange}
                placeholder='2025-2026'
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              />
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>Etudiants inscrits</h2>
            <span className='text-sm text-slate-500'>{etudiants.length} resultat(s)</span>
          </div>

          {loadingEtudiants && <p className='text-sm text-slate-600'>Chargement des etudiants...</p>}

          {!loadingEtudiants && etudiants.length === 0 && (
            <p className='text-sm text-slate-500'>Aucun etudiant trouve pour ces filtres.</p>
          )}

          {!loadingEtudiants && etudiants.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200 text-sm'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Matricule</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Nom complet</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Filiere</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Annee</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Niveau</th>
                    <th className='px-3 py-2 text-left font-semibold text-slate-700'>Statut</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {etudiants.map((row) => (
                    <tr key={row.id}>
                      <td className='px-3 py-2 text-slate-700'>{row.candidat?.matricule || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{`${row.candidat?.nom || ''} ${row.candidat?.prenom || ''}`.trim()}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.filiere?.nom || '-'}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.anneeAcademique}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.niveau}</td>
                      <td className='px-3 py-2 text-slate-700'>{row.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EspaceEtablissement;

