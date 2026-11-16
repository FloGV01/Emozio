import { test, expect } from '../aides/gardes.js';
import { toucher, entreeDuJour, viderBase } from '../aides/saisie.js';

// v12.1 : « Enregistré » n'est plus à l'écran, il est annoncé (la région role="status" de l'en-tête, masquée).
test('connexion à la base fermée de force : réouverture et « Enregistré »', async ({ page }) => {
  await page.goto('/');
  await viderBase(page);
  await page.evaluate(async () => { const db = await window.__carnet.repo.ouvrir(); db.close(); });
  await toucher(page, 'Lieu', 'Bureau');
  const annonce = page.locator('.entete-jour [role="status"]');
  await expect(annonce).toHaveText('Enregistré');
  await expect(annonce).toHaveClass('visuellement-cache');
  await expect.poll(async () => (await entreeDuJour(page))?.lieu).toBe('lieu:bureau');
});
