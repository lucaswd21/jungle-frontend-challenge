# Jungle NFT Marketplace

A React + TypeScript marketplace with a stateful REST simulation, Socket.IO events, persistent collector accounts and idempotent checkout. No blockchain, extension, real wallet or payment service is used.

**Delivery status:** original KURIO artwork, wordmark, supplied icons, Roboto Mono and Figma colors are integrated. Desktop/mobile page layouts have been rebuilt from the exported screens. Functional flows include catalog, authentication, persistent accounts, visitor-cart merge, checkout, receipts and realtime reconciliation. See `docs/VALIDATION.md` for executed checks and deployment evidence, and `docs/DESIGN.md` for visual limitations. Public production: https://jungle-marketplace.vercel.app/ . Source repository: https://github.com/lucaswd21/jungle-frontend-challenge .

## Run from a clean checkout

Use Node 22.12+ (Node 24 supported) and npm. The committed lockfile is authoritative.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:5173. MSW starts before React and before importing Socket.IO, including in the demonstration build. Localhost and HTTPS support Service Workers; plain HTTP on a non-local host does not.

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
npm test
npm run test:report
npm run audit
```

`npm test` expects an existing production build and starts its own preview. `npm run audit` starts a production preview, audits home and detail three times in each profile, and writes HTML/JSON plus medians to `reports/lighthouse`. On Linux, Chromium is provided by the locked `@sparticuz/chromium` npm package and prepared without a CDN download; its archive is extracted without restoring ownership. On other platforms, run `npx playwright install chromium` for tests. `CHROMIUM_EXECUTABLE_PATH` can select a locally installed Chromium binary for tests/audits. The bundled Linux audit runner requires `tar` and Linux system libraries; use `CHROMIUM_EXECUTABLE_PATH` on other systems.

Reports appear in `playwright-report`, failure traces in `test-results`. Visual baselines live in `tests/e2e/visual.spec.ts-snapshots` and `tests/e2e/design-flows.spec.ts-snapshots` (login/signup). The final artifact includes executed reports separately; generated reports are not source-code dependencies.

## Environment

| Variable                   | Default                                                | Purpose                                                               |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`        | enabled unless `false`                                 | Enable shared HTTP/WebSocket mocks in development and production demo |
| `CHROMIUM_EXECUTABLE_PATH` | bundled Linux Chromium / standard Playwright elsewhere | Browser binary for checks                                             |
| `AUDIT_URL`                | `http://127.0.0.1:4173`                                | URL audited with default mocks                                        |

There is no private backend. Disabling mocks requires supplying a compatible API and realtime service and is not the demonstration configuration. Never add real credentials to this project.

## Demo accounts

| Email               | Password     |
| ------------------- | ------------ |
| `alex@example.test` | `Jungle123!` |
| `maya@example.test` | `Jungle123!` |

Coupon: `JUNGLE10` (10% of subtotal). `EXPIRED` deliberately fails. ETH values are exact decimal strings; the network fee is `0.016 ETH`. Edition choices are 1/50, 1/10, 1/1 and ABERTA; NFT 3 has a sold-out 1/10 edition.

Google/Facebook buttons sign in to the documented demo accounts through the simulated API; they are not external OAuth. Password recovery displays demo guidance and sends no email.

Checkout includes the design’s collector/profile fields, registered wallet address, simulated provider, referral, ENS suffix and optional note. Name/email/username are prefilled from the account; the demo referral defaults to `JUNGLE`. ENS/provider metadata is validated and stored without external resolution or connection. Profile username/ENS/wallet alias and wallet metadata also persist. Password changes require matching confirmation.

Account changes, avatar, hashed passwords, wallets, favorites, cart and orders persist in this browser until reset. The updated fixtures use storage schema `jungle.mock.db.v2`; data from the previous visual build is reset once. The two demo accounts begin with independent wallets and data. Visitor cart contents merge on sign-in, bounded by availability.

## Demonstration and failures

Add `?demo=1` to the desired page URL (or `&demo=1` when it already has query parameters) to enable diagnostic controls, then open **Cenários de demonstração** below the page content. Normal page navigation does not show this trigger. Select a scenario or trigger a network event. The dialog's buttons make HTTP calls to mock-only endpoints; they do not call React setters or Query methods to fake realtime events.

| Scenario/control                    | Reproduction                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `standard`                          | Default successful flows; no artificial latency                                                                 |
| `empty`                             | Return to the catalog; empty-result feedback                                                                    |
| `slow`                              | Open a new detail route; shimmer skeletons for 2 seconds                                                        |
| `variable`                          | Change searches quickly; alternating 900/80 ms latency; obsolete requests cannot replace current data           |
| `offline` / `server-error`          | Queries fail at the network layer / HTTP 503; select `standard` and retry                                       |
| `invalid-cart` / `html-response`    | Malformed cart JSON / HTML with HTTP 200; shell remains usable, cart shows a recoverable error                  |
| `unauthorized`                      | Private API returns 403                                                                                         |
| `expired` / Expire session          | On checkout, return to login while preserving cart and destination; choose `standard` to stop forced expiration |
| `signup-conflict`                   | Signup returns an email conflict                                                                                |
| `validation`                        | Profile name rejected by the API with a field error                                                             |
| `invalid-coupon` / `expired-coupon` | Apply a coupon to exercise validation; removal remains possible                                                 |
| `favorite-failure`                  | Toggle a favorite; optimistic state rolls back                                                                  |
| `price-change` / `sold-out`         | Submit reviewed checkout; server changes price/stock and rejects stale quote; re-review required                |
| `timeout`                           | Server creates an order but delays its response beyond Axios's timeout; recovery gets the same order by key     |
| `declined`                          | Payment resolves declined; cart retained and reserved inventory restored                                        |
| Change NFT price / Exhaust edition  | With an item in the cart, send `nft.updated` through the intercepted Socket.IO connection                       |
| Duplicate / Older event             | Replay an event or a deliberately stale resource snapshot; UI must not regress                                  |
| Interrupt socket                    | Close the intercepted connection; Socket.IO reconnects and active resources reconcile via REST                  |
| Resolve pending orders              | Deterministically resolve pending orders, using the mock server and Socket.IO                                   |
| Reset all demo data                 | Restore catalog, accounts, passwords, wallets, sessions, cart, orders, sequence and scenario                    |

## Routes

`/`, `/nfts/:nftId`, `/cart`, `/login`, `/signup`, `/checkout`, `/orders/:orderId`, `/profile`, `/wallets`. Private routes validate the current session, including direct navigation. Search/filter/sort/page/catalog tab are URL state. Orders have ownership checks. Unknown routes render a 404.

On desktop, the header's Entrar button opens authentication over the existing page, without changing the URL or remounting its catalog. Direct `/login` and `/signup` links still work, including checkout redirects and standalone mobile forms. Opening/closing dialogs and supported-browser route changes use short fades; reduced-motion disables them. The home navbar follows the visible catalog/learn/creators section; on other routes it marks the corresponding destination.

Todos os NFTs, Novos lançamentos and Em alta call the same catalog API and combine with filters, ordering and pagination. New releases are the first twelve fixture entries; trending uses a deterministic demonstration ranking, not real market analytics. Footer social links lead to each platform's homepage because no official KURIO account URLs were provided. Google/Facebook sign-in remains the separately documented API simulation.

## Deploy

Build command: `npm run build`. Output: `dist`. Keep mocks enabled and upload the Service Worker, fonts, SVGs and JS assets. `vercel.json` and `public/_redirects` configure SPA fallback for Vercel and Netlify/Cloudflare Pages. Vercel is recommended by the challenge; Cloudflare Pages is also accepted.

Before submission, test the public URL on `/nfts/nft-1`, `/checkout`, `/profile`, `/wallets` and an order URL, including refresh. Reproduce the realtime price change and a full purchase there. Do not use a development preview URL as the final public deployment.

## Read the code

- `src/api`: typed contracts and Axios transport.
- `src/mocks`: fixtures, persistent server state, REST handlers and Socket.IO binding.
- `src/app`: providers, routes, query policy and shell.
- `src/features`: product flows and server-state hooks.
- `src/features/account`: focused wallet and password forms, separate from profile orchestration.
- `src/styles`: tokens/base, marketplace layout and page layouts; Tailwind utilities remain in components.
- `src/realtime`: subscriptions, resource versions and REST reconciliation.
- `src/components/ui`: adapted shadcn/ui composition with Radix, Slot and cva.
- `tests/e2e`: isolated browser contexts, real UI interactions and network-level simulation.

See `ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DEFENSE_GUIDE.md` and `docs/REQUIREMENTS.md`.
