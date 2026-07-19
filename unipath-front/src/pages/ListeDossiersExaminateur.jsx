// src/pages/ListeDossiersExaminateur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import { BentoCard } from '../components/AcademicLayout';
import { filterBtnClass, VERDICT_LABELS } from '../constants/controleurStyles';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
  ControleurPagination,
  InfoRow,
  VerdictBadge,
} from '../components/controleur/ControleurShell';

const ListeDossiersExaminateur = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const concoursId = searchParams.get('concoursId') || '';
  const [filtreActif, setFiltreActif] = useState(searchParams.get('filtre') || 'a_evaluer');
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regleExamen, setRegleExamen] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  const chargerDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
        filtre: filtreActif,
      });

      if (concoursId) {
        params.append('concoursId', concoursId);
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
  }, [concoursId, filtreActif, pagination.limite, pagination.offset]);

  useEffect(() => {
    chargerDossiers();
  }, [chargerDossiers]);

  const changerFiltre = (nouveauFiltre) => {
    setFiltreActif(nouveauFiltre);
    const next = { filtre: nouveauFiltre };
    if (concoursId) next.concoursId = concoursId;
    setSearchParams(next);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const libelleConcours = dossiers[0]?.inscription?.concours?.libelle;

  const sousTitre =
    filtreActif === 'evalues'
      ? `${pagination.total} dossier${pagination.total > 1 ? 's' : ''} évalué${pagination.total > 1 ? 's' : ''}`
      : filtreActif === 'tous'
        ? `${pagination.total} dossier${pagination.total > 1 ? 's' : ''}`
        : `${pagination.total} dossier${pagination.total > 1 ? 's' : ''} en attente d'évaluation`;

  if (loading) {
    return <ControleurLoading message="Chargement des dossiers..." />;
  }

  return (
    <ControleurPage>
      <div>
        <button
          type="button"
          onClick={() => navigate('/commission/mes-concours')}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          ← Mes concours
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Mes dossiers à évaluer</h1>
        <p className="text-sm text-gray-500 mt-1">
          {libelleConcours ? `${libelleConcours} — ${sousTitre}` : sousTitre}
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
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={filterBtnClass(filtreActif === 'a_evaluer')}
            onClick={() => changerFiltre('a_evaluer')}
          >
            À évaluer
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === 'evalues')}
            onClick={() => changerFiltre('evalues')}
          >
            Évalués
          </button>
          <button
            type="button"
            className={filterBtnClass(filtreActif === 'tous')}
            onClick={() => changerFiltre('tous')}
          >
            Tous
          </button>
        </div>
      </BentoCard>

      {dossiers.length === 0 ? (
        <BentoCard className="p-6 bg-white text-center">
          <p className="text-sm text-gray-500">
            {filtreActif === 'evalues'
              ? 'Aucun dossier évalué pour ce concours.'
              : filtreActif === 'tous'
                ? 'Aucun dossier pour ce concours.'
                : 'Aucun dossier à évaluer pour le moment.'}
            {filtreActif === 'a_evaluer' && regleExamen?.periodeEtudeRequise
              ? " Les dossiers n'apparaissent que pendant la période d'étude définie par la DEC."
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
              <div className={`h-1 ${dossier.evalue ? 'bg-emerald-400' : 'bg-slate-300'}`} />
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
                  <div className="flex gap-2 flex-wrap">
                    {dossier.evalue ? (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Évalué
                        </span>
                        {dossier.verdict?.verdict && (
                          <VerdictBadge verdict={dossier.verdict.verdict} />
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        À évaluer
                      </span>
                    )}
                  </div>
                </div>

                <InfoRow label="Établissement">{dossier.inscription.concours.etablissement}</InfoRow>
                {dossier.verdict?.verdict && (
                  <InfoRow label="Mon verdict">
                    {VERDICT_LABELS[dossier.verdict.verdict] || dossier.verdict.verdict}
                  </InfoRow>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                    onClick={() =>
                      navigate(
                        `/examinateur/dossiers/${dossier.dossierInscriptionId}${
                          concoursId ? `?concoursId=${concoursId}` : ''
                        }`
                      )
                    }
                  >
                    {dossier.evalue ? 'Voir le dossier' : 'Évaluer ce dossier'}
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
