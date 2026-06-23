// src/pages/DossiersSansVerdictControleur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import { BentoCard } from '../components/AcademicLayout';
import { PRIORITE_STYLES, PRIORITE_CARD_STYLES } from '../constants/controleurStyles';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
  ControleurPagination,
  InfoRow,
  StatCard,
} from '../components/controleur/ControleurShell';

const PRIORITE_LABELS = {
  URGENT: 'Urgent',
  HIGH: 'Prioritaire',
  NORMAL: 'Normal',
};

const DossiersSansVerdictControleur = () => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limite: 50, offset: 0, pages: 0 });

  const chargerDossiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limite: pagination.limite,
        offset: pagination.offset,
      });

      const response = await apiFetch(`/controleur-commission/dossiers/sans-verdict?${params}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des dossiers');
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
      setPagination(data.pagination);
      setStatistiques(data.statistiques);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.limite, pagination.offset]);

  useEffect(() => {
    chargerDossiers();
  }, [chargerDossiers]);

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const getPrioriteBadge = (priorite) => {
    const key = priorite === 'URGENT' || priorite === 'HIGH' ? priorite : 'NORMAL';
    const cls = PRIORITE_STYLES[key];
    const label = PRIORITE_LABELS[key];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return <ControleurLoading message="Chargement des dossiers..." />;
  }

  return (
    <ControleurPage>
      <div>
        <button
          type="button"
          className="mb-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={() => navigate('/controleur-commission/tableau-de-bord')}
        >
          ← Retour au tableau de bord
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Dossiers sans verdict</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dossiers en attente d&apos;évaluation depuis plus de 2 jours
        </p>
      </div>

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      {statistiques && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total" value={statistiques.totalDossiersSansVerdict} />
          <StatCard
            label="Urgents"
            value={statistiques.dossiersUrgents}
            sub="> 5 jours"
            className="border border-orange-200 bg-orange-50/50"
          />
          <StatCard
            label="Prioritaires"
            value={statistiques.dossiersHigh}
            sub="3-5 jours"
            className="border border-yellow-200 bg-yellow-50/50"
          />
        </div>
      )}

      {dossiers.length === 0 ? (
        <BentoCard className="p-6 bg-white text-center">
          <p className="text-sm text-green-700">
            Aucun dossier sans verdict depuis plus de 2 jours. Excellent travail !
          </p>
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {dossiers.map((dossier) => {
            const prioriteKey =
              dossier.priorite === 'URGENT' || dossier.priorite === 'HIGH'
                ? dossier.priorite
                : 'NORMAL';
            const cardStyle = PRIORITE_CARD_STYLES[prioriteKey] || '';

            return (
              <BentoCard
                key={dossier.dossierInscriptionId}
                className={`p-0 overflow-hidden bg-white hover:shadow-lg transition-shadow ${cardStyle}`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                    </h3>
                    {getPrioriteBadge(dossier.priorite)}
                  </div>

                  <InfoRow label="Concours">{dossier.inscription.concours.libelle}</InfoRow>
                  <InfoRow label="Établissement">{dossier.inscription.concours.etablissement}</InfoRow>
                  <InfoRow label="N° Inscription">{dossier.inscription.numeroInscription}</InfoRow>
                  <InfoRow label="Date de création">
                    {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}
                  </InfoRow>

                  <ControleurAlert type="warning">
                    <span>⏰</span>
                    <span>
                      <strong>{dossier.joursEcoules} jour{dossier.joursEcoules > 1 ? 's' : ''}</strong>{' '}
                      sans aucun verdict
                    </span>
                  </ControleurAlert>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                      onClick={() =>
                        navigate(`/controleur-commission/dossiers/${dossier.dossierInscriptionId}`)
                      }
                    >
                      Voir le dossier
                    </button>
                  </div>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}

      <ControleurPagination pagination={pagination} onPageChange={handlePageChange} />
    </ControleurPage>
  );
};

export default DossiersSansVerdictControleur;
