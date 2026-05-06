# Ajout Frais de Participation et Quittance par Concours

## Date : 6 mai 2026

## Fonctionnalité

Chaque concours a maintenant :
1. **Frais de participation** (montant en FCFA)
2. **Quittance spécifique** par inscription (différente de la quittance générale du dossier)

Le candidat doit uploader une quittance de paiement après s'être inscrit à un concours.

## Modifications effectuées

### 1. Base de données (Prisma Schema)

✅ **Fichier** : `unipath-api/prisma/schema.prisma`

**Modèle Concours** - Ajout du champ `fraisParticipation` :
```prisma
model Concours {
  id String @id @default(uuid())
  libelle String
  dateDebut DateTime
  dateFin DateTime
  description String?
  fraisParticipation Int? // Frais de participation au concours (en FCFA)
  createdAt DateTime @default(now())
  inscriptions Inscription[]
}
```

**Modèle Inscription** - Ajout du champ `quittanceUrl` :
```prisma
model Inscription {
  id String @id @default(uuid())
  candidatId String
  concoursId String
  statut StatutDossier @default(EN_ATTENTE)
  quittanceUrl String? // URL de la quittance de paiement spécifique à cette inscription
  createdAt DateTime @default(now())
  candidat Candidat @relation(fields: [candidatId], references: [id])
  concours Concours @relation(fields: [concoursId], references: [id])
  @@unique([candidatId, concoursId])
}
```

✅ **Migration** : `npx prisma db push` exécuté avec succès

### 2. Backend (API)

✅ **Fichier** : `unipath-api/src/controllers/inscription.controller.js`

**Nouvelle fonction** : `uploadQuittanceInscription`
```javascript
exports.uploadQuittanceInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    // Vérifier que l'inscription appartient bien au candidat
    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId: candidatId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const quittanceUrl = req.file.path;

    // Mettre à jour l'inscription avec l'URL de la quittance
    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { quittanceUrl },
    });

    res.json({
      message: 'Quittance uploadée avec succès',
      quittanceUrl,
      inscription: updated,
    });
  } catch (error) {
    console.error('Erreur upload quittance inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

✅ **Fichier** : `unipath-api/src/routes/inscription.routes.js`

**Nouvelle route** :
```javascript
router.post('/:inscriptionId/quittance', protect, upload.single('quittance'), inscriptionController.uploadQuittanceInscription);
```

### 3. Frontend - Service API

✅ **Fichier** : `unipath-front/src/services/api.js`

**Nouvelle méthode** dans `inscriptionService` :
```javascript
uploadQuittance: async (inscriptionId, fichier) => {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('quittance', fichier);

  const response = await fetch(`${BASE_URL}/inscriptions/${inscriptionId}/quittance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
},
```

### 4. Frontend - Page DetailConcours

✅ **Fichier** : `unipath-front/src/pages/DetailConcours.jsx`

**Affichage des frais de participation** :
```jsx
{concours.fraisParticipation && (
  <div className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
    <div className='flex items-center gap-3'>
      <div className='w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white'>
        <svg>...</svg>
      </div>
      <div>
        <p className='text-xs text-orange-600 font-medium'>Frais de participation</p>
        <p className='text-2xl font-black text-orange-900'>
          {concours.fraisParticipation.toLocaleString('fr-FR')} FCFA
        </p>
      </div>
    </div>
  </div>
)}
```

**Section upload de quittance** (après inscription) :
```jsx
{concours.fraisParticipation && (
  <div className='bg-white border border-gray-200 rounded-xl p-5'>
    <div className='flex items-center gap-3 mb-4'>
      <svg>...</svg>
      <div>
        <h3 className='font-bold text-gray-900'>Quittance de paiement</h3>
        <p className='text-xs text-gray-500'>
          Montant : {concours.fraisParticipation.toLocaleString('fr-FR')} FCFA
        </p>
      </div>
    </div>

    {inscription.quittanceUrl ? (
      // Quittance déjà uploadée
      <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
        <span className='text-sm font-medium text-green-700'>Quittance déposée</span>
        <button>Modifier</button>
      </div>
    ) : (
      // Zone d'upload
      <label className='block cursor-pointer'>
        <div className='border-2 border-dashed border-orange-300 rounded-lg p-4'>
          <p>Cliquez pour uploader votre quittance</p>
          <p className='text-xs text-gray-500'>Format PDF uniquement</p>
        </div>
        <input type='file' accept='.pdf' onChange={handleUploadQuittance} />
      </label>
    )}
  </div>
)}
```

**Fonction d'upload** :
```javascript
const handleUploadQuittance = async (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;

  // Vérifier que c'est un PDF
  if (fichier.type !== 'application/pdf') {
    showMessage('La quittance doit être au format PDF.', 'error');
    return;
  }

  setUploadingQuittance(true);
  try {
    await inscriptionService.uploadQuittance(inscription.id, fichier);
    showMessage('Quittance uploadée avec succès !', 'success');
    // Recharger les données
    const updated = await candidatService.getProfil();
    setCandidат(updated);
    const inscriptionExistante = updated.inscriptions?.find(i => i.concoursId === concours.id);
    if (inscriptionExistante) setInscription(inscriptionExistante);
  } catch (err) {
    showMessage('Erreur lors de l\'upload de la quittance.', 'error');
  } finally {
    setUploadingQuittance(false);
  }
};
```

## Workflow

### 1. Avant l'inscription
Le candidat voit :
- Les informations du concours
- **Les frais de participation** (si définis)
- Les critères et matières
- Le bouton "Soumettre mon dossier"

### 2. Après l'inscription
Le candidat voit :
- Message "Inscription réussie"
- **Section Quittance** (si frais définis) :
  - Montant à payer
  - Zone d'upload (drag & drop ou clic)
  - Format accepté : PDF uniquement
- Bouton "Télécharger ma fiche de pré-inscription"
- Statut du dossier (En cours d'analyse / Validé / Rejeté)

### 3. Upload de la quittance
- Le candidat clique sur la zone d'upload
- Sélectionne un fichier PDF
- Le fichier est uploadé vers Supabase Storage
- L'URL est enregistrée dans `inscription.quittanceUrl`
- Message de succès affiché
- La section affiche "Quittance déposée" avec possibilité de modifier

## Différence avec la quittance du dossier

### Quittance du dossier (`dossier.quittance`)
- **Unique** pour le candidat
- Fait partie du dossier général
- Requise pour compléter le profil
- Utilisée pour toutes les inscriptions

### Quittance d'inscription (`inscription.quittanceUrl`)
- **Spécifique** à chaque concours
- Liée à une inscription particulière
- Uploadée après l'inscription
- Montant correspond aux frais du concours

## Format des données

### Frais de participation
- **Type** : Integer (optionnel)
- **Unité** : FCFA (Franc CFA)
- **Affichage** : Formaté avec séparateurs de milliers (ex: "5 000 FCFA")
- **Valeur** : `null` si pas de frais

### Quittance URL
- **Type** : String (optionnel)
- **Format** : URL vers Supabase Storage
- **Exemple** : `https://[...].supabase.co/storage/v1/object/public/dossiers-candidats/[...]`
- **Valeur** : `null` si pas encore uploadée

## Tests à effectuer

### 1. Affichage des frais
- [ ] Créer un concours avec frais de participation
- [ ] Vérifier l'affichage sur la page détail du concours
- [ ] Vérifier le formatage (séparateurs de milliers)

### 2. Upload de quittance
- [ ] S'inscrire à un concours avec frais
- [ ] Vérifier que la section quittance s'affiche
- [ ] Uploader un PDF
- [ ] Vérifier le message de succès
- [ ] Vérifier que "Quittance déposée" s'affiche

### 3. Modification de quittance
- [ ] Cliquer sur "Modifier"
- [ ] Uploader un nouveau PDF
- [ ] Vérifier que l'ancienne quittance est remplacée

### 4. Validation
- [ ] Essayer d'uploader un fichier non-PDF (doit être refusé)
- [ ] Vérifier que seul le propriétaire peut uploader
- [ ] Vérifier que l'URL est bien enregistrée en base

### 5. Concours sans frais
- [ ] Créer un concours sans frais
- [ ] Vérifier que la section quittance ne s'affiche pas
- [ ] Vérifier que l'inscription fonctionne normalement

## Fichiers modifiés

### Backend
1. `unipath-api/prisma/schema.prisma` - Ajout des champs
2. `unipath-api/src/controllers/inscription.controller.js` - Fonction d'upload
3. `unipath-api/src/routes/inscription.routes.js` - Nouvelle route

### Frontend
1. `unipath-front/src/services/api.js` - Méthode uploadQuittance
2. `unipath-front/src/pages/DetailConcours.jsx` - Affichage et upload

## Statut

✅ **TERMINÉ** - Tous les fichiers ont été modifiés et la base de données a été mise à jour.

## Prochaines étapes (optionnel)

- [ ] Ajouter une page pour que la commission voie les quittances
- [ ] Ajouter une validation de la quittance par la commission
- [ ] Générer des statistiques sur les paiements
- [ ] Envoyer un email de rappel si quittance non déposée
