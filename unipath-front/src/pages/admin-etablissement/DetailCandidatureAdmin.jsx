import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationService, ouvrirPiece } from '../../services/api';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { getApplicationStatus, needsPreinscriptionDecision, PREINSCRIPTION_STATUS } from '../../utils/adminParcoursInscription';

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo: "Photo d'identité",
  releve: 'Relevé de notes',
};

export default function DetailCandidatureAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingPiece, setOpeningPiece] = useState(null);

  useEffect(() => {
    applicationService
      .getById(id)
      .then((data) => {
        setApplication(data.application);
        setCompletion(data.completion || null);
      })
      .catch((err) => setError(err.message || 'Candidature introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpenPiece = async (url, key) => {
    if (!url) return;
    setOpeningPiece(key);
    try {
      await ouvrirPiece(url);
    } catch (err) {
      setError(err.message || 'Impossible d\'ouvrir le document');
    } finally {
      setOpeningPiece(null);
    }
  };

  if (loading) {
    return (
      <AdminEtablissementLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </AdminEtablissementLayout>
    );
  }

  if (!application) {
    return (
      <AdminEtablissementLayout>
        <div className="p-6 text-center text-red-600">{error || 'Candidature introuvable'}</div>
      </AdminEtablissementLayout>
    );
  }

  const candidat = application.candidat;
  const dossier = candidat?.dossier;
  const statusInfo = getApplicationStatus(application.status);
  const awaitingDecision = needsPreinscriptionDecision(application);
  const preinStatut = application.preinscription?.statut;
  const preinInfo = preinStatut ? PREINSCRIPTION_STATUS[preinStatut] : null;

  return (
    <AdminEtablissementLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin-etablissement/candidatures')}
          className="text-sm text-teal-900 hover:underline"
        >
          ← Candidatures
        </button>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-gray-900">{application.numeroApplication}</h1>
              <p className="text-sm text-gray-500">{application.filiere?.nom} — {application.anneeAcademique}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.badge}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{statusInfo.hint}</p>
          {completion && (
            <p className="text-sm text-gray-600">
              Complétude du dossier : <strong>{completion.percentage ?? completion.pourcentage ?? 0}%</strong>
            </p>
          )}
          {application.preinscription && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-600">Pré-inscription </span>
              <strong>{application.preinscription.numeroPreinscription}</strong>
              {preinInfo && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${preinInfo.badge}`}>
                  {preinInfo.label}
                </span>
              )}
            </div>
          )}
        </BentoCard>

        {awaitingDecision && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 flex flex-wrap items-center justify-between gap-3">
            <span>Ce dossier est prêt — la décision d&apos;admission se prend dans Pré-inscriptions.</span>
            <button
              type="button"
              onClick={() => navigate('/admin-etablissement/preinscriptions')}
              className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Aller aux pré-inscriptions →
            </button>
          </div>
        )}

        <BentoCard className="p-6 space-y-2">
          <h2 className="font-bold text-gray-900">Candidat</h2>
          <p className="text-sm text-gray-800">{candidat?.prenom} {candidat?.nom}</p>
          <p className="text-sm text-gray-500">{candidat?.email}</p>
          {candidat?.telephone && <p className="text-sm text-gray-500">{candidat.telephone}</p>}
          {candidat?.matricule && <p className="text-xs text-gray-400">Matricule : {candidat.matricule}</p>}
        </BentoCard>

        <BentoCard className="p-6">
          <h2 className="font-bold text-gray-900 mb-4">Pièces du dossier</h2>
          {!dossier ? (
            <p className="text-sm text-gray-400">Aucune pièce enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(PIECES_LABELS).map(([key, label]) => {
                const url = dossier[key];
                return (
                  <li key={key} className="flex items-center justify-between gap-3 text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-700">{label}</span>
                    {url ? (
                      <button
                        type="button"
                        disabled={openingPiece === key}
                        onClick={() => handleOpenPiece(url, key)}
                        className="text-teal-800 font-semibold text-xs hover:underline disabled:opacity-50"
                      >
                        {openingPiece === key ? 'Ouverture...' : 'Consulter'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Manquant</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </BentoCard>

        {(application.documents?.length > 0) && (
          <BentoCard className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Documents complémentaires</h2>
            <ul className="space-y-2">
              {application.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{doc.label || doc.code}</span>
                  {doc.documentUrl ? (
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-800 font-semibold text-xs hover:underline"
                    >
                      Ouvrir
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">{doc.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </BentoCard>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
