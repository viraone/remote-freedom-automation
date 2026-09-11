import { expect, test } from '@playwright/test';
import { JobsPage } from '../../pages/jobs.page';

const NO_MATCH_TERM = 'zzzqqqxyz123nonsense';

/**
 * Build a search term from a job that is live right now, so the test never
 * depends on a company, title, or listing that may disappear tomorrow.
 */
function deriveSearchTerm(title: string): string {
  const term = title
    .split(/[^A-Za-z]+/)
    .filter((word) => word.length >= 4)
    .sort((a, b) => b.length - a.length)[0];

  expect(term, `Could not derive a search term from "${title}"`).toBeTruthy();

  return term;
}

test.describe('Job search', () => {
  test('searching narrows the job list to relevant roles', async ({ page }) => {
    const jobsPage = new JobsPage(page);

    await jobsPage.goto();
    await jobsPage.expectLoaded();

    const unfilteredCount = await jobsPage.jobCount();
    const term = deriveSearchTerm(await jobsPage.firstJobTitle());

    await test.step(`Search for "${term}"`, async () => {
      await jobsPage.search(term);
      await expect(jobsPage.jobCards.first()).toBeVisible();
    });

    await test.step('The result set narrows', async () => {
      const filteredCount = await jobsPage.jobCount();

      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThan(unfilteredCount);
    });

    await test.step('At least one result mentions the term', async () => {
      const texts = await jobsPage.visibleJobTexts(10);
      const mentions = texts.filter((text) =>
        text.toLowerCase().includes(term.toLowerCase()),
      );

      // Search also matches job descriptions, so not every card shows the
      // term. Requiring all of them would fail against correct behaviour.
      expect(
        mentions.length,
        `No visible result mentioned "${term}"`,
      ).toBeGreaterThan(0);
    });
  });

  test('a search with no matches shows the empty state', async ({ page }) => {
    const jobsPage = new JobsPage(page);

    await jobsPage.goto();
    await jobsPage.expectLoaded();

    await jobsPage.search(NO_MATCH_TERM);
    await jobsPage.expectEmptyState();
  });

  test('clearing the search restores the full job list', async ({ page }) => {
    const jobsPage = new JobsPage(page);

    await jobsPage.goto();
    await jobsPage.expectLoaded();

    const unfilteredCount = await jobsPage.jobCount();
    const term = deriveSearchTerm(await jobsPage.firstJobTitle());

    await jobsPage.search(term);
    const filteredCount = await jobsPage.jobCount();
    expect(filteredCount).toBeLessThan(unfilteredCount);

    await test.step('Clear the search', async () => {
      await jobsPage.clearSearch();
      await expect(jobsPage.jobCards.first()).toBeVisible();
      expect(await jobsPage.jobCount()).toBeGreaterThan(filteredCount);
    });
  });
});
