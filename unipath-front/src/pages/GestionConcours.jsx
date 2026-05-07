// src/pages/GestionConcours.jsx
import { useState, useEffect } from 'react';
import { concoursService } from '../services/api';
import PiecesConfiguration from '../components/PiecesConfiguration';
import DGESLayout from '../components/DGESLayout';

export default function GestionConcours() {
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConcours, setEditingConcours] = useState(null);
  const [formData, setFormData] = useState({
    libelle: '',
    etablissement: '',
    dateDebut: '',
    dateFin: '',
    dateComposition: '',
    description: '',
    fraisParticipation: '',
    seriesAcceptees: [],
    matieres: [],
    piecesRequises: [],
    dateDebutDepot: '',
    dateFinDepot: '',
    dateDebutComposition: '',
    dateFinComposition: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadConcours();
  }, []);

  const loadConcours = async () => {
    try {
      setLoading(true);
      const data = await concoursService.getAll();
      setConcours(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingConcours(null);
    setFormData({
      libelle: '',
      etablissement: '',
      dateDebut: '',
      dateFin: '',
      dateComposition: '',
      description: '',
      fraisParticipation: '',
      seriesAcceptees: [],
      matieres: [],
      piecesRequises: [
        // Quittance obligatoire par défaut
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true,
          description: 'Reçu de paiement des frais de participation'
        }
      ],
      dateDebutDepot: '',
      dateFinDepot: '',
      dateDebutComposition: '',
      dateFinComposition: '',
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingConcours(c);
    
    // Extraire les pièces requises
    let piecesRequises = [];
    if (c.piecesRequises) {
      piecesRequises = c.piecesRequises.pieces || c.piecesRequises;
    }
    
    setFormData({
      libelle: c.libelle,
      etablissement: c.etablissement || '',
      dateDebut: c.dateDebut.split('T')[0],
      dateFin: c.dateFin.split('T')[0],
      dateComposition: c.dateComposition ? c.dateComposition.split('T')[0] : '',
      description: c.description || '',
      fraisParticipation: c.fraisParticipation || '',
      seriesAcceptees: c.seriesAcceptees || [],
      piecesRequises: piecesRequises.length > 0 ? piecesRequises : [
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true,
          description: 'Reçu de paiement des frais de participation'
        }
      ],
      dateDebutDepot: c.dateDebutDepot ? c.dateDebutDepot.split('T')[0] : '',
      dateFinDepot: c.dateFinDepot ? c.dateFinDepot.split('T')[0] : '',
      dateDebutComposition: c.dateDebutComposition ? c.dateDebutComposition.split('T')[0] : '',
      dateFinComposition: c.dateFinComposition ? c.dateFinComposition.split('T')[0] : '',
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    // Champs obligatoires
    if (!formData.libelle || formData.libelle.trim() === '') {
      errors.libelle = 'Le libellé est obligatoire';
    }
    if (!formData.etablissement || formData.etablissement.trim() === '') {
      errors.etablissement = "L'établissement est obligatoire";
    }
    if (!formData.dateDebutDepot) {
      errors.dateDebutDepot = 'La date de début de dépôt est obligatoire';
    }
    if (!formData.dateFinDepot) {
      errors.dateFinDepot = 'La date de fin de dépôt est obligatoire';
    }
    if (!formData.dateDebutComposition) {
      errors.dateDebutComposition = 'La date de début de composition est obligatoire';
    }
    if (!formData.dateFinComposition) {
      errors.dateFinComposition = 'La date de fin de composition est obligatoire';
    }
    if (!formData.fraisParticipation) {
      errors.fraisParticipation = 'Les frais de participation sont obligatoires';
    }
    if (!formData.seriesAcceptees || formData.seriesAcceptees.length === 0) {
      errors.seriesAcceptees = 'Au moins une série doit être sélectionnée';
    }

    // Validation des dates de dépôt
    if (formData.dateDebutDepot && formData.dateFinDepot) {
      const debut = new Date(formData.dateDebutDepot);
      const fin = new Date(formData.dateFinDepot);
      if (fin <= debut) {
        errors.dateFinDepot = 'La date de fin de dépôt doit être postérieure à la date de début';
      }
    }

    // Validation des dates de composition
    if (formData.dateDebutComposition && formData.dateFinComposition) {
      const debut = new Date(formData.dateDebutComposition);
      const fin = new Date(formData.dateFinComposition);
      if (fin <= debut) {
        errors.dateFinComposition = 'La date de fin de composition doit être postérieure à la date de début';
      }
    }

    // Validation cohérence dépôt/composition
    if (formData.dateFinDepot && formData.dateDebutComposition) {
      const finDepot = new Date(formData.dateFinDepot);
      const debutCompo = new Date(formData.dateDebutComposition);
      if (debutCompo <= finDepot) {
        errors.dateDebutComposition = 'La date de début de composition doit être postérieure à la date de fin de dépôt';
      }
    }

    // Validation des pièces
    if (!formData.piecesRequises || formData.piecesRequises.length === 0) {
      errors.piecesRequises = 'Au moins une pièce doit être sélectionnée';
    } else {
      // Vérifier que la quittance est présente
      const hasQuittance = formData.piecesRequises.some(p => p.id === 'quittance');
      if (!hasQuittance) {
        errors.piecesRequises = 'La quittance de paiement est obligatoire';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingConcours) {
        const response = await concoursService.update(editingConcours.id, formData);
        // Afficher un avertissement si présent
        if (response.warning) {
          alert(response.warning);
        }
      } else {
        await concoursService.create(formData);
      }
      setShowModal(false);
      loadConcours();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, libelle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le concours "${libelle}" ?`)) return;

    try {
      await concoursService.delete(id);
      loadConcours();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <DGESLayout>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement...</p>
        </div>
      </div>
    </DGESLayout>
  );

  return (
    <DGESLayout>
      <div className='max-w-6xl mx-auto px-4 py-6 space-y-6'>
        {/* HEADER SECTION */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-black text-gray-800'>Gestion des concours</h1>
            <p className='text-sm text-gray-500 mt-1'>{concours.length} concours au total</p>
          </div>
          <button
            onClick={openCreateModal}
            className='flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition shadow-sm'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            Nouveau concours
          </button>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
            {error}
          </div>
        )}

        {/* LISTE DES CONCOURS */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[640px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Libellé</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Établissement</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Date début</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Date fin</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Date composition</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Frais</th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {concours.length === 0 ? (
                  <tr>
                    <td colSpan='7' className='px-4 py-10 text-center text-gray-400'>
                      Aucun concours créé. Cliquez sur "Nouveau concours" pour commencer.
                    </td>
                  </tr>
                ) : (
                  concours.map((c) => (
                    <tr key={c.id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3 font-medium text-gray-800'>{c.libelle}</td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>{c.etablissement || '-'}</td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {new Date(c.dateDebut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 text-gray-600 text-xs'>
                        {c.dateComposition ? new Date(c.dateComposition).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className='px-4 py-3 text-gray-700 font-semibold'>
                        {c.fraisParticipation ? `${c.fraisParticipation} FCFA` : '-'}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-center gap-2'>
                          <button
                            onClick={() => openEditModal(c)}
                            className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition'
                            title='Modifier'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.libelle)}
                            className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition'
                            title='Supprimer'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CRÉATION/ÉDITION */}
        {showModal && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
              <h2 className='text-lg font-bold text-gray-800'>
                {editingConcours ? 'Modifier le concours' : 'Nouveau concours'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className='p-1 hover:bg-gray-100 rounded-lg transition'
              >
                <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              {/* Erreurs de validation globales */}
              {Object.keys(validationErrors).length > 0 && (
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
                  <p className='font-semibold mb-1'>Veuillez corriger les erreurs suivantes :</p>
                  <ul className='list-disc list-inside space-y-1'>
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Libellé <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.libelle ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder='Ex: Concours ENS 2026'
                />
                {validationErrors.libelle && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.libelle}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Établissement organisateur <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  value={formData.etablissement}
                  onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.etablissement ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Ex: EPAC - Université d'Abomey-Calavi"
                />
                {validationErrors.etablissement && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.etablissement}</p>
                )}
              </div>

              {/* Dates de dépôt */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>Période de dépôt des dossiers</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date début dépôt <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateDebutDepot}
                      onChange={(e) => setFormData({ ...formData, dateDebutDepot: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateDebutDepot ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateDebutDepot && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateDebutDepot}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date fin dépôt <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateFinDepot}
                      onChange={(e) => setFormData({ ...formData, dateFinDepot: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateFinDepot ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateFinDepot && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateFinDepot}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates de composition */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>Période de composition</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date début composition <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateDebutComposition}
                      onChange={(e) => setFormData({ ...formData, dateDebutComposition: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateDebutComposition ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateDebutComposition && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateDebutComposition}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Date fin composition <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      required
                      value={formData.dateFinComposition}
                      onChange={(e) => setFormData({ ...formData, dateFinComposition: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        validationErrors.dateFinComposition ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {validationErrors.dateFinComposition && (
                      <p className='mt-1 text-xs text-red-600'>{validationErrors.dateFinComposition}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Frais de participation (FCFA) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  min='0'
                  required
                  value={formData.fraisParticipation}
                  onChange={(e) => setFormData({ ...formData, fraisParticipation: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    validationErrors.fraisParticipation ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder='Ex: 5000'
                />
                {validationErrors.fraisParticipation && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.fraisParticipation}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Séries acceptées <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-4 gap-2'>
                  {['A', 'B', 'C', 'D', 'E', 'F1', 'F2', 'F3', 'F4', 'G'].map(serie => (
                    <label key={serie} className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formData.seriesAcceptees.includes(serie)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, seriesAcceptees: [...formData.seriesAcceptees, serie] });
                          } else {
                            setFormData({ ...formData, seriesAcceptees: formData.seriesAcceptees.filter(s => s !== serie) });
                          }
                        }}
                        className='w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500'
                      />
                      <span className='text-sm font-medium text-gray-700'>Série {serie}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.seriesAcceptees && (
                  <p className='mt-1 text-xs text-red-600'>{validationErrors.seriesAcceptees}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  rows='3'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none'
                  placeholder='Description du concours...'
                />
              </div>

              {/* Configuration des pièces */}
              <div className='border-t pt-4'>
                <h3 className='text-sm font-bold text-gray-800 mb-3'>
                  Pièces requises <span className='text-red-500'>*</span>
                </h3>
                <PiecesConfiguration
                  piecesRequises={formData.piecesRequises}
                  onChange={(pieces) => {
                    console.log('=== ONCHANGE PIECES APPELÉ ===');
                    console.log('Nombre de pièces reçues:', pieces.length);
                    console.log('Pièces reçues:', pieces);
                    console.log('formData.piecesRequises AVANT:', formData.piecesRequises);
                    
                    setFormData(prev => {
                      const newFormData = {
                        ...prev,
                        piecesRequises: pieces
                      };
                      console.log('formData.piecesRequises APRÈS:', newFormData.piecesRequises);
                      return newFormData;
                    });
                  }}
                />
                {validationErrors.piecesRequises && (
                  <p className='mt-2 text-xs text-red-600'>{validationErrors.piecesRequises}</p>
                )}
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition'
                >
                  Annuler
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50'
                >
                  {submitting ? 'Enregistrement...' : editingConcours ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>
    </DGESLayout>
  );
}
