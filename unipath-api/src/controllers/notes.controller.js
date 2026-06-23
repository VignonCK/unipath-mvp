const prisma = require('../prisma');

const calculerMoyenneNote = (noteCC, noteExamen) => {
  const ccValide = typeof noteCC === 'number';
  const examValide = typeof noteExamen === 'number';
  if (!ccValide || !examValide) return null;
  return Number((noteCC * 0.4 + noteExamen * 0.6).toFixed(2));
};

const calculerMoyenneGeneralePonderee = (notes) => {
  const notesValides = notes.filter((n) => typeof n.noteMoyenne === 'number' && n.credits > 0);
  const totalCredits = notesValides.reduce((sum, n) => sum + n.credits, 0);
  if (!totalCredits) return { moyenneGenerale: null, totalCredits: 0 };

  const totalPondere = notesValides.reduce((sum, n) => sum + (n.noteMoyenne * n.credits), 0);
  return {
    moyenneGenerale: Number((totalPondere / totalCredits).toFixed(2)),
    totalCredits,
  };
};

exports.ajouterNote = async (req, res) => {
  try {
    const {
      inscriptionAcadId,
      matiere,
      noteCC,
      noteExamen,
      credits,
      semestre,
    } = req.body;

    if (!inscriptionAcadId || !matiere || !credits || !semestre) {
      return res.status(400).json({ error: 'inscriptionAcadId, matiere, credits et semestre sont requis' });
    }

    const semestreNumber = Number(semestre);
    if (![1, 2].includes(semestreNumber)) {
      return res.status(400).json({ error: 'Le semestre doit etre 1 ou 2' });
    }

    const note = await prisma.note.create({
      data: {
        inscriptionAcadId,
        matiere,
        noteCC: noteCC ?? null,
        noteExamen: noteExamen ?? null,
        noteMoyenne: calculerMoyenneNote(noteCC, noteExamen),
        credits: Number(credits),
        semestre: semestreNumber,
      },
    });

    return res.status(201).json({
      message: 'Note ajoutee avec succes',
      note,
    });
  } catch (error) {
    console.error('Erreur ajouterNote:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getNotesByInscription = async (req, res) => {
  try {
    const { id } = req.params;

    const inscription = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes);

    return res.json({
      message: 'Notes recuperees avec succes',
      notes: inscription.notes,
      moyenneGenerale,
      totalCredits,
    });
  } catch (error) {
    console.error('Erreur getNotesByInscription:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { matiere, noteCC, noteExamen, credits, semestre } = req.body;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Note non trouvee' });
    }

    const semestreNumber = semestre !== undefined ? Number(semestre) : undefined;
    if (semestreNumber !== undefined && ![1, 2].includes(semestreNumber)) {
      return res.status(400).json({ error: 'Le semestre doit etre 1 ou 2' });
    }

    const mergedNoteCC = noteCC !== undefined ? noteCC : existing.noteCC;
    const mergedNoteExamen = noteExamen !== undefined ? noteExamen : existing.noteExamen;

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(matiere !== undefined ? { matiere } : {}),
        ...(noteCC !== undefined ? { noteCC } : {}),
        ...(noteExamen !== undefined ? { noteExamen } : {}),
        ...(credits !== undefined ? { credits: Number(credits) } : {}),
        ...(semestreNumber !== undefined ? { semestre: semestreNumber } : {}),
        noteMoyenne: calculerMoyenneNote(mergedNoteCC, mergedNoteExamen),
      },
    });

    return res.json({
      message: 'Note mise a jour avec succes',
      note,
    });
  } catch (error) {
    console.error('Erreur updateNote:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

