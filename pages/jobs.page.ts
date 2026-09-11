import { expect, type Locator, type Page } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly jobCards: Locator;
  readonly sortControl: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: /Thousands of remote jobs/i,
    });
    this.searchInput = page.locator('input[aria-label="Search jobs"]:visible');
    this.jobCards = page
      .getByRole('button')
      .filter({ has: page.locator('h3') });
    this.sortControl = page.locator('select:visible');
  }

  async goto(): Promise<void> {
    await this.page.goto('/jobs');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Remote Freedom Jobs/i);
    await expect(this.heading).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.sortControl).toBeVisible();
    await expect(this.jobCards.first()).toBeVisible();
  }

  async openFirstJob(): Promise<string> {
    const firstJob = this.jobCards.first();
    const title = (await firstJob.getByRole('heading').innerText()).trim();

    expect(title, 'The first job card should have a title').toBeTruthy();
    await firstJob.click();

    return title;
  }
}
