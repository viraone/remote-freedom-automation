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
    // Mobile and desktop markup coexist, so match the copy the user can
    // actually see rather than whichever comes first in the DOM.
    this.emptyState = page
      .getByRole('heading', { name: /No roles match these filters/i })
      .filter({ visible: true });
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
    // Under parallel load the app can re-render between resolving the control
    // and the click landing, which silently drops the interaction -- this failed
    // 3/3 runs at two workers while passing at one. Re-click until the query
    // actually leaves the URL. The control disappears once the field is empty,
    // so a missing button means the clear already took effect.
    await expect(async () => {
      if (await this.clearSearchButton.isVisible()) {
        await this.clearSearchButton.click();
      }

      await expect(this.page).not.toHaveURL(/[?&]q=/, { timeout: 5_000 });
    }).toPass({ timeout: 25_000 });

    await expect(this.searchInput).toHaveValue('', { timeout: 10_000 });
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
