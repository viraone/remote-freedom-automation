import { expect, type Locator, type Page } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly jobCards: Locator;
  readonly sortControl: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: /Thousands of remote jobs/i,
    });
    this.searchInput = page.locator('input[aria-label="Search jobs"]:visible');
    this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
    this.jobCards = page
      .getByRole('button')
      .filter({ has: page.locator('h3') });
    this.sortControl = page.locator('select:visible');
    this.emptyState = page.getByText(/No roles match these filters/i).first();
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

  async firstJobTitle(): Promise<string> {
    const title = (
      await this.jobCards.first().getByRole('heading').innerText()
    ).trim();

    expect(title, 'The first job card should have a title').toBeTruthy();

    return title;
  }

  async jobCount(): Promise<number> {
    return this.jobCards.count();
  }

  async search(term: string): Promise<void> {
    const inUrl = new RegExp(`[?&]q=${encodeURIComponent(term)}(&|$)`, 'i');

    // The jobs page is server-rendered and hydrates afterwards, so input typed
    // before the search box is wired up is silently discarded and the client
    // router settles back on /jobs. Retype until the app actually reflects the
    // term in the URL. Measured sync times: ~1s best case, ~6.5s worst case.
    await expect(async () => {
      await this.searchInput.fill(term);
      await expect(this.page).toHaveURL(inUrl, { timeout: 8_000 });
    }).toPass({ timeout: 30_000 });
  }

  async clearSearch(): Promise<void> {
    await this.clearSearchButton.click();

    // search() has already proven the page is interactive, so a single click is
    // enough here -- only the round trip needs headroom.
    await expect(this.page).not.toHaveURL(/[?&]q=/, { timeout: 15_000 });
    await expect(this.searchInput).toHaveValue('', { timeout: 15_000 });
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 15_000 });
    await expect(this.jobCards).toHaveCount(0, { timeout: 15_000 });
  }

  async visibleJobTexts(limit: number): Promise<string[]> {
    const total = Math.min(limit, await this.jobCount());
    const texts: string[] = [];

    for (let index = 0; index < total; index++) {
      texts.push(
        (await this.jobCards.nth(index).innerText()).replace(/\s+/g, ' '),
      );
    }

    return texts;
  }

  async openFirstJob(): Promise<string> {
    const title = await this.firstJobTitle();
    await this.jobCards.first().click();

    return title;
  }
}
