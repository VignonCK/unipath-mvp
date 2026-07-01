import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';
import { candidatService, inscriptionAcadService } from '../services/api';
import { handleSessionError } from '../utils/auth';

const STATUT_BADGES = {
  EN_COURS: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
  EN_ATTENTE_QUITTANCE: { label: 'Quittance à soumettre', className: 'bg-orange-100 text-orange-800' },
  QUITTANCE_SOUMISE: { label: 'Quittance en vérification', className: 'bg-yellow-100 text-yellow-800' },
  VALIDE: { label: 'Inscrit(e)', className: 'bg-green-100 text-green-800' },
  REDOUBLANT: { label: 'Redoublant', className: 'bg-gray-100 text-gray-700' },
  ABANDONNE: { label: 'Abandonné', className: 'bg-red-100 text-red-800' },
};

function StatutBadge({ statut }) {
  const info = STATUT_BADGES[statut] || { label: statut, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.className}`}>
      {info.label}
    </span>
  );
}

export default function MesInscriptionsAcademiques() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModal, setUploadModal] = useState({ open: false, inscriptionId: null, label: '' });
  const [fichier, setFichier] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  const chargerInscriptions = useCallback(async () => {
    const data = await inscriptionAcadService.getMesInscriptions();
    setInscriptions(data.inscriptions || []);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const profil = await candidatService.getProfil();
        setCandidat(profil);
        await chargerInscriptions();
      } catch (err) {
        if (handleSessionError(err, navigate)) return;
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [chargerInscriptions, navigate]);

  const ouvrirUpload = (inscription) => {
    setUploadModal({
      open: true,
      inscriptionId: inscription.id,
      label: `${inscription.etablissement?.nom || 'Établissement'} — ${inscription.filiere?.nom || 'Filière'}`,
    });
    setFichier(null);
    setUploadMessage('');
    setUploadError('');
  };

  const fermerUpload = () => {
    setUploadModal({ open: false, inscriptionId: null, label: '' });
    setFichier(null);
    setUploadMessage('');
    setUploadError('');
  };

  const soumettreQuittance = async () => {
    if (!uploadModal.inscriptionId || !fichier) return;
    try {
      setUploadBusy(true);
      setUploadError('');
      setUploadMessage('');
      const formData = new FormData();
      formData.append('fichier', fichier);
      const data = await inscriptionAcadService.soumettreQuittance(uploadModal.inscriptionId, formData);
      setUploadMessage(data.message || 'Quittance soumise avec succès');
      await chargerInscriptions();
      setTimeout(() => fermerUpload(), 1200);
    } catch (err) {
      setUploadError(err?.message || 'Erreur lors de la soumission');
    } finally {
      setUploadBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CandidatLayout candidat={candidat}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mes inscriptions académiques</h1>
          <p className="text-sm text-gray-500 mt-1">
            Suivez vos inscriptions dans les établissements privés et soumettez vos quittances bancaires.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {inscriptions.length === 0 ? (
          <BentoCard className="p-10 text-center">
            <p className="text-gray-500 text-sm">Aucune inscription académique pour le moment.</p>
            <p className="text-xs text-gray-400 mt-2">
              Vos inscriptions apparaîtront ici après validation de votre pré-inscription par l&apos;établissement.
            </p>
          </BentoCard>
        ) : (
          <div className="space-y-4">
            {inscriptions.map((ins) => (
              <BentoCard key={ins.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {ins.etablissement?.nom || 'Établissement'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">{ins.filiere?.nom || 'Filière'}</p>
                    <p className="text-xs text-gray-400 mt-1">Année {ins.anneeAcademique} — Niveau L{ins.niveau}</p>
                  </div>
                  <StatutBadge statut={ins.statut} />
                </div>

                <div className="mt-4 space-y-3">
                  {ins.statut === 'EN_ATTENTE_QUITTANCE' && (
                    <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
                      Votre dossier a été accepté. Déposez votre quittance bancaire pour finaliser votre inscription.
                    </p>
                  )}

                  {['EN_COURS', 'EN_ATTENTE_QUITTANCE'].includes(ins.statut) && (
                    <button
                      type="button"
                      onClick={() => ouvrirUpload(ins)}
                      className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
                    >
                      Soumettre ma quittance bancaire
                    </button>
                  )}

                  {ins.statut === 'QUITTANCE_SOUMISE' && (
                    <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      Votre quittance est en cours de vérification par l&apos;établissement.
                    </p>
                  )}

                  {ins.statut === 'VALIDE' && ins.matricule && (
                    <div className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3">
                      <p className="text-xs text-green-700 font-medium mb-1">Votre matricule</p>
                      <p className="text-lg font-mono font-bold text-green-900">{ins.matricule}</p>
                    </div>
                  )}
                </div>
              </BentoCard>
            ))}
          </div>
        )}
      </div>

      {uploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Soumettre ma quittance bancaire</h3>
              <p className="text-xs text-gray-500 mt-1">{uploadModal.label}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier PDF <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFichier(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
              {uploadMessage && (
                <p className="text-sm text-green-700">{uploadMessage}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={fermerUpload}
                disabled={uploadBusy}
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={soumettreQuittance}
                disabled={uploadBusy || !fichier}
                className="text-sm bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-60"
              >
                {uploadBusy ? 'Envoi…' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CandidatLayout>
  );
}
