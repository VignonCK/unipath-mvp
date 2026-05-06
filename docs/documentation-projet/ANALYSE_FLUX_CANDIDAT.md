# 📊 Analyse du Flux Candidat UniPath

## ✅ État actuel de l'implémentation

### 1. Création de compte ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

#### ✅ Ce qui fonctionne :
- Formulaire d'inscription en 2 étapes (Register.jsx)
- Champs collectés : nom, prénom, sexe, nationalité, téléphone, date de naissance, lieu de naissance
- Création du compte via Supabase Auth
- Email de bienvenue envoyé après inscription
- Redirection vers login avec message de confirmation

#### ❌ Ce qui manque :
1. **Identifiant ANIP** : Non collecté dans le formulaire
2. **Série du cursus scolaire** : Non collecté (C, D, A, etc.)
3. **Email de confirmation** : Pas d'email séparé de confirmation (seulement bienvenue)
4. **Confirmation obligatoire** : Le candidat peut se connecter sans confirmer son email
5. **Champ `serie` manquant** dans le modèle `Candidat` du schema Prisma
6. **Champ `anip` manquant** dans le modèle `Candidat` du schema Prisma

#### 📝 Fichiers concernés :
- `unipath-front/src/pages/Register.jsx` - Formulaire d'inscription
- `unipath-api/src/controllers/auth.controller.js` - Controller d'authentification
- `unipath-api/prisma/schema.prisma` - Schéma de base de données
- `unipath-api/src/services/email.service.js` - Service d'envoi d'emails

---

### 2. Espace Candidat ✅ **BIEN IMPLÉMENTÉ**

#### ✅ Ce qui fonctionne :
- Dashboard candidat complet (DashboardCandidat.jsx)
- Affichage du profil avec toutes les informations
- Upload des pièces justificatives :
  - Photo d'identité
  - Relevé de notes
  - Acte de naissance
  - Carte d'identité
- Notification persistante si dossier incomplet
- Alerte si profil incomplet (téléphone, date/lieu de naissance)
- Composant `DossierCompletion` pour suivre la complétude
- Modification du profil via modale

#### ⚠️ Points d'attention :
- La "quittance" est mentionnée dans le code mais n'est pas dans la liste des pièces du dossier de base
- Confusion entre "photo d'identité" (image) et "photo" dans le dossier

#### 📝 Fichiers concernés :
- `unipath-front/src/pages/DashboardCandidat.jsx` - Dashboard principal
- `unipath-front/src/components/DossierCompletion.jsx` - Suivi de complétude
- `unipath-api/src/controllers/dossier.controller.js` - Upload des pièces

---

### 3. Inscription à un concours ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

#### ✅ Ce qui fonctionne :
- Page de liste des concours (PageConcours.jsx)
- Affichage de tous les concours disponibles
- Vérification du dossier complet avant inscription
- Vérification du profil complet avant inscription
- Génération d'une inscription avec statut EN_ATTENTE
- Envoi d'email de pré-inscription avec PDF
- Empêche l'inscription si dossier incomplet

#### ❌ Ce qui manque :
1. **Filtrage par série** : Tous les concours sont affichés, pas de filtrage selon la série du candidat
2. **Champ `series` manquant** dans le modèle `Concours` (pour définir les séries acceptées)
3. **Numéro d'inscription unique** : Utilise l'ID UUID, pas un format personnalisé
4. **Affichage des pièces manquantes spécifiques** : Ne montre pas les pièces supplémentaires requises par concours
5. **Pièces spécifiques aux concours** : Pas de système pour définir des pièces supplémentaires par concours

#### 📝 Fichiers concernés :
- `unipath-front/src/pages/PageConcours.jsx` - Liste des concours
- `unipath-front/src/pages/DetailConcours.jsx` - Détail d'un concours
- `unipath-api/src/controllers/inscription.controller.js` - Création d'inscription
- `unipath-api/prisma/schema.prisma` - Modèle Concours

---

### 4. Après soumission ✅ **BIEN IMPLÉMENTÉ**

#### ✅ Ce qui fonctionne :
- Inscription immédiate après soumission
- Email de pré-inscription envoyé automatiquement
- Fiche PDF générée via PHP
- Possibilité de télécharger la fiche depuis le site
- Dashboard affiche "Inscription réussie"
- Statut "EN_ATTENTE" (Dossier en cours d'étude)
- Notification in-app

#### 📝 Fichiers concernés :
- `unipath-api/src/controllers/inscription.controller.js` - Génération de la fiche
- `unipath-api/php/fiche-preinscription.php` - Génération PDF
- `unipath-api/src/services/email.service.js` - Envoi email

---

### 5. Validation commission ✅ **BIEN IMPLÉMENTÉ**

#### ✅ Ce qui fonctionne :
- Dashboard commission complet
- Validation/rejet/sous réserve des dossiers
- Génération de convocation PDF
- Envoi d'email de convocation au candidat
- Notification au candidat
- Commentaires obligatoires pour rejet et sous réserve

#### 📝 Fichiers concernés :
- `unipath-front/src/pages/DashboardCommission.jsx` - Interface commission
- `unipath-api/src/controllers/commission.controller.js` - Validation des dossiers
- `unipath-api/php/convocation.php` - Génération PDF convocation

---

## 🔧 Modifications nécessaires

### Priorité 1 : Champs manquants (CRITIQUE)

#### 1.1 Ajouter ANIP et Série au modèle Candidat

**Fichier** : `unipath-api/prisma/schema.prisma`

```prisma
model Candidat {
  id String @id @default(uuid())
  matricule String @unique
  nom String
  prenom String
  anip String? // ← AJOUTER : Identifiant ANIP
  serie String? // ← AJOUTER : Série du cursus (C, D, A, etc.)
  sexe String?
  nationalite String?
  email String @unique
  telephone String?
  dateNaiss DateTime?
  lieuNaiss String?
  emailConfirme Boolean @default(false) // ← AJOUTER : Confirmation email
  role Role @default(CANDIDAT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  inscriptions Inscription[]
  dossier Dossier?
}
```

**Migration** : `npx prisma db push`

---

#### 1.2 Ajouter séries acceptées au modèle Concours

**Fichier** : `unipath-api/prisma/schema.prisma`

```prisma
model Concours {
  id String @id @default(uuid())
  libelle String
  etablissement String?
  dateDebut DateTime
  dateFin DateTime
  dateComposition DateTime?
  description String?
  fraisParticipation Int?
  seriesAcceptees String[] // ← AJOUTER : Liste des séries acceptées (ex: ["C", "D"])
  createdAt DateTime @default(now())
  inscriptions Inscription[]
}
```

---

#### 1.3 Ajouter numéro d'inscription unique

**Fichier** : `unipath-api/prisma/schema.prisma`

```prisma
model Inscription {
  id String @id @default(uuid())
  numeroInscription String @unique // ← AJOUTER : Numéro unique (ex: UAC-2026-MED-00123)
  candidatId String
  concoursId String
  statut StatutDossier @default(EN_ATTENTE)
  quittanceUrl String?
  commentaireRejet String?
  commentaireSousReserve String?
  note Float?
  createdAt DateTime @default(now())
  candidat Candidat @relation(fields: [candidatId], references: [id])
  concours Concours @relation(fields: [concoursId], references: [id])
  @@unique([candidatId, concoursId])
}
```

---

### Priorité 2 : Formulaire d'inscription

#### 2.1 Ajouter ANIP et Série au formulaire

**Fichier** : `unipath-front/src/pages/Register.jsx`

**Modifications** :
1. Ajouter les champs dans l'état `form` :
```javascript
const [form, setForm] = useState({
  nom: "", 
  prenom: "", 
  anip: "",        // ← AJOUTER
  serie: "",       // ← AJOUTER
  sexe: "",
  nationalite: "",
  telephone: "",
  dateNaiss: "", 
  lieuNaiss: "",
  email: "", 
  password: "", 
  confirmPassword: "",
});
```

2. Ajouter les champs dans l'étape 1 :
```jsx
<div style={{ marginBottom: 14 }}>
  <Field label="Identifiant ANIP" required>
    <Input 
      value={form.anip} 
      onChange={set("anip")} 
      placeholder="ANIP123456789" 
    />
  </Field>
</div>

<div style={{ marginBottom: 14 }}>
  <Field label="Série du cursus" required>
    <Select 
      value={form.serie} 
      onChange={set("serie")}
    >
      <option value="">Sélectionner</option>
      <option value="A">Série A (Littéraire)</option>
      <option value="B">Série B (Sciences Sociales)</option>
      <option value="C">Série C (Mathématiques)</option>
      <option value="D">Série D (Sciences Expérimentales)</option>
      <option value="E">Série E (Technique)</option>
      <option value="F">Série F (Industrielle)</option>
      <option value="G">Série G (Gestion)</option>
    </Select>
  </Field>
</div>
```

3. Mettre à jour la validation :
```javascript
const handleStep1 = () => {
  if (!form.nom || !form.prenom || !form.anip || !form.serie || !form.sexe || 
      !form.nationalite || !form.telephone || !form.dateNaiss || !form.lieuNaiss) {
    setError('Tous les champs sont obligatoires');
    return;
  }
  setStep(2);
};
```

4. Envoyer les nouveaux champs au backend :
```javascript
let userData = {
  nom: form.nom,
  prenom: form.prenom,
  anip: form.anip,           // ← AJOUTER
  serie: form.serie,         // ← AJOUTER
  sexe: form.sexe,
  nationalite: form.nationalite,
  telephone: form.telephone,
  dateNaiss: form.dateNaiss,
  lieuNaiss: form.lieuNaiss,
  email: form.email,
  password: form.password,
};
```

---

#### 2.2 Mettre à jour le controller d'authentification

**Fichier** : `unipath-api/src/controllers/auth.controller.js`

```javascript
exports.register = async (req, res) => {
  try {
    const { 
      email, password, nom, prenom, anip, serie, // ← AJOUTER anip, serie
      sexe, nationalite, telephone, dateNaiss, lieuNaiss 
    } = req.body;

    // Validation ANIP (optionnel mais recommandé)
    if (anip && !/^ANIP\d{9}$/.test(anip)) {
      return res.status(400).json({ 
        error: 'Format ANIP invalide. Format attendu : ANIP123456789' 
      });
    }

    // Validation série
    const seriesValides = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    if (serie && !seriesValides.includes(serie)) {
      return res.status(400).json({ 
        error: 'Série invalide. Séries acceptées : A, B, C, D, E, F, G' 
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL}/auth/callback`,
        }
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const candidat = await prisma.candidat.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        anip: anip || null,           // ← AJOUTER
        serie: serie || null,         // ← AJOUTER
        sexe: sexe || null,
        nationalite: nationalite || null,
        telephone,
        dateNaiss: dateNaiss ? new Date(dateNaiss) : null,
        lieuNaiss: lieuNaiss || null,
        matricule: 'TEMP',
        emailConfirme: false,         // ← AJOUTER
      },
    });

    // Envoyer l'email de confirmation
    try {
      await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationUrl: `${process.env.APP_URL}/auth/confirm?token=${authData.user.id}`
      });
    } catch (emailError) {
      console.error('Erreur envoi email de confirmation:', emailError);
    }

    // Envoyer l'email de bienvenue
    try {
      await emailService.envoyerEmailBienvenue({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        matricule: candidat.matricule
      });
    } catch (emailError) {
      console.error('Erreur envoi email de bienvenue:', emailError);
    }

    res.status(201).json({
      message: 'Compte créé avec succès. Vérifiez votre email pour confirmer votre compte.',
      matricule: candidat.matricule,
      emailConfirmationRequired: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

---

### Priorité 3 : Email de confirmation

#### 3.1 Ajouter la fonction d'envoi d'email de confirmation

**Fichier** : `unipath-api/src/services/email.service.js`

```javascript
/**
 * Email de confirmation de compte
 */
async envoyerEmailConfirmation(data) {
  try {
    await transporter.sendMail({
      from: `"UniPath" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '[UniPath] Confirmez votre adresse email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #008751 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎓 Bienvenue sur UniPath</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px;">
            <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
            
            <p>Merci de vous être inscrit sur UniPath ! Pour activer votre compte et accéder à votre espace candidat, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.confirmationUrl}" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Confirmer mon email
              </a>
            </div>

            <p style="color:#888; font-size:12px;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
              <a href="${data.confirmationUrl}" style="color: #3b82f6;">${data.confirmationUrl}</a>
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
              <p style="margin: 10px 0 0 0;">Ce lien est valable pendant 24 heures. Après confirmation, vous pourrez vous connecter et compléter votre dossier.</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
            <p style="color:#888; font-size:12px; text-align: center;">
              Université d'Abomey-Calavi | Année 2025-2026<br/>
              Si vous n'avez pas créé de compte, ignorez cet email.
            </p>
          </div>
        </div>
      `
    });

    console.log(`✅ Email de confirmation envoyé à ${data.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
}
```

---

### Priorité 4 : Filtrage des concours par série

#### 4.1 Filtrer les concours dans le controller

**Fichier** : `unipath-api/src/controllers/concours.controller.js`

```javascript
exports.getAllConcours = async (req, res) => {
  try {
    const userId = req.user?.id; // Si authentifié
    let candidat = null;

    // Si l'utilisateur est authentifié, récupérer sa série
    if (userId) {
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { serie: true },
      });
    }

    const concours = await prisma.concours.findMany({
      orderBy: { dateDebut: 'desc' },
    });

    // Filtrer par série si le candidat a une série définie
    let concoursFiltres = concours;
    if (candidat?.serie) {
      concoursFiltres = concours.filter(c => {
        // Si le concours n'a pas de séries définies, il est ouvert à tous
        if (!c.seriesAcceptees || c.seriesAcceptees.length === 0) {
          return true;
        }
        // Sinon, vérifier si la série du candidat est acceptée
        return c.seriesAcceptees.includes(candidat.serie);
      });
    }

    res.json(concoursFiltres);
  } catch (error) {
    console.error('Erreur getAllConcours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

---

#### 4.2 Ajouter les séries dans le formulaire de création de concours

**Fichier** : `unipath-front/src/pages/GestionConcours.jsx`

Ajouter un champ multi-select pour les séries acceptées dans le formulaire de création/édition de concours.

---

### Priorité 5 : Numéro d'inscription unique

#### 5.1 Générer un numéro unique à la création

**Fichier** : `unipath-api/src/controllers/inscription.controller.js`

```javascript
// Fonction pour générer un numéro d'inscription unique
function genererNumeroInscription(concours, candidat) {
  const annee = new Date().getFullYear();
  const codeEtablissement = 'UAC'; // Université d'Abomey-Calavi
  
  // Extraire les 3 premières lettres du concours (ex: MED pour Médecine)
  const codeConcours = concours.libelle
    .split(' ')[0]
    .substring(0, 3)
    .toUpperCase();
  
  // Générer un numéro séquentiel (timestamp + random)
  const sequence = Date.now().toString().slice(-5) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  // Format: UAC-2026-MED-12345
  return `${codeEtablissement}-${annee}-${codeConcours}-${sequence}`;
}

exports.creerInscription = async (req, res) => {
  try {
    const { concoursId } = req.body;
    const candidatId = req.user.id;

    // ... vérifications existantes ...

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
    });

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
    });

    // Générer le numéro d'inscription unique
    const numeroInscription = genererNumeroInscription(concours, candidat);

    const inscription = await prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        numeroInscription,  // ← AJOUTER
        statut: 'EN_ATTENTE',
      },
      include: { concours: true },
    });

    // ... reste du code ...
  } catch (error) {
    // ... gestion d'erreur ...
  }
};
```

---

## 📋 Checklist des modifications

### Base de données
- [ ] Ajouter champ `anip` au modèle Candidat
- [ ] Ajouter champ `serie` au modèle Candidat
- [ ] Ajouter champ `emailConfirme` au modèle Candidat
- [ ] Ajouter champ `seriesAcceptees` au modèle Concours
- [ ] Ajouter champ `numeroInscription` au modèle Inscription
- [ ] Exécuter `npx prisma db push`

### Frontend - Inscription
- [ ] Ajouter champ ANIP au formulaire Register.jsx
- [ ] Ajouter champ Série au formulaire Register.jsx
- [ ] Mettre à jour la validation du formulaire
- [ ] Envoyer les nouveaux champs au backend

### Backend - Authentification
- [ ] Accepter les champs anip et serie dans auth.controller.js
- [ ] Valider le format ANIP
- [ ] Valider la série
- [ ] Créer la fonction envoyerEmailConfirmation
- [ ] Envoyer l'email de confirmation
- [ ] Marquer emailConfirme = false par défaut

### Backend - Concours
- [ ] Filtrer les concours par série du candidat
- [ ] Permettre la définition des séries acceptées par concours
- [ ] Générer un numéro d'inscription unique

### Frontend - Concours
- [ ] Afficher uniquement les concours compatibles avec la série
- [ ] Afficher le numéro d'inscription dans le dashboard
- [ ] Ajouter un champ multi-select pour les séries dans GestionConcours.jsx

### Tests
- [ ] Tester l'inscription avec ANIP et série
- [ ] Tester le filtrage des concours par série
- [ ] Tester la génération du numéro d'inscription
- [ ] Tester l'envoi des emails de confirmation

---

## 🎯 Résumé

### ✅ Déjà fonctionnel (80%)
- Création de compte de base
- Dashboard candidat complet
- Upload des pièces justificatives
- Vérification de complétude du dossier
- Inscription aux concours
- Génération de fiche de pré-inscription
- Validation par la commission
- Génération de convocation
- Emails de notification

### ⚠️ À compléter (20%)
- Champs ANIP et Série
- Email de confirmation séparé
- Filtrage des concours par série
- Numéro d'inscription unique personnalisé
- Pièces spécifiques aux concours (optionnel)

---

**Date d'analyse** : 6 mai 2026  
**Statut global** : 80% implémenté, 20% à compléter  
**Priorité** : Ajouter les champs manquants (ANIP, série) et le filtrage des concours
