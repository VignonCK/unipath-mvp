const {
  computeInscriptionCompletude,
  profilCandidatComplet,
} = require('../dossier-submission.helper');

describe('dossier-submission.helper', () => {
  const inscriptionComplete = {
    candidat: {
      telephone: '90000000',
      dateNaiss: new Date('2000-01-01'),
      lieuNaiss: 'Cotonou',
      dossier: {
        acteNaissance: 'url1',
        carteIdentite: 'url2',
        photo: 'url3',
        releve: 'url4',
      },
    },
    concours: {
      piecesRequises: {
        pieces: [
          { id: 'acteNaissance', nom: 'Acte' },
          { id: 'quittance', nom: 'Quittance' },
        ],
      },
    },
    dossierInscription: {
      quittanceUrl: 'url-q',
      piecesExtras: {},
    },
  };

  it('calcule 100% quand toutes les pièces sont présentes', () => {
    const r = computeInscriptionCompletude(inscriptionComplete);
    expect(r.estComplet).toBe(true);
    expect(r.pourcentage).toBe(100);
    expect(r.piecesManquantes).toHaveLength(0);
  });

  it('détecte la quittance manquante', () => {
    const r = computeInscriptionCompletude({
      ...inscriptionComplete,
      dossierInscription: { quittanceUrl: null, piecesExtras: {} },
    });
    expect(r.estComplet).toBe(false);
    expect(r.piecesManquantes).toContain('quittance');
  });

  it('valide le profil candidat complet', () => {
    expect(profilCandidatComplet(inscriptionComplete.candidat)).toBe(true);
    expect(profilCandidatComplet({ telephone: 'x' })).toBe(false);
  });
});
