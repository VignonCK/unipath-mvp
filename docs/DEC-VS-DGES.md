# Séparation DEC / DGES (UniPath)

Référence rapide pour l’équipe (Phases 1–5 de la séparation).

## Qui fait quoi ?

| Rôle | Module | Responsabilités |
|------|--------|-----------------|
| **DEC** | Module 1 — Concours | CRUD concours, centres de composition, commission concours, clôture/réouverture d’étude, n° de table, dashboard stats concours (`/dashboard-dec`, `/api/dec/statistiques`) |
| **DGES** | Module 2 — Établissements privés | Création d’établissements / admins, campagnes d’inscription privées, dashboard stats campagnes (`/dashboard-dges`, `/api/dges/statistiques`) |
| **COMMISSION** | Module 1 (opérationnel) | Examens / contrôle des dossiers concours |

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `dec@test.com` | `password123` | DEC (Adjo Mensah) |
| `dges@test.com` | `password123` | DGES |

Seeds : `prisma/seed-roles.js`, `scripts/seed-dec-test-account.js`, `scripts/create-admin-accounts.js`.

## Endpoints stats

- `GET /api/dec/statistiques` → concours uniquement (`checkRole(['DEC','COMMISSION'])`)
- `GET /api/dges/statistiques` → campagnes / EP privés uniquement (`checkRole(['DGES'])`)
- `GET /api/stats/export` → Excel/PDF scopé automatiquement (DEC → M1, DGES → M2)

## Ne pas confondre

- Les routes HTTP sous `/api/dges/concours/...` (clôture étude, n° de table) restent préfixées `dges` pour compatibilité URL, mais sont **réservées au rôle DEC**.
- Les messages candidat « contactez la DGES » pour un **compte établissement privé** restent corrects (Module 2).
- Les n° de table / convocations mentionnent la **DEC**, pas la DGES.

## Docs liées

Cartographie et phases : conversation agent « séparation DEC/DGES » (Phases 1 identité → 2 routes M1 → 3 audit M2 → 4 dashboards → 5 textes/seeds).
