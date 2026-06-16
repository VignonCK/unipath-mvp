import { test, expect } from '@playwright/test';
import { setupMockApi } from './helpers/mock-api.js';

test.describe('Connexion étudiant', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  test('redirige un visiteur non connecté depuis /dashboard vers /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('connecte un étudiant et redirige vers le dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('votre@email.com').fill('etudiant.e2e@unipath.test');
    await page.getByPlaceholder('••••••••').fill('MotDePasseTest1!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Bienvenue sur UniPath')).toBeVisible();
    await expect(page.getByRole('button', { name: /Participer à un concours/i })).toBeVisible();
  });
});
