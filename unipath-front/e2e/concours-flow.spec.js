import { test, expect } from '@playwright/test';
import { setupMockApi, MOCK_CONCOURS } from './helpers/mock-api.js';
import { seedStudentSession } from './helpers/auth.js';

test.describe('Parcours concours', () => {
  test('affiche les concours pour la série de l\'étudiant', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true, serie: 'D' });
    await seedStudentSession(page);
    await page.goto('/concours');

    await expect(page.getByText('Concours disponibles')).toBeVisible();
    await expect(page.getByText(MOCK_CONCOURS[0].libelle)).toBeVisible();
  });

  test('permet d\'ouvrir le détail d\'un concours', async ({ page }) => {
    await setupMockApi(page, { dossierComplet: true, serie: 'D' });
    await seedStudentSession(page);
    await page.goto('/concours');

    await page.getByText(MOCK_CONCOURS[0].libelle).click();
    await expect(page).toHaveURL(/\/concours\/concours-1/);
  });
});
