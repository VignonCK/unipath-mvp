// src/pages/DashboardCommission.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService, authService } from '../services/api';
import HistoriqueActions from '../components/HistoriqueActions';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const STATUT_CONFIG = {
  VALIDE:     { label: 'Validé',     bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  REJETE:     { label: 'Rejeté',     bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  EN_ATTENTE: { label: 'En attente', bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
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
  // Compteurs indépendants du filtre actif
  const [counts, setCounts] = useState({ EN_ATTENTE: 0, VALIDE: 0, REJETE: 0 });
  const user = authService.getCurrentUser();

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
  };

  // Charge les compteurs globaux (tous statuts en parallèle)
  const chargerCounts = async () => {
    try {
      const [attente, valide, rejete] = await Promise.all([
        commissionService.getDossiers('EN_ATTENTE'),
        commissionService.getDossiers('VALIDE'),
        commissionService.getDossiers('REJETE'),
      ]);
      setCounts({
        EN_ATTENTE: attente.inscriptions?.length ?? 0,
        VALIDE:     valide.inscriptions?.length ?? 0,
        REJETE:     rejete.inscriptions?.length ?? 0,
      });
    } catch (err) { console.error(err); }
  };

  // Charge uniquement les dossiers du filtre actif
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

  // Au montage : charger les counts + les dossiers du filtre par défaut
  useEffect(() => {
    chargerCounts();
  }, []);

  useEffect(() => { chargerDossiers(); }, [filtre]);

  const handleDecision = async (inscriptionId, statut) => {
    try {
      await commissionService.updateStatut(inscriptionId, statut);
      showMessage(`Dossier ${statut === 'VALIDE' ? 'validé ✅' : 'rejeté ❌'} avec succès`, statut === 'VALIDE' ? 'success' : 'error');
      // Recharger les deux pour garder les counts à jour
      chargerDossiers();
      chargerCounts();
    } catch (err) { showMessage(err.message, 'error'); }
  };

  const dossiersFiltres = dossiers.filter((ins) => {
    const q = recherche.toLowerCase();
    return (
      `${ins.candidat.prenom} ${ins.candidat.nom}`.toLowerCase().includes(q) ||
      ins.candidat.matricule.toLowerCase().includes(q) ||
      ins.concours.libelle.toLowerCase().includes(q)
    );
  });

  const total = counts.EN_ATTENTE + counts.VALIDE + counts.REJETE;

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── HEADER ── */}
      <header className='bg-blue-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-xs'>Espace Commission</span>
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0'>
              {user ? initiales(user.prenom || user.email?.[0], user.nom || user.email?.[1]) : 'C'}
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold leading-tight'>
                {user?.prenom ? `${user.prenom} ${user.nom}` : user?.email}
              </p>
              <p className='text-orange-300 text-xs'>Commission</p>
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

      <main className='max-w-5xl mx-auto p-6 space-y-6'>

        {/* Toast */}
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

        {/* ── STATS GLOBALES (toujours visibles, indépendantes du filtre) ── */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {/* Total */}
          <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg'>📋</div>
            <div>
              <p className='text-2xl font-black text-blue-900'>{total}</p>
              <p className='text-xs text-gray-500 font-medium'>Total dossiers</p>
            </div>
          </div>
          {/* En attente */}
          <div className='bg-yellow-50 rounded-2xl border-2 border-yellow-300 p-4 flex items-center gap-3'>
            <div className='w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-lg'>⏳</div>
            <div>
              <p className='text-2xl font-black text-yellow-700'>{counts.EN_ATTENTE}</p>
              <p className='text-xs text-yellow-600 font-medium'>En attente</p>
            </div>
          </div>
          {/* Validés */}
          <div className='bg-green-50 rounded-2xl border-2 border-green-300 p-4 flex items-center gap-3'>
            <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg'>✅</div>
            <div>
              <p className='text-2xl font-black text-green-700'>{counts.VALIDE}</p>
              <p className='text-xs text-green-600 font-medium'>Validés</p>
            </div>
          </div>
          {/* Rejetés */}
          <div className='bg-red-50 rounded-2xl border-2 border-red-300 p-4 flex items-center gap-3'>
            <div className='w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg'>❌</div>
            <div>
              <p className='text-2xl font-black text-red-600'>{counts.REJETE}</p>
              <p className='text-xs text-red-500 font-medium'>Rejetés</p>
            </div>
          </div>
        </div>

        {/* ── FILTRES + RECHERCHE ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center'>
          <div className='flex gap-2'>
            {['EN_ATTENTE', 'VALIDE', 'REJETE'].map(s => {
              const cfg = STATUT_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFiltre(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    filtre === s ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    filtre === s ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className='flex-1 relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>🔍</span>
            <input
              type='text'
              placeholder='Rechercher par nom, matricule ou concours...'
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className='w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500'
            />
          </div>
          {recherche && (
            <span className='text-xs text-gray-400 whitespace-nowrap'>{dossiersFiltres.length} résultat(s)</span>
          )}
        </div>

        {/* ── LISTE DES DOSSIERS ── */}
        {loading ? (
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='bg-white rounded-2xl p-6 animate-pulse'>
                <div className='flex gap-4'>
                  <div className='w-12 h-12 bg-gray-200 rounded-xl' />
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
            <p className='text-4xl mb-3'>📭</p>
            <p className='text-sm'>{recherche ? 'Aucun résultat pour cette recherche' : 'Aucun dossier dans cette catégorie'}</p>
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
                <div key={ins.id} className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                  {/* Barre colorée en haut */}
                  <div className={`h-1 ${cfg.bar}`} />

                  <div className='p-5'>
                    {/* En-tête candidat */}
                    <div className='flex items-start justify-between gap-3 mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-11 h-11 rounded-xl bg-blue-900 flex items-center justify-center text-sm font-bold text-white flex-shrink-0'>
                          {initiales(ins.candidat.prenom, ins.candidat.nom)}
                        </div>
                        <div>
                          <p className='font-bold text-gray-900'>{ins.candidat.prenom} {ins.candidat.nom}</p>
                          <p className='text-orange-600 text-xs font-mono'>{ins.candidat.matricule}</p>
                          <p className='text-gray-400 text-xs'>{ins.concours.libelle}</p>
                        </div>
                      </div>
                      <div className='text-right flex-shrink-0'>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <p className='text-gray-400 text-xs mt-1'>
                          {new Date(ins.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Pièces justificatives */}
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs text-gray-500 font-medium'>Pièces justificatives</p>
                        <span className={`text-xs font-bold ${pct === 100 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
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
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {ins.candidat.dossier?.[p] ? '✓' : '✗'}
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
                      {ins.statut === 'EN_ATTENTE' && (
                        <div className='flex gap-2'>
                          <button
                            onClick={() => handleDecision(ins.id, 'VALIDE')}
                            className='flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition'
                          >
                            ✓ Valider
                          </button>
                          <button
                            onClick={() => handleDecision(ins.id, 'REJETE')}
                            className='flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition'
                          >
                            ✗ Rejeter
                          </button>
                        </div>
                      )}

                      {dossierId && (
                        <button
                          onClick={() => setHistoriqueOuvert(historiqueOuvert === dossierId ? null : dossierId)}
                          className='text-xs text-blue-900 border border-blue-200 py-1.5 rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-1'
                        >
                          📋 {historiqueOuvert === dossierId ? 'Masquer' : 'Voir'} l'historique
                        </button>
                      )}
                    </div>

                    {/* Historique dépliable */}
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
      </main>
    </div>
  );
}
