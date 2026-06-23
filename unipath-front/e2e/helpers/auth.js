import { TEST_USER } from './mock-api.js';

/** Injecte une session étudiant dans le navigateur (localStorage). */
export async function seedStudentSession(page, role = 'ETUDIANT') {
  await page.addInitScript(
    ({ user, token }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
    },
    {
      token: 'e2e-fake-jwt-token',
      user: { id: TEST_USER.id, role, email: TEST_USER.email },
    }
  );
}

export { TEST_USER };
