import { expect, test } from '@playwright/test';
import { JobsPage } from '../../pages/jobs.page';

test.describe('Jobs page smoke tests', () => {
  test('@smoke visitor can load jobs and open a job listing', async ({
    page,
  }) => {
    const jobsPage = new JobsPage(page);

    await test.step('Open the public jobs page', async () => {
      await jobsPage.goto();
      await jobsPage.expectLoaded();
    });

    await test.step('Open the first available job', async () => {
      const selectedJobTitle = await jobsPage.openFirstJob();

      await expect(
        page
          .getByRole('heading', {
            name: selectedJobTitle,
            exact: true,
          })
          .last(),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /^Apply/ })).toBeVisible();
    });
  });
});
