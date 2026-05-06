import React, { useState, useEffect } from 'react';
import PiecesPredefines from './PiecesPredefines';
import PiecesPersonnalisees from './PiecesPersonnalisees';
import CustomPieceModal from './CustomPieceModal';

/**
 * Composant principal de configuration des pièces du dossier candidat
 * @param {Object} props
 * @param {Array} props.piecesRequises - Liste des pièces requises (prédéfinies + personnalisées)
 * @param {Function} props.onChange - Callback appelé lors d'un changement
 */
const PiecesConfiguration = ({ piecesRequises = [], onChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [piecesPredefines, setPiecesPredefines] = useState([]);
  const [piecesPersonnalisees, setPiecesPersonnalisees] = useState([]);

  /**
   * Sépare les pièces prédéfinies des pièces personnalisées
   */
  useEffect(() => {
    const predefines = piecesRequises.filter(p => p.predefined === true);
    const personnalisees = piecesRequises.filter(p => p.predefined === false);
    
    setPiecesPredefines(predefines);
    setPiecesPersonnalisees(personnalisees);
  }, [piecesRequises]);

  /**
   * Gère le changement des pièces prédéfinies
   */
  const handlePiecesPredefinesChange = (newPiecesPredefines) => {
    const allPieces = [...newPiecesPredefines, ...piecesPersonnalisees];
    onChange(allPieces);
  };

  /**
   * Gère l'ajout d'une pièce personnalisée
   */
  const handleAddCustomPiece = (nouvellePiece) => {
    const allPieces = [...piecesPredefines, ...piecesPersonnalisees, nouvellePiece];
    onChange(allPieces);
  };

  /**
   * Gère la suppression d'une pièce personnalisée
   */
  const handleRemoveCustomPiece = (pieceId) => {
    const newPiecesPersonnalisees = piecesPersonnalisees.filter(p => p.id !== pieceId);
    const allPieces = [...piecesPredefines, ...newPiecesPersonnalisees];
    onChange(allPieces);
  };

  return (
    <div className="space-y-6">
      {/* Pièces prédéfinies */}
      <PiecesPredefines
        piecesSelectionnees={piecesPredefines}
        onChange={handlePiecesPredefinesChange}
      />

      {/* Pièces personnalisées */}
      <PiecesPersonnalisees
        pieces={piecesPersonnalisees}
        onRemove={handleRemoveCustomPiece}
      />

      {/* Bouton d'ajout de pièce personnalisée */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter une pièce personnalisée
        </button>
      </div>

      {/* Modal d'ajout de pièce personnalisée */}
      <CustomPieceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddCustomPiece}
      />
    </div>
  );
};

export default PiecesConfiguration;
