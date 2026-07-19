// src/pages/MesConcoursCommission.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService } from '../services/api';
import CommissionLayout from '../components/CommissionLayout';
import { BentoCard } from '../components/AcademicLayout';

const ROLE_LABEL = {
  EXAMINATEUR: 'Examinateur',
  CONTROLEUR: 'Contrôleur',
};

const ROLE_BADGE = {
  EXAMINATEUR: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CONTROLEUR: 'bg-amber-100 text-amber-900 border-amber-200',
};

const MesConcoursCommission = () => {
  const navigate = useNavigate();
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreRole, setFiltreRole] = useState('');
  const [filtreConcoursId, setFiltreConcoursId] = useState('');

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commissionService.getMesConcours();
      setAffectations(data.affectations || []);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const concoursOptions = useMemo(() => {
    const map = new Map();
    for (const aff of affectations) {
      const id = aff.concours?.id;
      if (!id || map.has(id)) continue;
      map.set(id, aff.concours.libelle || aff.concours.nom || id);
    }
    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [affectations]);

  const rolesDisponibles = useMemo(() => {
    const roles = new Set(affectations.map((a) => a.role).filter(Boolean));
    return [...roles];
  }, [affectations]);

  const affectationsFiltrees = useMemo(() => {
    return affectations.filter((aff) => {
      if (filtreRole && aff.role !== filtreRole) return false;
      if (filtreConcoursId && aff.concours?.id !== filtreConcoursId) return false;
      return true;
    });
  }, [affectations, filtreRole, filtreConcoursId]);

  const entrer = (aff) => {
    const cid = aff.concours.id;
    if (aff.role === 'EXAMINATEUR') {
      navigate(`/examinateur/dossiers?concoursId=${cid}`);
    } else {
      navigate(`/controleur-commission/dossiers?concoursId=${cid}`);
    }
  };

  return (
    <CommissionLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Mes concours</h1>
          <p className="text-sm text-gray-500 mt-1">
            Concours qui vous sont affectés. Votre rôle (examinateur ou contrôleur) dépend du concours.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500">Chargement…</div>
        ) : affectations.length === 0 ? (
          <BentoCard className="p-6 bg-white text-center">
            <p className="text-sm text-gray-500">
              Aucun concours ne vous est affecté pour le moment. La DEC vous affectera aux concours à étudier.
            </p>
          </BentoCard>
        ) : (
          <>
            <BentoCard className="p-4 bg-white mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Filtrer par rôle
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                    value={filtreRole}
                    onChange={(e) => setFiltreRole(e.target.value)}
                  >
                    <option value="">Tous les rôles</option>
                    {rolesDisponibles.includes('EXAMINATEUR') && (
                      <option value="EXAMINATEUR">Examinateur</option>
                    )}
                    {rolesDisponibles.includes('CONTROLEUR') && (
                      <option value="CONTROLEUR">Contrôleur</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Filtrer par concours
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                    value={filtreConcoursId}
                    onChange={(e) => setFiltreConcoursId(e.target.value)}
                  >
                    <option value="">Tous les concours assignés</option>
                    {concoursOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(filtreRole || filtreConcoursId) && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    {affectationsFiltrees.length} résultat
                    {affectationsFiltrees.length > 1 ? 's' : ''}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-slate-600 hover:text-slate-800 underline"
                    onClick={() => {
                      setFiltreRole('');
                      setFiltreConcoursId('');
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </BentoCard>

            {affectationsFiltrees.length === 0 ? (
              <BentoCard className="p-6 bg-white text-center">
                <p className="text-sm text-gray-500">
                  Aucun concours ne correspond à ces filtres.
                </p>
              </BentoCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {affectationsFiltrees.map((aff) => (
                  <BentoCard
                    key={`${aff.concours.id}-${aff.role}`}
                    className="p-0 overflow-hidden bg-white hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`h-1 ${aff.role === 'CONTROLEUR' ? 'bg-amber-400' : 'bg-indigo-400'}`}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {aff.concours.libelle || aff.concours.nom}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_BADGE[aff.role]}`}
                        >
                          {ROLE_LABEL[aff.role] || aff.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {aff.etudeCloturee ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                            Étude clôturée
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {aff.dossiersATraiter} dossier
                            {aff.dossiersATraiter > 1 ? 's' : ''} à traiter
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={aff.etudeCloturee}
                        onClick={() => entrer(aff)}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                          aff.etudeCloturee
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-slate-700 text-white hover:bg-slate-800'
                        }`}
                      >
                        {aff.role === 'EXAMINATEUR'
                          ? 'Évaluer les dossiers'
                          : 'Contrôler les dossiers'}
                      </button>
                    </div>
                  </BentoCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CommissionLayout>
  );
};

export default MesConcoursCommission;
