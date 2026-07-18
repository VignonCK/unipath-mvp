import { useState } from 'react';
import DGESLayout from '../../components/DGESLayout';
import { dgesService } from '../../services/api';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
}

export default function DGESRechercheCandidat() {
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const rechercher = async (e) => {
    e?.preventDefault?.();
    const q = matricule.trim();
    if (!q) {
      setError('Saisissez un matricule plateforme (ex. UnP-2026-000001)');
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await dgesService.lookupCandidat(q);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Recherche impossible');
    } finally {
      setLoading(false);
    }
  };

  const candidat = result?.candidat;
  const inscriptions = result?.inscriptionsAcademiques || [];

  return (
    <DGESLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Recherche candidat</h1>
        <p className="text-sm text-gray-600 mb-6">
          Recherchez un candidat par matricule plateforme (Module 2 — parcours académique).
        </p>

        <form onSubmit={rechercher} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="UnP-2026-000001"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </form>

        {error && (
          <div className="mb-4 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {candidat && (
          <section className="mb-8 border border-gray-200 rounded-xl bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Identité
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p>
                <span className="text-gray-500">Matricule</span>
                <br />
                <span className="font-mono font-semibold text-gray-900">{candidat.matricule}</span>
              </p>
              <p>
                <span className="text-gray-500">Nom complet</span>
                <br />
                <span className="font-semibold text-gray-900">
                  {candidat.prenom} {candidat.nom}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Email</span>
                <br />
                {candidat.email || '—'}
              </p>
              <p>
                <span className="text-gray-500">Téléphone</span>
                <br />
                {candidat.telephone || '—'}
              </p>
              <p>
                <span className="text-gray-500">ANIP</span>
                <br />
                {candidat.anip || '—'}
              </p>
              <p>
                <span className="text-gray-500">Sexe</span>
                <br />
                {candidat.sexe || '—'}
              </p>
              <p>
                <span className="text-gray-500">Nationalité</span>
                <br />
                {candidat.nationalite || '—'}
              </p>
              <p>
                <span className="text-gray-500">Série</span>
                <br />
                {candidat.serie || '—'}
              </p>
              <p>
                <span className="text-gray-500">Date / lieu de naissance</span>
                <br />
                {formatDate(candidat.dateNaiss)}
                {candidat.lieuNaiss ? ` — ${candidat.lieuNaiss}` : ''}
              </p>
            </div>
          </section>
        )}

        {result && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Parcours académique (Module 2)
            </h2>
            {inscriptions.length === 0 ? (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-4">
                Aucune inscription académique enregistrée pour ce candidat.
              </p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Établissement</th>
                      <th className="px-3 py-2 font-semibold">Filière</th>
                      <th className="px-3 py-2 font-semibold">Année</th>
                      <th className="px-3 py-2 font-semibold">Niveau</th>
                      <th className="px-3 py-2 font-semibold">Statut</th>
                      <th className="px-3 py-2 font-semibold">Matricule école</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscriptions.map((ins) => (
                      <tr key={ins.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          {ins.etablissement?.nom || '—'}
                          {ins.etablissement?.ville ? (
                            <span className="block text-xs text-gray-500">{ins.etablissement.ville}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">{ins.filiere?.nom || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{ins.anneeAcademique}</td>
                        <td className="px-3 py-2">{ins.niveau}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-800">
                            {ins.statut}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{ins.matricule || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </DGESLayout>
  );
}
