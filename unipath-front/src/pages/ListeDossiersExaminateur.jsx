// src/pages/ListeDossiersExaminateur.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { concoursService } from '../services/api';
import { apiFetch } from '../utils/apiConfig';
import CommissionLayout from '../components/CommissionLayout';

const ListeDossiersExaminateur = () => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreConcoursId, setFiltreConcoursId] = useState('');
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
      setPagination((prev) => data.pagination || prev);
    } catch (err) {
      if (err.message !== 'Session expirée') {
        setError(err.message);
      }
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

  const content = loading ? (
    <div className="academic-container">
      <div className="academic-bento-card">
        <p className="academic-text-muted">Chargement des dossiers...</p>
      </div>
    </div>
  ) : (
    <div className="academic-container">
      <div className="academic-header">
        <h1 className="academic-title">Mes dossiers à évaluer</h1>
        <p className="academic-subtitle">
          {pagination.total} dossier{pagination.total > 1 ? 's' : ''} en attente d'évaluation
        </p>
      </div>

      {error && (
        <div className="academic-alert academic-alert-error">
          <span className="academic-alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="academic-bento-card" style={{ marginBottom: '2rem' }}>
        <div className="academic-form-group">
          <label className="academic-label">Filtrer par concours</label>
          <select
            className="academic-input"
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
        </div>
      </div>

      {dossiers.length === 0 ? (
        <div className="academic-bento-card">
          <p className="academic-text-muted">Aucun dossier à évaluer pour le moment.</p>
        </div>
      ) : (
        <div className="academic-grid">
          {dossiers.map((dossier) => (
            <div key={dossier.dossierInscriptionId} className="academic-bento-card academic-card-hover">
              <div className="academic-card-header">
                <h3 className="academic-card-title">
                  {dossier.inscription.candidat.nom} {dossier.inscription.candidat.prenom}
                </h3>
                {dossier.autreVerdictRendu && (
                  <span className="academic-badge academic-badge-info">
                    {dossier.nombreVerdictsRendus}/2 verdict{dossier.nombreVerdictsRendus > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="academic-card-content">
                <div className="academic-info-row">
                  <span className="academic-label">Concours :</span>
                  <span className="academic-text">{dossier.inscription.concours.libelle}</span>
                </div>
                <div className="academic-info-row">
                  <span className="academic-label">N° Inscription :</span>
                  <span className="academic-text">{dossier.inscription.numeroInscription || '—'}</span>
                </div>
              </div>

              <div className="academic-card-footer">
                <button
                  className="academic-btn academic-btn-primary"
                  onClick={() => navigate(`/examinateur/dossiers/${dossier.dossierInscriptionId}`)}
                >
                  Évaluer ce dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="academic-pagination">
          <button
            className="academic-btn academic-btn-secondary"
            disabled={pagination.offset === 0}
            onClick={() => handlePageChange(pagination.offset - pagination.limite)}
          >
            ← Précédent
          </button>
          <span className="academic-text">
            Page {Math.floor(pagination.offset / pagination.limite) + 1} sur {pagination.pages}
          </span>
          <button
            className="academic-btn academic-btn-secondary"
            disabled={pagination.offset + pagination.limite >= pagination.total}
            onClick={() => handlePageChange(pagination.offset + pagination.limite)}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );

  return <CommissionLayout>{content}</CommissionLayout>;
};

export default ListeDossiersExaminateur;
