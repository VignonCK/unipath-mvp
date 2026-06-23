import { test, expect } from '@playwright/test';
import { setupMockApi } from './helpers/mock-api.js';
import { seedStudentSession } from './helpers/auth.js';

test.describe('Établissements privés', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true });
    await seedStudentSession(page);
    await page.goto('/etablissements-prives');
  });

  test('affiche la liste des établissements privés', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ISMA Benin' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ESGIS' })).toBeVisible();
  });

  test('valide que les 3 choix de filière sont distincts', async ({ page }) => {
    await page.getByRole('button', { name: 'Oui' }).click();

    const selects = page.locator('select');
    await selects.nth(0).selectOption('Informatique');
    await selects.nth(1).selectOption('Informatique');
    await selects.nth(2).selectOption('Gestion');

    await page.getByRole('button', { name: /Rechercher les établissements/i }).click();
    await expect(page.getByText(/trois choix doivent être différents/i)).toBeVisible();
  });

  test('retourne des établissements filtrés après recherche', async ({ page }) => {
    await page.getByRole('button', { name: 'Oui' }).click();

    const selects = page.locator('select');
    await selects.nth(0).selectOption('Informatique');
    await selects.nth(1).selectOption('Gestion');
    await selects.nth(2).selectOption('Droit');

    await page.getByRole('button', { name: /Rechercher les établissements/i }).click();

    await expect(page.getByText(/établissement\(s\) correspondant/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ISMA Benin' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ESGIS' })).toBeVisible();
  });

  test('permet de continuer vers la demande d\'inscription académique', async ({ page }) => {
    const lien = page.getByRole('link', { name: /Continuer vers la demande/i });
    await expect(lien).toHaveAttribute('href', '/inscription-academique');
  });
});
