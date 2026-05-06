// src/pages/GestionNotes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService, authService } from '../services/api';
import CommissionLayout from '../components/CommissionLayout';

function initiales(str) {
  if (!str) return 'C';
  const parts = str.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : str.slice(0, 2).toUpperCase();
}

export default function GestionNotes() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConcours();
  }, []);

  const loadConcours = async () => {
    try {
      setLoading(true);
      const data = await commissionService.getConcours();
      setConcours(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (inscriptionId, currentNote) => {
    setEditingNote(inscriptionId);
    setNoteValue(currentNote !== null ? currentNote.toString() : '');
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteValue('');
  };

  const saveNote = async (inscriptionId) => {
    try {
      setSubmitting(true);
      const note = noteValue.trim() === '' ? null : parseFloat(noteValue);
      
      if (note !== null && (isNaN(note) || note < 0 || note > 20)) {
        alert('La note doit être entre 0 et 20');
        return;
      }

      await commissionService.updateNote(inscriptionId, note);
      setEditingNote(null);
      setNoteValue('');
      loadConcours();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nomUser = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user?.email || 'Commission';

  if (loading) return (
    <CommissionLayout>
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement...</p>
        </div>
      </div>
    </CommissionLayout>
  );

  return (
    <CommissionLayout>
      <div className='min-h-screen bg-gray-50'>
        <main className='max-w-6xl mx-auto px-4 py-6 space-y-6'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-800'>Gestion des notes par concours</h1>
            <p className='text-sm text-gray-500 mt-1'>Saisissez les notes des candidats validés</p>
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
              {error}
            </div>
          )}

        {/* LISTE DES CONCOURS */}
        {concours.length === 0 ? (
          <div className='bg-white rounded-lg p-10 text-center shadow-sm border border-gray-200'>
            <p className='text-gray-400'>Aucun concours avec des candidats validés.</p>
          </div>
        ) : (
          concours.map((c) => (
            <div key={c.id} className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
              {/* HEADER CONCOURS */}
              <div className='bg-slate-700 px-6 py-4 text-white'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <svg className='w-6 h-6 text-slate-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l9-5-9-5-9 5 9 5z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' />
                    </svg>
                    <div>
                      <h2 className='text-lg font-semibold'>{c.libelle}</h2>
                      {c.etablissement && (
                        <p className='text-slate-300 text-xs'>{c.etablissement}</p>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-semibold'>{c.totalValides}</p>
                    <p className='text-slate-300 text-xs'>candidats validés</p>
                  </div>
                </div>
                <div className='flex gap-4 mt-3 text-sm'>
                  <div>
                    <span className='text-slate-300'>Notés : </span>
                    <span className='font-medium text-white'>{c.candidatsAvecNote}</span>
                  </div>
                  <div>
                    <span className='text-slate-300'>Non notés : </span>
                    <span className='font-medium text-white'>{c.candidatsSansNote}</span>
                  </div>
                  {c.dateComposition && (
                    <div>
                      <span className='text-slate-300'>Composition : </span>
                      <span className='font-medium'>{new Date(c.dateComposition).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TABLEAU CANDIDATS */}
              <div className='overflow-x-auto'>
                <table className='w-full text-sm min-w-[640px]'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-100'>
                      <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Matricule</th>
                      <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Nom & Prénom</th>
                      <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Email</th>
                      <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Note /20</th>
                      <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {c.inscriptions.length === 0 ? (
                      <tr>
                        <td colSpan='5' className='px-4 py-6 text-center text-gray-400'>
                          Aucun candidat validé pour ce concours.
                        </td>
                      </tr>
                    ) : (
                      c.inscriptions.map((inscription) => (
                        <tr key={inscription.id} className='hover:bg-gray-50 transition'>
                          <td className='px-4 py-3 font-mono text-xs text-gray-600'>
                            {inscription.candidat.matricule}
                          </td>
                          <td className='px-4 py-3 font-medium text-gray-800'>
                            {inscription.candidat.prenom} {inscription.candidat.nom}
                          </td>
                          <td className='px-4 py-3 text-gray-600 text-xs'>
                            {inscription.candidat.email}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            {editingNote === inscription.id ? (
                              <input
                                type='number'
                                min='0'
                                max='20'
                                step='0.25'
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                                className='w-20 px-2 py-1 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-slate-500 focus:border-transparent'
                                placeholder='0-20'
                                autoFocus
                              />
                            ) : (
                              <span className={`text-lg font-semibold ${inscription.note !== null ? 'text-slate-700' : 'text-gray-400'}`}>
                                {inscription.note !== null ? `${inscription.note}/20` : 'Absent'}
                              </span>
                            )}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center justify-center gap-2'>
                              {editingNote === inscription.id ? (
                                <>
                                  <button
                                    onClick={() => saveNote(inscription.id)}
                                    disabled={submitting}
                                    className='p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition disabled:opacity-50'
                                    title='Enregistrer'
                                  >
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    disabled={submitting}
                                    className='p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition disabled:opacity-50'
                                    title='Annuler'
                                  >
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEdit(inscription.id, inscription.note)}
                                  className='p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition'
                                  title='Modifier la note'
                                >
                                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
        </main>
      </div>
    </CommissionLayout>
  );
}
