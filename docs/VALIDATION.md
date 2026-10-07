# Current validation

Final verification on 2026-10-07, using the production build, original fixtures and default stateful MSW scenario. These are local build measurements, not deployed CDN measurements.

## Types, lint and full E2E suite

`npm run check` passed TypeScript, ESLint and production build. The final normal Playwright run (no snapshot updates and no retries) finished with **88 passed, 12 skipped, zero failed**, across Chromium desktop (1440 × 1000) and mobile (390 × 844). The skips are deliberate cases exclusive to the other viewport, not unfinished mandatory flows. Duration: 4.9 minutes. Playwright 1.63.0 and Vite 8.3.2.

Covered catalog URL/history, direct/missing NFT, editions/quantity, account isolation and session expiry, favorites with optimistic rollback, persisted guest cart/login merge, coupons, profile/avatar/password/wallet edits, confirmed/declined/pending orders, duplicate submission/timeout idempotency, immutable receipts, Socket.IO updates/duplicate and old events/reconnection, idle and stopped-worker recovery, accessible error feedback, keyboard/dialog focus, Axe and horizontal overflow.

Reviewed versioned visual baselines cover home, detail, cart, checkout, auth, profile, wallets, receipt and footer. Only three baselines changed in this pass: home mobile (bottom safe area), cart desktop (image compression) and detail desktop (compression and carousel hit area).

The first complete run found two pagination failures caused by the fixed phone navigation covering the controls, and one fixture issue: the cart mutation test reloaded under a global server-error scenario before attempting the mutation. The delivered CSS reserves 144 px plus safe area and respects scroll padding; the fixture now fails the next real REST mutation without discarding the loaded UI. All three cases pass normally, without forced clicks. Initial failure traces are retained alongside the successful final report.

Artifacts: `reports/e2e-final-full/index.html`, `reports/e2e-final-initial/index.html`, `reports/e2e-final-fixes`, `reports/e2e-final-visual`. Reports are included in the delivery ZIP and reproducible from the checkout.

## NFT gallery follow-up

After the full-suite/audit checkpoint above, the detail gallery received a focused visual correction: Portuguese viewer text/accessible names, a horizontal thumbnail strip inside the enlarged viewer, and a circular brown zoom affordance. The page's desktop thumbnail column remains unchanged. `npm run check` passed; the focused detail run passed four tests with two viewport-specific skips, including image switching, horizontal alignment, Escape/focus restoration and an Axe scan of the viewer in both profiles. Evidence: `reports/e2e-gallery-final`, `reports/gallery-1440.png`, `reports/gallery-390.png`. The visual update run passed four tests; a normal comparison run (without snapshot updates) passed both desktop/mobile multi-page visual cases. Reports: `reports/e2e-gallery-visual` and `reports/e2e-gallery-visual-confirmed`.

The full suite and Lighthouse figures below belong to the preceding validation checkpoint, not a fresh audit after this small gallery correction.

## Lighthouse: latest measured checkpoint

Three runs per page/profile, twelve total; independent median for each category and metric. Auditing started after E2E finished. Standard Lighthouse simulated throttling, desktop config for desktop, bundled Chromium, isolated temporary profile per run. No audit-only data, hidden assets, disabled mocks or alternate business paths.

| Page | Profile | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | mobile | 85 | 100 | 96 | 100 | 3878 | 0.0010 | 27.5 |
| home | desktop | 98 | 100 | 100 | 100 | 1026 | 0.0063 | 0.0 |
| detail | mobile | 85 | 100 | 96 | 100 | 3785 | 0.0293 | 3.0 |
| detail | desktop | 98 | 100 | 100 | 100 | 984 | 0.0464 | 0.0 |

Environment: Node v24.19.0, linux x64, Lighthouse 13.5.0. Chromium: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.0 Safari/537.36`. Base URL: `http://127.0.0.1:4173`.

All category targets pass except **mobile Performance (85 on home and detail; target 90)**. This remains a limitation, not a passing score. The challenge permits explaining below-target results; it does not make the score a substitute for executable core flows.

The mobile loading chain remains dominated by React/Router/Query/MSW bootstrap and data-dependent artwork discovery. The MSW browser chunk is approximately 454 KB minified / 169 KB gzip; blocking time is low, but cold network/bootstrap delays the meaningful artwork paint. Standard mocks have no artificial latency. Experiments with early module/image hints and rendering before mock readiness worsened simulated mobile results; they were discarded, preserving the simpler, tested startup. More invasive bundle/SSR work remains a possible follow-up and is not claimed complete here.

Mobile Best Practices 96 comes from supplied low-resolution PNG icons at device pixel ratio greater than one. Original icons are retained; the score still exceeds the required 95. Desktop accessibility improved to 100 by matching accessible names to the visible labels and increasing carousel button hit width to 24 px. SEO improved to 100 with an actual robots.txt and a Portuguese description.

The five original artworks are encoded as WebP quality 95, method 6, exact alpha. Combined transfer size is reduced from 492,882 to 120,552 bytes (75.5%). Dimensions and alpha channels are unchanged; this is high-quality lossy compression, not pixel equality. Original PNG exports remain included. `reports/image-optimization.json` records individual sizes and checks. No recoloring or generated replacements.

Raw HTML/JSON and medians: `reports/lighthouse`; baseline before optimization: `reports/lighthouse-final-before-optimization`. Runner/config: `scripts/audit.mjs`. Measurements reflect the pre-gallery validation checkpoint; they are not selected best runs. Historical checks are separated in [VALIDATION-HISTORY.md](VALIDATION-HISTORY.md).

## GitHub delivery

Source repository: https://github.com/lucaswd21/jungle-frontend-challenge . The public repository includes source, original assets, lockfile, executable E2E tests, visual baselines, CI and architecture documentation. Generated test traces and Lighthouse HTML/JSON remain in the validated ZIP rather than the source repository; they can be reproduced using the documented commands. The history document records earlier checkpoints before publication.
