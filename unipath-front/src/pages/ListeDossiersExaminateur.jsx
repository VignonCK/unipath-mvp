// src/pages/ListeDossiersExaminateur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { concoursService } from '../services/api';
import { apiFetch } from '../utils/apiConfig';
import { BentoCard } from '../components/AcademicLayout';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
  ControleurPagination,
  InfoRow,
} from '../components/controleur/ControleurShell';

const ListeDossiersExaminateur = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regleExamen, setRegleExamen] = useState(null);
  const [filtreConcoursId, setFiltreConcoursId] = useState(searchParams.get('concoursId') || '');
  const [concours, setConcours] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  useEffect(() => {
    chargerConcours();
  }, []);

  const chargerConcours = async () => {
    try {
      const data = await concoursService.getAll();
      setConcours(Array.isArray(data) ? data : data.concours || []);
    } catch (err) {
      console.error('Erreur chargement concours:', err);
    }
  };

  const chargerDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
      });

      if (filtreConcoursId) {
        params.append('concoursId', filtreConcoursId);
      }

      const response = await apiFetch(`/examinateur/dossiers-a-evaluer?${params}`);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors du chargement des dossiers');
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setRegleExamen(data.regleExamen || null);
      setPagination((prev) => data.pagination || prev);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtreConcoursId, pagination.limite, pagination.offset]);

  useEffect(() => {
    chargerDossiers();
  }, [chargerDossiers]);

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  if (loading) {
    return <ControleurLoading message="Chargement des dossiers..." />;
  }

  return (
    <ControleurPage>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mes dossiers à évaluer</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination.total} dossier{pagination.total > 1 ? 's' : ''} en attente d&apos;évaluation
        </p>
      </div>

      {regleExamen?.message && (
        <ControleurAlert type="info">
          <span>ℹ️</span>
          <span>{regleExamen.message}</span>
        </ControleurAlert>
      )}

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      <BentoCard className="p-4 bg-white">
        <label className="block text-xs font-medium text-gray-500 mb-2">Filtrer par concours</label>
        <select
          className="w-full sm:max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          value={filtreConcoursId}
          onChange={(e) => {
            setFiltreConcoursId(e.target.value);
            setPagination((prev) => ({ ...prev, offset: 0 }));
          }}
        >
          <option value="">Tous les concours</option>
          {concours.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle} - {c.etablissement}
            </option>
          ))}
        </select>
      </BentoCard>

      {dossiers.length === 0 ? (
        <BentoCard className="p-6 bg-white text-center">
          <p className="text-sm text-gray-500">
            Aucun dossier à évaluer pour le moment.
            {regleExamen?.periodeEtudeRequise
              ? " Les dossiers n'apparaissent que pendant la période d'étude définie par la DEC."
              : regleExamen?.apresClotureInscriptions
                ? " Les dossiers n'apparaissent qu'après la clôture des inscriptions du concours."
                : ''}
          </p>
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {dossiers.map((dossier) => (
            <BentoCard
              key={dossier.dossierInscriptionId}
              className="p-0 overflow-hidden bg-white hover:shadow-lg transition-shadow"
            >
              <div className="h-1 bg-slate-300" />
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {dossier.inscription.numeroInscription || '—'}
                    </p>
                  </div>
                  {dossier.autreVerdictRendu && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {dossier.nombreVerdictsRendus}/2 verdict
                      {dossier.nombreVerdictsRendus > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <InfoRow label="Concours">{dossier.inscription.concours.libelle}</InfoRow>
                <InfoRow label="Établissement">{dossier.inscription.concours.etablissement}</InfoRow>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                    onClick={() => navigate(`/examinateur/dossiers/${dossier.dossierInscriptionId}`)}
                  >
                    Évaluer ce dossier
                  </button>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      )}

      <ControleurPagination pagination={pagination} onPageChange={handlePageChange} />
    </ControleurPage>
  );
};

export default ListeDossiersExaminateur;
