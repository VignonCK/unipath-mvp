// src/pages/DashboardCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, candidatService, concoursService, inscriptionService, dossierService, convocationService } from '../services/api';
import DossierCompletion from '../components/DossierCompletion';

// ── Helpers ──────────────────────────────────────────────────────
function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const STATUT_CONFIG = {
  VALIDE:     { label: 'Validé',     bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700',  icon: '✅' },
  REJETE:     { label: 'Rejeté',     bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',      icon: '❌' },
  EN_ATTENTE: { label: 'En attente', bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
};

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo:         "Photo d'identité",
  releve:        'Relevé de notes Bac',
  quittance:     "Quittance d'inscription",
};

// ── Composant ─────────────────────────────────────────────────────
export default function DashboardCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState({});
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [telechargement, setTelechargement] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([candidatService.getProfil(), concoursService.getAll()])
      .then(([p, c]) => { setCandidат(p); setConcours(c); })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
  };

  const handleInscription = async (concoursId) => {
    try {
      await inscriptionService.creer(concoursId);
      showMessage('Inscription réussie !', 'success');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) { showMessage(err.message, 'error'); }
  };

  const handleUpload = async (typePiece, e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setUploadStatus(prev => ({ ...prev, [typePiece]: 'loading' }));
    try {
      await dossierService.uploadPiece(typePiece, fichier);
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'ok' }));
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch { setUploadStatus(prev => ({ ...prev, [typePiece]: 'error' })); }
  };

  const handleConvocation = async (inscriptionId) => {
    setTelechargement(prev => ({ ...prev, [inscriptionId]: true }));
    try { await convocationService.telecharger(inscriptionId); }
    catch (err) { showMessage('Erreur téléchargement : ' + err.message, 'error'); }
    finally { setTelechargement(prev => ({ ...prev, [inscriptionId]: false })); }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='w-12 h-12 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
        <p className='text-gray-500 text-sm'>Chargement...</p>
      </div>
    </div>
  );

  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── HEADER ── */}
      <header className='bg-blue-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-xs'>Espace Candidat</span>
        </div>

        <div className='flex items-center gap-3'>
          {/* Avatar + nom */}
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0'>
              {initiales(candidat?.prenom, candidat?.nom)}
            </div>
            <div className='hidden sm:block text-right'>
              <p className='text-sm font-semibold leading-tight'>{nom}</p>
              <p className='text-orange-300 text-xs font-mono'>{candidat?.matricule}</p>
            </div>
          </div>

          <button
            onClick={() => { authService.logout(); navigate('/login'); }}
            className='text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition'
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className='max-w-4xl mx-auto p-6 space-y-6'>

        {/* Toast message */}
        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
                                         'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '' })} className='ml-4 opacity-60 hover:opacity-100'>✕</button>
          </div>
        )}

        {/* ── CARTE PROFIL ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          {/* Bandeau bleu */}
          <div className='h-16 bg-gradient-to-r from-blue-900 to-blue-800' />
          <div className='px-6 pb-6'>
            {/* Avatar grand format */}
            <div className='flex items-end gap-4 -mt-8 mb-4'>
              <div className='w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 border-white flex-shrink-0'>
                {initiales(candidat?.prenom, candidat?.nom)}
              </div>
              <div className='pb-1'>
                <h2 className='text-lg font-bold text-gray-900'>{nom}</h2>
                <span className='inline-block bg-blue-900 text-orange-300 text-xs font-mono px-2 py-0.5 rounded-md'>
                  {candidat?.matricule}
                </span>
              </div>
            </div>

            {/* Infos en grille */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {[
                { icon: '✉️', label: 'Email',     value: candidat?.email },
                { icon: '📞', label: 'Téléphone', value: candidat?.telephone || 'Non renseigné' },
                { icon: '🎂', label: 'Naissance', value: candidat?.dateNaiss ? new Date(candidat.dateNaiss).toLocaleDateString('fr-FR') : '—' },
                { icon: '📍', label: 'Lieu',      value: candidat?.lieuNaiss || '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} className='flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3'>
                  <span className='text-lg'>{icon}</span>
                  <div>
                    <p className='text-xs text-gray-400'>{label}</p>
                    <p className='text-sm font-medium text-gray-800'>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COMPLÉTUDE DU DOSSIER ── */}
        <DossierCompletion
          candidatId={candidat?.id}
          dossier={candidat?.dossier}
          onSoumettre={async () => {
            showMessage('Dossier soumis ! La commission va étudier votre candidature.', 'success');
            const updated = await candidatService.getProfil();
            setCandidат(updated);
          }}
        />

        {/* ── MES INSCRIPTIONS ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
            🎓 Mes inscriptions
            <span className='ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal'>
              {candidat?.inscriptions?.length || 0}
            </span>
          </h2>

          {!candidat?.inscriptions?.length ? (
            <div className='text-center py-8 text-gray-400'>
              <p className='text-3xl mb-2'>📭</p>
              <p className='text-sm'>Aucune inscription pour le moment.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {candidat.inscriptions.map((ins) => {
                const cfg = STATUT_CONFIG[ins.statut] || STATUT_CONFIG.EN_ATTENTE;
                return (
                  <div key={ins.id} className='flex overflow-hidden rounded-xl border border-gray-100 hover:shadow-sm transition'>
                    {/* Barre colorée à gauche */}
                    <div className={`w-1.5 flex-shrink-0 ${cfg.bar}`} />
                    <div className='flex-1 flex items-center justify-between gap-3 px-4 py-3'>
                      <div>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-base'>🏛️</span>
                          <p className='font-semibold text-gray-800 text-sm'>{ins.concours?.libelle}</p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className='text-xs text-gray-400'>
                            {new Date(ins.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {ins.statut === 'VALIDE' && (
                        <button
                          onClick={() => handleConvocation(ins.id)}
                          disabled={telechargement[ins.id]}
                          className='flex-shrink-0 text-xs border border-orange-400 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition disabled:opacity-50'
                        >
                          {telechargement[ins.id] ? '⏳ Génération...' : '📄 Convocation'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CONCOURS DISPONIBLES ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
            🗓️ Concours disponibles
            <span className='ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-normal'>
              {concours.length}
            </span>
          </h2>

          {!concours.length ? (
            <p className='text-center text-gray-400 text-sm py-6'>Aucun concours disponible.</p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {concours.map((c) => {
                const dejaInscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
                return (
                  <div key={c.id} className='border border-gray-100 rounded-xl p-4 hover:shadow-sm transition flex flex-col gap-3'>
                    <div className='flex items-start gap-3'>
                      <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0'>
                        🏛️
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-gray-800 text-sm leading-tight'>{c.libelle}</p>
                        <p className='text-xs text-gray-400 mt-0.5'>
                          {new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {dejaInscrit ? (
                      <span className='text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-center font-medium'>
                        ✓ Inscrit
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInscription(c.id)}
                        className='text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition font-medium'
                      >
                        S'inscrire →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PIÈCES JUSTIFICATIVES ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4 flex items-center gap-2'>
            📎 Mes pièces justificatives
          </h2>
          <div className='space-y-2'>
            {Object.entries(PIECES_LABELS).map(([key, label]) => {
              const estDepose = candidat?.dossier?.[key];
              const status = uploadStatus[key];
              const isLoading = status === 'loading';
              const isOk = estDepose || status === 'ok';
              return (
                <div key={key} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                  isOk ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className='flex items-center gap-3'>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOk ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className='text-sm font-medium text-gray-700'>{label}</span>
                  </div>
                  <label className='cursor-pointer'>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      isLoading ? 'bg-gray-200 text-gray-500' :
                      isOk      ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  'bg-blue-900 text-white hover:bg-blue-800'
                    }`}>
                      {isLoading ? '⏳ Envoi...' : isOk ? '✏️ Modifier' : '⬆️ Déposer'}
                    </span>
                    <input type='file' accept='.pdf,.jpg,.jpeg,.png' onChange={(e) => handleUpload(key, e)} className='hidden' />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
