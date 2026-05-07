// src/components/DocumentViewer.jsx
import { useState } from 'react';

export default function DocumentViewer({ isOpen, onClose, documentUrl, documentType, documentName }) {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  const isPDF = documentUrl?.toLowerCase().endsWith('.pdf') || documentType === 'application/pdf';
  const isImage = documentUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || documentType?.startsWith('image/');

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h3 className='text-lg font-bold text-gray-900'>{documentName || 'Document'}</h3>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition'
          >
            <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-4 bg-gray-50'>
          {loading && (
            <div className='flex items-center justify-center h-full'>
              <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
            </div>
          )}

          {isImage && (
            <div className='flex items-center justify-center h-full'>
              <img
                src={documentUrl}
                alt={documentName}
                className='max-w-full max-h-full object-contain rounded-lg shadow-lg'
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}

          {isPDF && (
            <iframe
              src={documentUrl}
              className='w-full h-full min-h-[600px] rounded-lg'
              title={documentName}
              onLoad={() => setLoading(false)}
            />
          )}

          {!isImage && !isPDF && (
            <div className='flex flex-col items-center justify-center h-full text-center'>
              <svg className='w-16 h-16 text-gray-400 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              <p className='text-gray-600 mb-4'>Impossible d afficher ce type de fichier</p>
              <a
                href={documentUrl}
                download
                className='bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition'
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-4 border-t border-gray-200 bg-white'>
          <a
            href={documentUrl}
            download
            className='text-blue-900 hover:underline text-sm font-medium flex items-center gap-2'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            Télécharger
          </a>
          <button
            onClick={onClose}
            className='bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium'
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
