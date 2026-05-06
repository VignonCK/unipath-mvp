// src/pages/DashboardCommission.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService, authService } from '../services/api';
import HistoriqueActions from '../components/HistoriqueActions';
import DocumentViewer from '../components/DocumentViewer';
import CommissionLayout from '../components/CommissionLayout';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const STATUT_CONFIG = {
  VALIDE:        { label: 'Validé',        bar: 'bg-slate-700',  badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  REJETE:        { label: 'Rejeté',        bar: 'bg-slate-500',  badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  EN_ATTENTE:    { label: 'En attente',    bar: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  SOUS_RESERVE:  { label: 'Sous réserve',  bar: 'bg-slate-600',  badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const PIECES_LABELS = {
  acteNaissance: 'Acte',
  carteIdentite: 'CNI',
  photo:         'Photo',
  releve:        'Relevé',
  quittance:     'Quittance',
};

export default function DashboardCommission() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [filtre, setFiltre] = useState('EN_ATTENTE');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [recherche, setRecherche] = useState('');
  const [historiqueOuvert, setHistoriqueOuvert] = useState(null);
  const [counts, setCounts] = useState({ EN_ATTENTE: 0, VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 });
  const [rejetModal, setRejetModal] = useState({ open: false, inscriptionId: null, commentaire: '' });
  const [sousReserveModal, setSousReserveModal] = useState({ open: false, inscriptionId: null, commentaire: '' });
  const user = authService.getCurrentUser();

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
  };

  const chargerCounts = async () => {
    try {
      const [attente, valide, rejete, sousReserve] = await Promise.all([
        commissionService.getDossiers('EN_ATTENTE'),
        commissionService.getDossiers('VALIDE'),
        commissionService.getDossiers('REJETE'),
        commissionService.getDossiers('SOUS_RESERVE'),
      ]);
      setCounts({
        EN_ATTENTE:   attente.inscriptions?.length ?? 0,
        VALIDE:       valide.inscriptions?.length ?? 0,
        REJETE:       rejete.inscriptions?.length ?? 0,
        SOUS_RESERVE: sousReserve.inscriptions?.length ?? 0,
      });
    } catch (err) { console.error(err); }
  };

  const chargerDossiers = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getDossiers(filtre);
      setDossiers(data.inscriptions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerCounts(); }, []);
  useEffect(() => { chargerDossiers(); }, [filtre]);

  const handleDecision = async (inscriptionId, statut, commentaireRejet = null, commentaireSousReserve = null) => {
    try {
      const payload = { statut };
      if (commentaireRejet) payload.commentaireRejet = commentaireRejet;
      if (commentaireSousReserve) payload.commentaireSousReserve = commentaireSousReserve;
      
      await commissionService.updateStatut(inscriptionId, payload);
      
      const messages = {
        VALIDE: 'validé',
        REJETE: 'rejeté',
        SOUS_RESERVE: 'accepté sous réserve'
      };
      
      showMessage(`Dossier ${messages[statut]} avec succès`, statut === 'VALIDE' ? 'success' : statut === 'REJETE' ? 'error' : 'info');
      chargerDossiers();
      chargerCounts();
      
      if (statut === 'REJETE') {
        setRejetModal({ open: false, inscriptionId: null, commentaire: '' });
      }
      if (statut === 'SOUS_RESERVE') {
        setSousReserveModal({ open: false, inscriptionId: null, commentaire: '' });
      }
    } catch (err) { showMessage(err.message, 'error'); }
  };

  const ouvrirModalRejet = (inscriptionId) => {
    setRejetModal({ open: true, inscriptionId, commentaire: '' });
  };

  const ouvrirModalSousReserve = (inscriptionId) => {
    setSousReserveModal({ open: true, inscriptionId, commentaire: '' });
  };

  const confirmerRejet = () => {
    if (!rejetModal.commentaire.trim()) {
      showMessage('Le commentaire de rejet est obligatoire', 'error');
      return;
    }
    handleDecision(rejetModal.inscriptionId, 'REJETE', rejetModal.commentaire, null);
  };

  const confirmerSousReserve = () => {
    if (!sousReserveModal.commentaire.trim()) {
      showMessage('Le commentaire est obligatoire', 'error');
      return;
    }
    handleDecision(sousReserveModal.inscriptionId, 'SOUS_RESERVE', null, sousReserveModal.commentaire);
  };

  const dossiersFiltres = dossiers.filter((ins) => {
    const q = recherche.toLowerCase();
    return (
      `${ins.candidat.prenom} ${ins.candidat.nom}`.toLowerCase().includes(q) ||
      ins.candidat.matricule.toLowerCase().includes(q) ||
      ins.concours.libelle.toLowerCase().includes(q)
    );
  });

  const total = counts.EN_ATTENTE + counts.VALIDE + counts.REJETE + counts.SOUS_RESERVE;

  return (
    <CommissionLayout>
      <div className='min-h-screen bg-gray-50'>
        <main className='max-w-5xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6'>

          {/* Toast */}
          {message.text && (
            <div className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
                                         'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '' })} className='ml-4 opacity-60 hover:opacity-100 text-lg leading-none'>&times;</button>
          </div>
        )}

        {/* STATS GLOBALES */}
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-5'>
            <p className='text-xs text-gray-500 font-medium mb-1'>Total dossiers</p>
            <p className='text-3xl font-semibold text-slate-800'>{total}</p>
          </div>
          <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
            <p className='text-xs text-slate-600 font-medium mb-1'>En attente</p>
            <p className='text-3xl font-semibold text-slate-700'>{counts.EN_ATTENTE}</p>
          </div>
          <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
            <p className='text-xs text-slate-600 font-medium mb-1'>Validés</p>
            <p className='text-3xl font-semibold text-slate-700'>{counts.VALIDE}</p>
          </div>
          <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
            <p className='text-xs text-slate-600 font-medium mb-1'>Sous réserve</p>
            <p className='text-3xl font-semibold text-slate-700'>{counts.SOUS_RESERVE}</p>
          </div>
          <div className='bg-slate-50 rounded-lg border border-slate-200 p-5'>
            <p className='text-xs text-slate-600 font-medium mb-1'>Rejetés</p>
            <p className='text-3xl font-semibold text-slate-700'>{counts.REJETE}</p>
          </div>
        </div>

        {/* FILTRES + RECHERCHE */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 items-center'>
          <div className='flex gap-2 flex-wrap'>
            {['EN_ATTENTE', 'VALIDE', 'SOUS_RESERVE', 'REJETE'].map(s => {
              const cfg = STATUT_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFiltre(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    filtre === s ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    filtre === s ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className='flex-1 relative'>
            <input
              type='text'
              placeholder='Rechercher par nom, matricule ou concours...'
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className='w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-500'
            />
          </div>
          {recherche && (
            <span className='text-xs text-gray-400 whitespace-nowrap'>{dossiersFiltres.length} résultat(s)</span>
          )}
        </div>

        {/* LISTE DES DOSSIERS */}
        {loading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='bg-white rounded-lg p-6 animate-pulse'>
                <div className='flex gap-4'>
                  <div className='w-11 h-11 bg-gray-200 rounded-lg' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                    <div className='h-3 bg-gray-200 rounded w-1/4' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : dossiersFiltres.length === 0 ? (
          <div className='text-center py-16 text-gray-400'>
            <p className='text-sm'>{recherche ? 'Aucun résultat pour cette recherche.' : 'Aucun dossier dans cette catégorie.'}</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {dossiersFiltres.map((ins) => {
              const cfg = STATUT_CONFIG[ins.statut] || STATUT_CONFIG.EN_ATTENTE;
              const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
              const nbPieces = pieces.filter(p => ins.candidat.dossier?.[p]).length;
              const pct = Math.round((nbPieces / pieces.length) * 100);
              const dossierId = ins.candidat.dossier?.id;

              return (
                <div key={ins.id} className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                  <div className={`h-1 ${cfg.bar}`} />
                  <div className='p-5'>

                    {/* En-tête candidat */}
                    <div className='flex items-start justify-between gap-3 mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0'>
                          {initiales(ins.candidat.prenom, ins.candidat.nom)}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>{ins.candidat.prenom} {ins.candidat.nom}</p>
                          <p className='text-slate-600 text-xs font-mono'>{ins.candidat.matricule}</p>
                          <p className='text-gray-500 text-xs'>{ins.concours.libelle}</p>
                        </div>
                      </div>
                      <div className='text-right flex-shrink-0'>
                        <span className={`text-xs px-3 py-1 rounded-lg font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <p className='text-gray-400 text-xs mt-1'>
                          {new Date(ins.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Pièces */}
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs text-gray-500 font-medium'>Pièces justificatives</p>
                        <span className='text-xs font-medium text-slate-600'>
                          {nbPieces}/5 — {pct}%
                        </span>
                      </div>
                      <div className='flex gap-1.5'>
                        {pieces.map(p => (
                          <div
                            key={p}
                            title={PIECES_LABELS[p]}
                            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                              ins.candidat.dossier?.[p]
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {ins.candidat.dossier?.[p] ? (
                              <svg className='w-3 h-3 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                              </svg>
                            ) : (
                              <svg className='w-3 h-3 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className='flex gap-1.5 mt-1'>
                        {pieces.map(p => (
                          <p key={p} className='flex-1 text-center text-gray-400' style={{ fontSize: '9px' }}>
                            {PIECES_LABELS[p]}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex flex-col gap-2'>
                      {/* Bouton Voir le profil - toujours visible */}
                      <button
                        onClick={() => navigate(`/commission/candidat/${ins.id}`)}
                        className='w-full bg-slate-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        Voir le profil complet
                      </button>
                      
                      {ins.statut === 'EN_ATTENTE' && (
                        <div className='flex flex-col gap-2'>
                          <button
                            onClick={() => handleDecision(ins.id, 'VALIDE')}
                            className='w-full bg-slate-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition'
                          >
                            Valider le dossier
                          </button>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => ouvrirModalSousReserve(ins.id)}
                              className='flex-1 bg-slate-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition'
                            >
                              Sous réserve
                            </button>
                            <button
                              onClick={() => ouvrirModalRejet(ins.id)}
                              className='flex-1 bg-slate-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition'
                            >
                              Rejeter
                            </button>
                          </div>
                        </div>
                      )}
                      {dossierId && (
                        <button
                          onClick={() => setHistoriqueOuvert(historiqueOuvert === dossierId ? null : dossierId)}
                          className='text-xs text-slate-700 border border-slate-200 py-1.5 rounded-lg hover:bg-slate-50 transition'
                        >
                          {historiqueOuvert === dossierId ? 'Masquer l\'historique' : 'Voir l\'historique'}
                        </button>
                      )}
                    </div>

                    {historiqueOuvert === dossierId && dossierId && (
                      <div className='mt-4 border-t border-gray-100 pt-4'>
                        <HistoriqueActions
                          dossierId={dossierId}
                          nomCandidat={`${ins.candidat.prenom} ${ins.candidat.nom}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modale de rejet */}
        {rejetModal.open && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
            <div className='bg-white rounded-lg shadow-2xl w-full max-w-md'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h3 className='font-semibold text-gray-900'>Rejeter le dossier</h3>
            </div>
            <div className='px-6 py-5'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Motif du rejet <span className='text-slate-600'>*</span>
              </label>
              <textarea
                value={rejetModal.commentaire}
                onChange={(e) => setRejetModal(m => ({ ...m, commentaire: e.target.value }))}
                placeholder='Expliquez pourquoi le dossier est rejeté (ex: pièces manquantes, documents non conformes, etc.)'
                rows={5}
                className='w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500 resize-none'
              />
              <p className='text-xs text-gray-500 mt-2'>
                Ce message sera envoyé au candidat par email.
              </p>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex gap-3 justify-end'>
              <button
                onClick={() => setRejetModal({ open: false, inscriptionId: null, commentaire: '' })}
                className='text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition'
              >
                Annuler
              </button>
              <button
                onClick={confirmerRejet}
                className='text-sm bg-slate-700 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition'
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale sous réserve */}
      {sousReserveModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
          <div className='bg-white rounded-lg shadow-2xl w-full max-w-md'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='font-semibold text-gray-900'>Accepter sous réserve</h3>
            </div>
            <div className='px-6 py-5'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Conditions à remplir <span className='text-slate-600'>*</span>
              </label>
              <textarea
                value={sousReserveModal.commentaire}
                onChange={(e) => setSousReserveModal(m => ({ ...m, commentaire: e.target.value }))}
                placeholder='Indiquez les conditions que le candidat doit remplir (ex: fournir une pièce manquante, corriger un document, etc.)'
                rows={5}
                className='w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500 resize-none'
              />
              <p className='text-xs text-gray-500 mt-2'>
                Ce message sera envoyé au candidat par email avec les conditions à remplir.
              </p>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex gap-3 justify-end'>
              <button
                onClick={() => setSousReserveModal({ open: false, inscriptionId: null, commentaire: '' })}
                className='text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition'
              >
                Annuler
              </button>
              <button
                onClick={confirmerSousReserve}
                className='text-sm bg-slate-700 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition'
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </CommissionLayout>
  );
}
