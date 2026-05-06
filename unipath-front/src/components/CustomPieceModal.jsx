import React, { useState } from 'react';

/**
 * Formats de fichiers disponibles
 */
const FORMATS_DISPONIBLES = ['PDF', 'JPEG', 'PNG', 'DOC', 'DOCX'];

/**
 * Composant modal pour ajouter une pièce personnalisée
 * @param {Object} props
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {Function} props.onClose - Callback pour fermer le modal
 * @param {Function} props.onSubmit - Callback appelé lors de la soumission
 */
const CustomPieceModal = ({ isOpen, onClose, onSubmit }) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [formatsSelectionnes, setFormatsSelectionnes] = useState([]);
  const [errors, setErrors] = useState({});

  /**
   * Réinitialise le formulaire
   */
  const resetForm = () => {
    setNom('');
    setDescription('');
    setFormatsSelectionnes([]);
    setErrors({});
  };

  /**
   * Gère la fermeture du modal
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Gère la sélection/désélection d'un format
   */
  const handleToggleFormat = (format) => {
    if (formatsSelectionnes.includes(format)) {
      setFormatsSelectionnes(formatsSelectionnes.filter(f => f !== format));
    } else {
      setFormatsSelectionnes([...formatsSelectionnes, format]);
    }
  };

  /**
   * Valide le formulaire
   */
  const validateForm = () => {
    const newErrors = {};

    if (!nom || nom.trim() === '') {
      newErrors.nom = 'Le nom de la pièce est obligatoire';
    }

    if (formatsSelectionnes.length === 0) {
      newErrors.formats = 'Veuillez sélectionner au moins un format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Créer l'objet pièce personnalisée
    const nouvellePiece = {
      id: `custom-${Date.now()}`,
      nom: nom.trim(),
      obligatoire: true,
      formats: formatsSelectionnes,
      predefined: false,
      description: description.trim() || undefined
    };

    onSubmit(nouvellePiece);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Ajouter une pièce personnalisée
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom de la pièce */}
            <div>
              <label
                htmlFor="nom-piece"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom de la pièce <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nom-piece"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nom ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Certificat médical"
              />
              {errors.nom && (
                <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
              )}
            </div>

            {/* Description (optionnel) */}
            <div>
              <label
                htmlFor="description-piece"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (optionnel)
              </label>
              <textarea
                id="description-piece"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Certificat médical de moins de 3 mois"
              />
            </div>

            {/* Formats acceptés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formats acceptés <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {FORMATS_DISPONIBLES.map((format) => {
                  const isSelected = formatsSelectionnes.includes(format);
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleToggleFormat(format)}
                      className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {format}
                    </button>
                  );
                })}
              </div>
              {errors.formats && (
                <p className="mt-1 text-sm text-red-600">{errors.formats}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomPieceModal;
