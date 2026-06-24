// src/pages/DetailConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

const PIECES_FORMATS = {
  photo: 'image/*',
  photo_identite: 'image/*',
  carteIdentite: '.pdf,.jpg,.jpeg,.png',
  'carte-identite': '.pdf,.jpg,.jpeg,.png',
  carte_identite: '.pdf,.jpg,.jpeg,.png',
  acteNaissance: '.pdf',
  'acte-naissance': '.pdf',
  acte_naissance: '.pdf',
  releve: '.pdf',
  'releve-notes': '.pdf',
  releve_bac: '.pdf',
  quittance: '.pdf',
};

function getSerieAliases(serie) {
  const s = String(serie || '').trim().toUpperCase();
  if (!s) return [];
  if (s === 'G') return ['G', 'G1', 'G2', 'G3'];
  if (['G1', 'G2', 'G3'].includes(s)) return [s, 'G'];
  if (s === 'F') return ['F', 'F1', 'F2', 'F3', 'F4'];
  if (['F1', 'F2', 'F3', 'F4'].includes(s)) return [s, 'F'];
  return [s];
}

function isSerieMatched(candidateSerie, serieConcours) {
  const aliases = getSerieAliases(candidateSerie);
  if (aliases.length === 0) return false;
  return aliases.includes(String(serieConcours || '').trim().toUpperCase());
}

function serieCandidatAcceptee(candidat, concours) {
  const series = concours?.seriesAcceptees;
  if (!Array.isArray(series) || series.length === 0) return true;
  return series.some((s) => isSerieMatched(candidat?.serie, s));
}

function depotEstFerme(concours) {
  const dateLimite = concours?.dateFinDepot || concours?.dateFin;
  if (!dateLimite) return false;
  return new Date() > new Date(dateLimite);
}

function depotPasEncoreOuvert(concours) {
  const dateDebut = concours?.dateDebutDepot || concours?.dateDebut;
  if (!dateDebut) return false;
  return new Date() < new Date(dateDebut);
}

function getPiecesRequisesConcours(concours) {
  const normalize = (p) => {
    const piece = typeof p === 'object' ? { ...p } : { id: p };
    return {
      ...piece,
      obligatoire: piece.obligatoire !== false,
    };
  };
  if (!concours?.piecesRequises) return [];
  const pr = concours.piecesRequises;
  if (Array.isArray(pr)) return pr.map(normalize);
  if (Array.isArray(pr.pieces)) return pr.pieces.map(normalize);
  return [];
}

function getLabelPiece(pieceObj, concours) {
  const piece = typeof pieceObj === 'object' ? pieceObj.id : pieceObj;
  if (piece === 'quittance') return 'Quittance de paiement';
  if (typeof pieceObj === 'object' && pieceObj.nom) return pieceObj.nom;
  const liste = getPiecesRequisesConcours(concours);
  const found = liste.find((p) => p.id === piece);
  if (found?.nom) return found.nom;
  return piece.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function getCriteresEligibilite(concours) {
  const rootCriteres = concours?.criteresEligibilite;
  const nestedCriteres = concours?.piecesRequises?.criteresEligibilite;
  const source = rootCriteres || nestedCriteres;
  if (!source) return [];
  const raw = Array.isArray(source) ? source : (Array.isArray(source?.criteres) ? source.criteres : []);
  return raw
    .map((item) => {
      if (typeof item === 'string') return { titre: item, description: '' };
      return { titre: item?.titre || '', description: item?.description || '' };
    })
    .filter((item) => item.titre.trim() !== '');
}

function profilIncomplet(candidat) {
  if (!candidat) return true;
  return CHAMPS_REQUIS.some((c) => !candidat[c]);
}

function getInscriptionExistante(candidat, concoursId) {
  return candidat?.inscriptions?.find((i) => i.concoursId === concoursId) || null;
}

export default function DetailConcours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [concours, setConcours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [fichiersLocaux, setFichiersLocaux] = useState({});
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);
  const [numeroInscription, setNumeroInscription] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    Promise.all([candidatService.getProfil(), concoursService.getById(id)])
      .then(([p, c]) => {
        setCandidat(p);
        setConcours(c);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
      })
      .catch((err) => {
        if (handleSessionError(err, navigate)) return;
        setErreur(err?.message || 'Impossible de charger ce concours.');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleFileChange = (e, pieceId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErreur(`Le fichier "${file.name}" dépasse la taille maximale de 5 MB.`);
      e.target.value = '';
      return;
    }

    setFichiersLocaux((prev) => ({ ...prev, [pieceId]: file }));
    setErreur(null);
    e.target.value = '';
  };

  const handleSoumettre = async () => {
    if (!concours || !candidat) return;

    const piecesList = getPiecesRequisesConcours(concours);
    const piecesObl = piecesList.filter((p) => p.obligatoire !== false);
    const estFournieLocal = (piece) =>
      piece.fournieDepuisDossier || !!fichiersLocaux[piece.id];
    const pret = piecesObl.length > 0
      && piecesObl.every((p) => estFournieLocal(p))
      && !getInscriptionExistante(candidat, concours.id)
      && serieCandidatAcceptee(candidat, concours)
      && !depotEstFerme(concours)
      && !depotPasEncoreOuvert(concours)
      && !profilIncomplet(candidat);

    if (!pret) return;

    setSoumissionEnCours(true);
    setErreur(null);

    try {
      const formData = new FormData();
      formData.append('concoursId', concours.id);

      Object.entries(fichiersLocaux).forEach(([pieceId, file]) => {
        formData.append(`piece_${pieceId}`, file);
      });

      const piecesDepuisDossier = piecesList
        .filter((p) => p.fournieDepuisDossier)
        .map((p) => p.id);
      formData.append('piecesDepuisDossier', JSON.stringify(piecesDepuisDossier));

      const result = await inscriptionService.soumettreComplet(formData);
      setNumeroInscription(result.numeroInscription || null);
      setSucces(true);
    } catch (error) {
      setErreur(error.message || 'Erreur lors de la soumission.');
    } finally {
      setSoumissionEnCours(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (!concours) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-500 mb-4'>Concours introuvable</p>
          <button onClick={() => navigate('/concours')} className='text-blue-900 hover:underline'>Retour</button>
        </div>
      </div>
    );
  }

  if (succes) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center'>
          <div className='text-green-500 text-6xl mb-4'>✓</div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>Dossier soumis !</h2>
          {numeroInscription && (
            <p className='text-sm font-mono text-green-700 mb-2'>N° {numeroInscription}</p>
          )}
          <p className='text-gray-600 mb-6'>
            Votre dossier a été soumis avec succès. Vous recevrez votre fiche de pré-inscription par email.
            La commission examinera votre dossier et vous enverra une convocation si celui-ci est validé.
          </p>
          <button
            onClick={() => navigate('/concours')}
            className='bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800'
          >
            Retour aux concours
          </button>
        </div>
      </div>
    );
  }

  const inscriptionExistante = getInscriptionExistante(candidat, concours.id);
  const pieces = getPiecesRequisesConcours(concours);
  const criteresEligibilite = getCriteresEligibilite(concours);
  const serieOk = serieCandidatAcceptee(candidat, concours);
  const depotFerme = depotEstFerme(concours);
  const depotFermeOuPasOuvert = depotFerme || depotPasEncoreOuvert(concours);

  const estFournie = (piece) =>
    piece.fournieDepuisDossier || !!fichiersLocaux[piece.id];

  const piecesObligatoires = pieces.filter((p) => p.obligatoire !== false);
  const piecesOblFournies = piecesObligatoires.filter((p) => estFournie(p));
  const pourcentage = piecesObligatoires.length > 0
    ? Math.round((piecesOblFournies.length / piecesObligatoires.length) * 100)
    : 0;
  const peutSoumettre = piecesObligatoires.length > 0
    && piecesOblFournies.length === piecesObligatoires.length
    && !inscriptionExistante
    && serieOk
    && !depotFermeOuPasOuvert
    && !profilIncomplet(candidat);

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0'>

        <button
          onClick={() => navigate('/concours')}
          className='flex items-center gap-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Retour aux concours
        </button>

        {erreur && (
          <div className='px-4 py-3 rounded-lg text-xs sm:text-sm bg-red-50 border border-red-200 text-red-700'>
            {erreur}
          </div>
        )}

        {inscriptionExistante && (
          <div className='px-4 py-3 rounded-lg text-xs sm:text-sm bg-green-50 border border-green-200 text-green-800'>
            Vous êtes déjà inscrit à ce concours
            {inscriptionExistante.numeroInscription && (
              <> — N° <span className='font-mono'>{inscriptionExistante.numeroInscription}</span></>
            )}
            .
          </div>
        )}

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 space-y-4 sm:space-y-6'>

          <div>
            <h1 className='text-2xl sm:text-3xl font-black text-gray-900 mb-2'>{concours.libelle}</h1>
            <p className='text-gray-500 text-xs sm:text-sm'>{concours.etablissement || 'Établissement non précisé'}</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='bg-gray-50 rounded-xl p-4'>
              <p className='text-xs text-gray-400 mb-1'>Dépôt des dossiers</p>
              <p className='text-sm font-medium text-gray-800'>
                {new Date(concours.dateDebutDepot || concours.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' → '}
                {new Date(concours.dateFinDepot || concours.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {concours.dateDebutComposition && (
              <div className='bg-gray-50 rounded-xl p-4'>
                <p className='text-xs text-gray-400 mb-1'>Composition</p>
                <p className='text-sm font-medium text-gray-800'>
                  {new Date(concours.dateDebutComposition).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {concours.dateFinComposition && (
                    <> → {new Date(concours.dateFinComposition).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            )}
          </div>

          {concours.seriesAcceptees?.length > 0 && (
            <div>
              <h2 className='text-sm font-bold text-gray-700 mb-2'>Séries acceptées</h2>
              <div className='flex flex-wrap gap-2'>
                {concours.seriesAcceptees.map((serie) => (
                  <span
                    key={serie}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isSerieMatched(candidat?.serie, serie)
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Série {serie}{isSerieMatched(candidat?.serie, serie) && ' ✓'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {concours.fraisParticipation != null && (
            <div className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
              <p className='text-xs text-orange-600 font-medium'>Frais de participation</p>
              <p className='text-2xl font-black text-orange-900'>
                {concours.fraisParticipation.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          )}

          {concours.description && (
            <div>
              <h2 className='text-lg font-bold text-gray-900 mb-2'>Description</h2>
              <p className='text-gray-600 text-sm'>{concours.description}</p>
            </div>
          )}

          {criteresEligibilite.length > 0 && (
            <div>
              <h2 className='text-lg font-bold text-gray-900 mb-2'>Critères d&apos;éligibilité</h2>
              <div className='space-y-2'>
                {criteresEligibilite.map((critere, index) => (
                  <div key={`${critere.titre}-${index}`} className='rounded-xl border border-blue-100 bg-blue-50 p-3'>
                    <p className='text-sm font-semibold text-blue-900'>{critere.titre}</p>
                    {critere.description && (
                      <p className='mt-1 text-xs text-blue-800'>{critere.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pièces requises */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-bold text-gray-900'>Pièces requises</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                peutSoumettre ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {piecesOblFournies.length}/{piecesObligatoires.length} obligatoire{piecesObligatoires.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className='mb-4'>
              <div className='w-full bg-gray-100 rounded-full h-2 overflow-hidden'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${peutSoumettre ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
              <p className={`text-xs mt-1 font-medium ${peutSoumettre ? 'text-green-600' : 'text-orange-600'}`}>
                {pourcentage}% — {peutSoumettre ? 'Prêt à soumettre' : 'Complétez toutes les pièces obligatoires'}
              </p>
            </div>

            <div className='space-y-2'>
              {pieces.map((piece) => {
                const fournie = estFournie(piece);
                const label = getLabelPiece(piece, concours);
                const fichierLocal = fichiersLocaux[piece.id];
                const accept = PIECES_FORMATS[piece.id] || '.pdf,.jpg,.jpeg,.png';
                const depuisDossier = piece.fournieDepuisDossier;
                const lectureSeule = inscriptionExistante || depuisDossier;

                return (
                  <div
                    key={piece.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      fournie ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        fournie ? 'bg-green-500' : 'bg-red-400'
                      }`}>
                        {fournie ? (
                          <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                          </svg>
                        ) : (
                          <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        )}
                      </div>
                      <div className='flex flex-col flex-1 min-w-0'>
                        <span className={`text-sm font-medium ${fournie ? 'text-green-800' : 'text-red-800'}`}>
                          {label}
                          {piece.obligatoire === false && (
                            <span className='ml-1 text-xs text-gray-400'>(facultatif)</span>
                          )}
                        </span>
                        {depuisDossier && (
                          <span className='text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block w-fit mt-1'>
                            Depuis votre dossier personnel
                          </span>
                        )}
                        {fichierLocal && (
                          <span className='text-xs text-blue-600 truncate mt-1' title={fichierLocal.name}>
                            📎 {fichierLocal.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-1 flex-shrink-0 ml-3'>
                      {!lectureSeule && !inscriptionExistante ? (
                        <label className='cursor-pointer'>
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            fournie
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-900 text-white hover:bg-blue-800'
                          }`}>
                            {fournie ? 'Modifier' : 'Déposer'}
                          </span>
                          <input
                            type='file'
                            accept={accept}
                            className='hidden'
                            onChange={(e) => handleFileChange(e, piece.id)}
                          />
                        </label>
                      ) : depuisDossier ? (
                        <span className='text-xs text-green-600 font-medium'>Fournie</span>
                      ) : null}
                      {!depuisDossier && !inscriptionExistante && (
                        <span className='text-xs text-gray-400'>Max 5 MB</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!serieOk && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800'>
              Votre série ({candidat?.serie || 'non renseignée'}) n&apos;est pas acceptée pour ce concours.
            </div>
          )}

          {profilIncomplet(candidat) && (
            <div className='bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800'>
              Complétez votre profil (téléphone, date et lieu de naissance) dans Mon compte avant de soumettre.
            </div>
          )}

          {depotPasEncoreOuvert(concours) && !inscriptionExistante && (
            <p className='text-orange-600 text-sm font-medium'>
              La période de dépôt ouvre le{' '}
              {new Date(concours.dateDebutDepot || concours.dateDebut).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              . Revenez à partir de cette date pour soumettre votre dossier.
            </p>
          )}

          {depotFerme && !inscriptionExistante && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800'>
              La période de dépôt est terminée.
            </div>
          )}

          {!inscriptionExistante && (
            <button
              onClick={handleSoumettre}
              disabled={!peutSoumettre || soumissionEnCours}
              className={
                peutSoumettre && !soumissionEnCours
                  ? 'w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition'
                  : 'w-full bg-gray-300 text-gray-500 py-3 rounded-xl font-semibold cursor-not-allowed'
              }
            >
              {soumissionEnCours ? 'Soumission en cours...' : 'Soumettre mon dossier'}
            </button>
          )}
        </div>
      </div>
    </CandidatLayout>
  );
}
