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
  const user = authService.getCurrentUser();

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
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

  useEffect(() => { chargerDossiers(); }, [filtre]);

  const handleDecision = async (inscriptionId, statut) => {
    try {
      await commissionService.updateStatut(inscriptionId, statut);
      showMessage(`Dossier ${statut === 'VALIDE' ? 'validé ✅' : 'rejeté ❌'} avec succès`, statut === 'VALIDE' ? 'success' : 'error');
      chargerDossiers();
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

  const counts = {
    EN_ATTENTE: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
    VALIDE:     dossiers.filter(d => d.statut === 'VALIDE').length,
    REJETE:     dossiers.filter(d => d.statut === 'REJETE').length,
  };

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

        {/* ── STATS RAPIDES ── */}
        <div className='grid grid-cols-3 gap-4'>
          {[
            { statut: 'EN_ATTENTE', label: 'En attente', color: 'border-yellow-400 bg-yellow-50', text: 'text-yellow-700', icon: '⏳' },
            { statut: 'VALIDE',     label: 'Validés',    color: 'border-green-500 bg-green-50',   text: 'text-green-700',  icon: '✅' },
            { statut: 'REJETE',     label: 'Rejetés',    color: 'border-red-500 bg-red-50',       text: 'text-red-700',    icon: '❌' },
          ].map(({ statut, label, color, text, icon }) => (
            <button
              key={statut}
              onClick={() => setFiltre(statut)}
              className={`rounded-2xl border-2 p-4 text-left transition hover:shadow-sm ${color} ${filtre === statut ? 'ring-2 ring-offset-1 ring-blue-900' : ''}`}
            >
              <p className='text-2xl mb-1'>{icon}</p>
              <p className={`text-2xl font-black ${text}`}>{counts[statut]}</p>
              <p className={`text-xs font-medium ${text}`}>{label}</p>
            </button>
          ))}
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    filtre === s ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.label}
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
