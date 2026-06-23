import { test, expect } from '@playwright/test';
import { setupMockApi } from './helpers/mock-api.js';
import { seedStudentSession } from './helpers/auth.js';

test.describe('Dashboard étudiant', () => {
  test('affiche la bannière dossier incomplet quand complétude < 100 %', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: false });
    await seedStudentSession(page);
    await page.goto('/dashboard');

    await expect(page.getByText('Complétez votre dossier personnel')).toBeVisible();
    await expect(page.getByText(/complété à 25\s*%/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Compléter mon dossier' })).toHaveAttribute('href', '/mon-compte');
  });

  test('masque la bannière quand le dossier est complet', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true });
    await seedStudentSession(page);
    await page.goto('/dashboard');

    await expect(page.getByText('Complétez votre dossier personnel')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Participer à un concours/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /établissement privé/i })).toBeVisible();
  });

  test('affiche le lien mes concours si inscriptions existantes', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true, avecInscriptions: true });
    await seedStudentSession(page);
    await page.goto('/dashboard');

    await expect(page.getByRole('link', { name: /suivi de mes concours/i })).toBeVisible();
  });

  test('navigue vers la page concours', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true });
    await seedStudentSession(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /Participer à un concours/i }).click();
    await expect(page).toHaveURL(/\/concours/);
    await expect(page.getByText('Concours disponibles')).toBeVisible();
  });

  test('navigue vers les établissements privés', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true });
    await seedStudentSession(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /établissement privé/i }).click();
    await expect(page).toHaveURL(/\/etablissements-prives/);
    await expect(page.getByRole('heading', { name: 'Établissements privés' })).toBeVisible();
  });
});
