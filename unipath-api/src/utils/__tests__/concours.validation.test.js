/**
 * Tests unitaires pour les fonctions de validation des concours
 */

const {
  validateDatesDepot,
  validateDatesComposition,
  validateDatesCoherence,
  validateSeries,
  validatePiecesRequises
} = require('../concours.validation');

describe('validateDatesDepot', () => {
  test('devrait valider des dates de dépôt valides', () => {
    const result = validateDatesDepot('2026-01-15', '2026-02-28');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('devrait rejeter si la date de fin est antérieure à la date de début', () => {
    const result = validateDatesDepot('2026-02-28', '2026-01-15');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si la date de fin est égale à la date de début', () => {
    const result = validateDatesDepot('2026-01-15', '2026-01-15');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si les dates sont manquantes', () => {
    const result = validateDatesDepot(null, null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obligatoires');
  });

  test('devrait rejeter si les dates sont invalides', () => {
    const result = validateDatesDepot('invalid-date', '2026-02-28');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalides');
  });
});

describe('validateDatesComposition', () => {
  test('devrait valider des dates de composition valides', () => {
    const result = validateDatesComposition('2026-03-15', '2026-03-20');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('devrait rejeter si la date de fin est antérieure à la date de début', () => {
    const result = validateDatesComposition('2026-03-20', '2026-03-15');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si la date de fin est égale à la date de début', () => {
    const result = validateDatesComposition('2026-03-15', '2026-03-15');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si les dates sont manquantes', () => {
    const result = validateDatesComposition(null, null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obligatoires');
  });
});

describe('validateDatesCoherence', () => {
  test('devrait valider si la composition est après le dépôt', () => {
    const result = validateDatesCoherence('2026-02-28', '2026-03-15');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('devrait rejeter si la composition est avant la fin du dépôt', () => {
    const result = validateDatesCoherence('2026-03-15', '2026-02-28');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si la composition est le même jour que la fin du dépôt', () => {
    const result = validateDatesCoherence('2026-03-15', '2026-03-15');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('postérieure');
  });

  test('devrait rejeter si les dates sont manquantes', () => {
    const result = validateDatesCoherence(null, null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obligatoires');
  });
});

describe('validateSeries', () => {
  test('devrait valider des séries valides', () => {
    const result = validateSeries(['C', 'D']);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('devrait valider toutes les séries valides', () => {
    const result = validateSeries(['A', 'B', 'C', 'D', 'E', 'F1', 'F2', 'F3', 'F4', 'G']);
    expect(result.valid).toBe(true);
  });

  test('devrait valider un tableau vide (toutes séries acceptées)', () => {
    const result = validateSeries([]);
    expect(result.valid).toBe(true);
  });

  test('devrait rejeter des séries invalides', () => {
    const result = validateSeries(['C', 'Z', 'X']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalides');
    expect(result.invalidSeries).toEqual(['Z', 'X']);
  });

  test('devrait rejeter si ce n\'est pas un tableau', () => {
    const result = validateSeries('C,D');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tableau');
  });

  test('devrait rejeter si null ou undefined', () => {
    const result = validateSeries(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tableau');
  });
});

describe('validatePiecesRequises', () => {
  test('devrait valider une configuration valide avec pièces prédéfinies', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'acte-naissance',
          nom: 'Acte de naissance',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true
        },
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('devrait valider une configuration avec pièces personnalisées', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true
        },
        {
          id: 'custom-certificat',
          nom: 'Certificat médical',
          obligatoire: true,
          formats: ['PDF', 'JPEG'],
          predefined: false
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(true);
  });

  test('devrait rejeter si la quittance est absente', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'acte-naissance',
          nom: 'Acte de naissance',
          obligatoire: true,
          formats: ['PDF'],
          predefined: true
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('quittance');
  });

  test('devrait rejeter si le tableau de pièces est vide', () => {
    const piecesRequises = { pieces: [] };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Au moins une pièce');
  });

  test('devrait rejeter si une pièce n\'a pas de nom', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          formats: ['PDF']
        },
        {
          id: 'piece-sans-nom',
          nom: '',
          formats: ['PDF']
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('nom valide');
  });

  test('devrait rejeter si une pièce n\'a pas de formats', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          formats: ['PDF']
        },
        {
          id: 'piece-sans-format',
          nom: 'Pièce sans format',
          formats: []
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('au moins un format');
  });

  test('devrait rejeter si une pièce a des formats invalides', () => {
    const piecesRequises = {
      pieces: [
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          formats: ['PDF']
        },
        {
          id: 'piece-format-invalide',
          nom: 'Pièce avec format invalide',
          formats: ['PDF', 'XYZ', 'ABC']
        }
      ]
    };
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formats invalides');
  });

  test('devrait rejeter si piecesRequises n\'est pas un objet', () => {
    const result = validatePiecesRequises('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalide');
  });

  test('devrait rejeter si piecesRequises est null', () => {
    const result = validatePiecesRequises(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalide');
  });

  test('devrait accepter un tableau direct (sans wrapper pieces)', () => {
    const piecesRequises = [
      {
        id: 'quittance',
        nom: 'Quittance de paiement',
        formats: ['PDF']
      }
    ];
    const result = validatePiecesRequises(piecesRequises);
    expect(result.valid).toBe(true);
  });
});
