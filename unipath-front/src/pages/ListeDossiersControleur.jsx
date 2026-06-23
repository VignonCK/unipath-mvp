// src/pages/ListeDossiersControleur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import { BentoCard } from '../components/AcademicLayout';
import { filterBtnClass } from '../constants/controleurStyles';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
  ControleurPagination,
  InfoRow,
  VerdictBadge,
} from '../components/controleur/ControleurShell';

const ListeDossiersControleur = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreActif, setFiltreActif] = useState(searchParams.get('filtre') || '');
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  const chargerDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
      });

      if (filtreActif) {
        params.append('filtre', filtreActif);
      }

      const response = await apiFetch(`/controleur-commission/dossiers?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des dossiers');
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtreActif, pagination.limite, pagination.offset]);

  useEffect(() => {
    chargerDossiers();
  }, [chargerDossiers]);

  const changerFiltre = (nouveauFiltre) => {
    setFiltreActif(nouveauFiltre);
    setSearchParams(nouveauFiltre ? { filtre: nouveauFiltre } : {});
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  if (loading) {
    return <ControleurLoading message="Chargement des dossiers..." />;
  }

  return (
    <ControleurPage>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dossiers à examiner</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination.total} dossier{pagination.total > 1 ? 's' : ''} avec au moins 1 verdict
        </p>
      </div>

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      <BentoCard className="p-4 bg-white">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={filterBtnClass(!filtreActif)}
            onClick={() => changerFiltre('')}
          >
            Tous
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === '1_verdict')}
            onClick={() => changerFiltre('1_verdict')}
          >
            1 verdict (examinateur)
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === '2_verdicts')}
            onClick={() => changerFiltre('2_verdicts')}
          >
            Arbitrés
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === 'divergents', 'warning')}
            onClick={() => changerFiltre('divergents')}
          >
            Divergents
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === 'sans_decision')}
            onClick={() => changerFiltre('sans_decision')}
          >
            Sans décision
          </button>
        </div>
      </BentoCard>

      {dossiers.length === 0 ? (
        <BentoCard className="p-6 bg-white text-center">
          <p className="text-sm text-gray-500">Aucun dossier trouvé avec ce filtre.</p>
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {dossiers.map((dossier) => (
            <BentoCard
              key={dossier.dossierInscriptionId}
              className={`p-0 overflow-hidden bg-white hover:shadow-lg transition-shadow ${
                dossier.verdictsDivergents ? 'border border-orange-200' : ''
              }`}
            >
              <div className={`h-1 ${dossier.verdictsDivergents ? 'bg-orange-500' : 'bg-slate-300'}`} />
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {dossier.inscription.numeroInscription}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {dossier.statutVerdicts}
                    </span>
                    {dossier.verdictsDivergents && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        Divergents
                      </span>
                    )}
                    {dossier.decisionFinale && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Décision rendue
                      </span>
                    )}
                  </div>
                </div>

                <InfoRow label="Concours">{dossier.inscription.concours.libelle}</InfoRow>

                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">Verdict examinateur</span>
                    {dossier.verdicts.verdict1 ? (
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <VerdictBadge verdict={dossier.verdicts.verdict1.verdict} />
                        <span className="text-xs text-gray-400">
                          par {dossier.verdicts.verdict1.nomExaminateur}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        En attente
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">Arbitrage contrôleur</span>
                    {dossier.verdicts.verdict2 ? (
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <VerdictBadge verdict={dossier.verdicts.verdict2.verdict} />
                        <span className="text-xs text-gray-400">
                          par {dossier.verdicts.verdict2.nomControleur || dossier.verdicts.verdict2.nomExaminateur}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        En attente arbitrage
                      </span>
                    )}
                  </div>
                </div>

                {dossier.verdictsDivergents && (
                  <ControleurAlert type="warning">
                    <span>⚠️</span>
                    <span>Arbitrage divergent — l&apos;examinateur et le contrôleur ne sont pas d&apos;accord.</span>
                  </ControleurAlert>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                    onClick={() => navigate(`/controleur-commission/dossiers/${dossier.dossierInscriptionId}`)}
                  >
                    Examiner ce dossier
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

export default ListeDossiersControleur;
