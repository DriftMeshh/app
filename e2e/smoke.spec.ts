import { test, expect } from '@playwright/test';

/**
 * Smoke tests against the real built/dev app and whatever backend it's
 * configured with (see .env's VITE_API_BASE) — not mocked, unlike the
 * component tests under test/. Exactly the kind of check that would have
 * caught a real production incident this project hit once: a render
 * crash that blanked the entire page with nothing in the DOM and no
 * visible error, which no mocked component test surfaced.
 *
 * CI has no backend configured at all (no .env, nothing committed — see
 * .gitignore), so every fetch 404s/502s there; these tests are written to
 * tolerate that (checking "didn't crash", not "shows real data") and only
 * track `pageerror` (uncaught exceptions), never generic console.error,
 * since a failed network request logs one of those too and isn't a bug.
 */

test('the landing page loads without an uncaught render error', async ({ page }) => {
  // Only `pageerror` (uncaught JS exceptions — real render crashes), not
  // every console.error: in an environment with no backend configured
  // (e.g. this suite's own CI job), the browser logs a console error for
  // each failed network request, which isn't an app bug — Landing already
  // handles that gracefully (shows "—" placeholders, see ConnectivityBanner)
  // and that's exactly the behavior this suite should NOT fail on.
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /real-time sensor data/i })).toBeVisible();
  await expect(page.getByText('DriftMesh').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('opening the dashboard shows the device list without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.getByRole('button', { name: /open dashboard/i }).click();

  const panel = page.locator('section.panel', { has: page.getByRole('heading', { name: 'Registered devices' }) });
  await expect(panel).toBeVisible();
  // Whatever it resolved to — a real table, or the empty-state message —
  // what matters is the loading skeleton it starts on is gone; that's the
  // signal the fetch actually settled instead of hanging or crashing.
  await expect(panel.getByRole('status', { name: /loading/i })).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('every dashboard tab renders without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.getByRole('button', { name: /open dashboard/i }).click();

  for (const tabName of ['Map', 'Region lookup', 'Subscription', 'My devices']) {
    await page.getByRole('button', { name: tabName, exact: true }).click();
    // The error boundary's fallback card is the one thing that must never
    // appear — every tab has its own content, but "didn't blow up" is the
    // one assertion that applies to all of them uniformly.
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  }

  expect(errors).toEqual([]);
});
