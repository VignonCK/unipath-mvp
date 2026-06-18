// src/pages/TableauDeBordControleur.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiConfig';
import { BentoCard } from '../components/AcademicLayout';
import { VERDICT_STYLES } from '../constants/controleurStyles';
import {
  ControleurLoading,
  ControleurPage,
  ControleurAlert,
} from '../components/controleur/ControleurShell';

function getTauxDivergenceConfig(taux) {
  if (taux > 30) {
    return { label: 'Élevé', badge: 'bg-red-100 text-red-800 border border-red-200' };
  }
  if (taux > 15) {
    return { label: 'Modéré', badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
  }
  return { label: 'Normal', badge: 'bg-green-100 text-green-800 border border-green-200' };
}

function VerdictRow({ label, count, badgeClass }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {label}
      </span>
      <span className="text-lg font-semibold text-slate-800">{count}</span>
    </div>
  );
}

function RepartitionExaminateur({ titre, verdicts }) {
  return (
    <BentoCard className="p-5 bg-slate-50/50">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{titre}</h3>
      <div className="space-y-1">
        <VerdictRow label="Validé" count={verdicts?.VALIDE || 0} badgeClass={VERDICT_STYLES.VALIDE} />
        <VerdictRow label="Rejeté" count={verdicts?.REJETE || 0} badgeClass={VERDICT_STYLES.REJETE} />
        <VerdictRow label="Sous réserve" count={verdicts?.SOUS_RESERVE || 0} badgeClass={VERDICT_STYLES.SOUS_RESERVE} />
      </div>
    </BentoCard>
  );
}

function StatBar({ label, count, total, percent, colorClass, onClick }) {
  const width = total > 0 ? Math.max(percent, 0) : 0;
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-gray-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-800">
          {count} <span className="text-gray-400 font-normal">({percent.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </Wrapper>
  );
}

const TableauDeBordControleur = () => {
  const navigate = useNavigate();
  const [indicateurs, setIndicateurs] = useState(null);
  const [repartition, setRepartition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerTableauDeBord();
  }, []);

  const chargerTableauDeBord = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/controleur-commission/tableau-de-bord');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du tableau de bord');
      }

      const data = await response.json();
      setIndicateurs(data.indicateurs);
      setRepartition(data.repartitionVerdicts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const taux = indicateurs?.tauxDivergence ?? 0;
  const tauxConfig = getTauxDivergenceConfig(taux);
  const arbitragesTermines = indicateurs?.dossiersAvec2Verdicts ?? 0;
  const divergents = indicateurs?.dossiersVerdictsDivergents ?? 0;
  const alignes = indicateurs?.dossiersArbitragesAlignes ?? Math.max(arbitragesTermines - divergents, 0);
  const tauxAlignement = indicateurs?.tauxAlignement ?? (arbitragesTermines > 0 ? (alignes / arbitragesTermines) * 100 : 0);

  if (loading) {
    return <ControleurLoading message="Chargement du tableau de bord..." />;
  }

  return (
    <ControleurPage>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord — Contrôleur</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble des évaluations</p>
      </div>

      {error && (
        <ControleurAlert type="error">
          <span>⚠️</span>
          <span>{error}</span>
        </ControleurAlert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <BentoCard
          className="p-5 bg-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/controleur-commission/dossiers?filtre=1_verdict')}
        >
          <p className="text-xs text-gray-500 font-medium mb-1">En attente d&apos;arbitrage</p>
          <p className="text-3xl font-semibold text-slate-800">{indicateurs?.dossiersAvec1Verdict || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Verdict examinateur sans décision contrôleur</p>
        </BentoCard>

        <BentoCard
          className="p-5 bg-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/controleur-commission/dossiers?filtre=2_verdicts')}
        >
          <p className="text-xs text-gray-500 font-medium mb-1">Arbitrage terminé</p>
          <p className="text-3xl font-semibold text-slate-800">{indicateurs?.dossiersAvec2Verdicts || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Examinateur + contrôleur</p>
        </BentoCard>

        <BentoCard
          className="p-5 bg-white cursor-pointer hover:shadow-lg transition-shadow border border-orange-200 bg-orange-50/50"
          onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}
        >
          <p className="text-xs text-orange-700 font-medium mb-1">Arbitrages divergents</p>
          <p className="text-3xl font-semibold text-orange-800">{indicateurs?.dossiersVerdictsDivergents || 0}</p>
          <p className="text-xs text-orange-600 mt-1">Contrôleur ≠ examinateur</p>
        </BentoCard>

        <BentoCard className="p-5 bg-white">
          <p className="text-xs text-gray-500 font-medium mb-1">Décisions finales</p>
          <p className="text-3xl font-semibold text-slate-800">{indicateurs?.dossiersAvecDecisionFinale || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Dossiers traités</p>
        </BentoCard>

        <BentoCard
          className="p-5 bg-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}
        >
          <p className="text-xs text-gray-500 font-medium mb-1">Taux de divergence</p>
          <p className="text-3xl font-semibold text-slate-800">{taux.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {divergents} / {arbitragesTermines || 0} arbitrage{arbitragesTermines > 1 ? 's' : ''} terminé{arbitragesTermines > 1 ? 's' : ''}
          </p>
          <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${tauxConfig.badge}`}>
            {tauxConfig.label}
          </span>
        </BentoCard>
      </div>

      {arbitragesTermines > 0 ? (
        <BentoCard className="p-5 bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Statistiques d&apos;arbitrage</h2>
          <p className="text-sm text-gray-500 mb-4">
            Parmi les {arbitragesTermines} dossier{arbitragesTermines > 1 ? 's' : ''} déjà arbitré{arbitragesTermines > 1 ? 's' : ''},
            part des décisions alignées ou divergentes.
          </p>
          <div className="space-y-3">
            <StatBar
              label="Arbitrages alignés (contrôleur confirme l'examinateur)"
              count={alignes}
              total={arbitragesTermines}
              percent={tauxAlignement}
              colorClass="bg-green-500"
            />
            <StatBar
              label="Arbitrages divergents (contrôleur contredit l'examinateur)"
              count={divergents}
              total={arbitragesTermines}
              percent={taux}
              colorClass="bg-orange-500"
              onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}
            />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Taux de divergence = {divergents} ÷ {arbitragesTermines} × 100 = {taux.toFixed(1)}%
          </p>
        </BentoCard>
      ) : (
        <BentoCard className="p-5 bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Statistiques d&apos;arbitrage</h2>
          <p className="text-sm text-gray-500">
            Le taux de divergence sera calculé dès qu&apos;au moins un dossier aura été arbitré
            (verdict examinateur + décision contrôleur).
          </p>
        </BentoCard>
      )}

      {repartition && (
        <BentoCard className="p-5 bg-white">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Répartition des verdicts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RepartitionExaminateur titre="Examinateur" verdicts={repartition.verdict1} />
                <RepartitionExaminateur titre="Contrôleur" verdicts={repartition.verdict2} />
          </div>
        </BentoCard>
      )}

      <BentoCard className="p-5 bg-white">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
            onClick={() => navigate('/controleur-commission/dossiers')}
          >
            Voir tous les dossiers
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition"
            onClick={() => navigate('/controleur-commission/dossiers?filtre=divergents')}
          >
            Dossiers divergents
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            onClick={() => navigate('/controleur-commission/dossiers-sans-verdict')}
          >
            Dossiers sans verdict
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            onClick={() => navigate('/controleur-commission/dossiers?filtre=sans_decision')}
          >
            Dossiers sans décision
          </button>
        </div>
      </BentoCard>
    </ControleurPage>
  );
};

export default TableauDeBordControleur;
