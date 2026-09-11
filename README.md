# Remote Freedom Automation

Playwright and TypeScript test automation for the Remote Freedom web
application.

## Prerequisites

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npx playwright install chromium
```

## Run tests

```bash
npm run test:smoke
```

Use `BASE_URL` to run against another environment:

```bash
BASE_URL=https://staging.example.com npm run test:smoke
```

Failure artifacts are written to `test-results/`. Open the HTML report with:

```bash
npm run report
```
