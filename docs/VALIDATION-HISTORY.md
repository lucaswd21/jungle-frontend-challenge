# Historical validation log

Earlier implementation snapshots and targeted checks follow. Current release results are in [VALIDATION.md](VALIDATION.md). These historical numbers do not describe the current build.

# Executed validation — 2026-10-06, refinements

Implementation source: `51cd8b71adcd5c37abe320280f81daaaa30e4991`.

## Follow-up UI refinement

Follow-up source: `1567234cd2eb52f2124e284ca3bab33edc3cde48`. Typecheck/build and lint passed. Targeted normal Playwright run: **5 passed, 1 mobile skip**, 14.8 seconds, including all 16 visual comparisons and the new section/alignment regression. Follow-up deployment: `dpl_FTyfYejidFU816DxoHSeGG9mGfff`.

Follow-up deployment is READY; the public Work browser confirmed white search treatment, zero-pixel label/select center difference, Diário da Cunhagem under `#creators` and the security block under `#learn`. Evidence: `evidence/kurio-ui-1791299450603.jpg`.

The newest small revision makes the desktop search icon white, removes vertical spacing from the inline ordering label, maps Criadores to Diário da Cunhagem and Aprenda to the lower learning/security block. A new desktop regression verifies label/select center alignment and both navbar destinations/active states, including the last section in tall viewports. Reviewed desktop baselines reflect these changes. The full suite and Lighthouse numbers below describe the preceding implementation, not a newly repeated full audit of this small revision. Follow-up results are recorded separately in `reports/e2e-refinements`.

## Checks

- `npm run check`: strict TypeScript, ESLint and production build passed.
- `npm test -- --workers=2`: **54 passed, 2 intentionally skipped, 2.5 minutes**, no failures. Desktop skips mobile favorites navigation; mobile skips the desktop header-auth preservation case.
- Final normal run compares **16 screenshots without updating snapshots**: home, detail, cart, checkout, profile, wallets, login and signup in desktop/mobile. Reviewed baselines include the intended icon, select, social and Portuguese feedback changes. These are application regression screenshots, not automated Figma diffs.
- Axe checks cover home, checkout and authentication. Keyboard checks include skip navigation, focus trapping, Escape and restored focus. Overflow checks pass at 320, 390, 768 and 1440 px. This does not prove universal accessibility.

Coverage includes URL/history and combined filters/order/pagination; direct detail/404/editions/gallery; guest-cart persistence/merge; quantities/coupons/exact ETH totals; account isolation/expiry; profile/avatar/password/wallet creation and editing; optimistic rollback; connection refusal/disconnection; fresh quote review; repeated submission; declined payment; timeout recovery; pending-order refresh/reconnection; immutable receipt/form snapshots; network failures/slow/variable latency; Socket.IO price/stock/version/deduplication.

New regressions cover malformed cart JSON and HTML with HTTP 200 without a shell crash, then recovery; catalog tabs combined with URL state and refresh; desktop auth over one existing catalog, unchanged URL and focus restoration.

Executed HTML: `reports/e2e-full/index.html` (also `playwright-report/index.html`). Run record: `reports/e2e-full-result.txt`. This passing run has no failure traces.

## Lighthouse: final production build

Node 24.19.0, Linux x64, Chromium 153.0.8010.0, Lighthouse 13.5.0. Production preview at 127.0.0.1:4173; default stateful MSW, original lossless artwork and local fonts. Standard simulated throttling, desktop configuration for desktop; isolated temporary profile per run. **Three runs per page/profile, twelve total**, with independent medians per metric. Tests finished before auditing; no audit-only mode or disabled functionality.

| Page   | Profile | Performance | Accessibility | Best practices | SEO | LCP (ms) |    CLS | TBT (ms) |
| ------ | ------- | ----------: | ------------: | -------------: | --: | -------: | -----: | -------: |
| Home   | Mobile  |          86 |           100 |             96 |  92 |     3648 | 0.0009 |     23.5 |
| Home   | Desktop |          99 |           100 |            100 |  92 |      929 | 0.0063 |        0 |
| Detail | Mobile  |          86 |           100 |            100 |  92 |     3640 | 0.0292 |       30 |
| Detail | Desktop |          98 |           100 |            100 |  92 |      990 | 0.0510 |        0 |

Desktop meets all score targets. Accessibility, Best Practices and SEO meet their targets in every profile. **Mobile Performance remains below 90: home 86, detail 86.** This is a remaining limitation, not a passing score. The original 24×24 cart PNG triggers a high-density image-resolution warning on mobile, making home Best Practices 96. The original asset is retained rather than claiming artificial upscaling improves clarity; a vector or high-density export would resolve it.

Application/mock modules now download concurrently, but React waits for interception readiness and Socket.IO imports after mount. Existing optimizations remain: idle realtime loading, lazy page chunks, shared catalog cache, avoiding desktop-only mobile content, eager/high-priority visible NFT images, local fonts, lossless WebP and no artificial standard-scenario delay.

Mobile LCP remains about 3.64 seconds. React/Router/Query/mock startup and data-dependent image discovery remain bottlenecks; the MSW browser module is about 454 KB minified / 169 KB gzip. Concurrent downloads do not remove that startup cost. Further work should profile bootstrap/image discovery without dropping mandatory stack or original artwork. Hardware/runtime variation affects scores; all runs are retained, not selected best runs. These are local build measurements, not deployed CDN scores.

Raw HTML/JSON, conditions and medians: `reports/lighthouse`; runner: `scripts/audit.mjs`.

## Production deployment and public smoke check

Vercel project `jungle-marketplace`, deployment `dpl_ByCkFA2tMjUjJ8A1qjeZf7M4ZYky`, production **READY**, no alias error. Uploaded source corresponds to the implementation commit above. Node 24, Vite, `npm ci`, `npm run build`, output `dist`.

Public aliases: https://jungle-marketplace.vercel.app/ and https://jungle-marketplace-lucaswdwd-3971.vercel.app/ . The Work browser opened the first without Vercel authentication and verified:

- Header Entrar opens a visible dialog with the same URL and one mounted catalog; closing retains the page.
- Novos lançamentos updates `view=new`, pressed state and twelve matching entries; Todos restores the full catalog.
- Original artwork/cart/login icons and revised ordering load.
- Catalog → detail → guest cart: **1.206 ETH**; refresh retains the item and exact total.
- `invalid-cart` shows a recoverable error/Portuguese notification while the header remains usable; `standard` restores the same **1.206 ETH** cart.
- Mercado smooth-scrolls to the catalog and its underline becomes selected after scrolling settles.

Evidence: `evidence/kurio-refinements-1791298183522.jpg`, showing the public auth dialog over the preserved page. Authenticated checkout/order/account and the full realtime/failure matrix ran against the identical local production build; no authenticated public-browser purchase is claimed for this deployment.

## Design and submission limits

### Original Figma delete icon (2026-10-06)

Final normal run: **4 passed**, zero failed/skipped. Source commit `42fb105`; Vercel production deployment `dpl_AZCRCxKxJSqvtbkVNmLxcjeGZXjQ` reached **READY**, with no alias error. Asset bytes match the supplied export. Validation used the local production build; no additional public browser purchase or runtime-log scan is claimed.

The cart removal button now uses the original transparent 18×20 PNG supplied by the user, without recoloring. Typecheck, lint and production build passed. The cart regression case checks its path, decoded width and displayed 18×20 dimensions, along with quantity, coupon, removal and main-content accessibility. Desktop/mobile cart visual baselines were intentionally refreshed; other page baselines remain unchanged. The normal targeted selection covers four cases (cart controls and visual baselines in both profiles); its report is `reports/e2e-delete-icon` in the ZIP. No full-suite or Lighthouse rerun is claimed for this asset-only replacement.

### Cart reference refinement (2026-10-06)

Typecheck, lint and production build passed. The targeted Playwright selection covers the revised cart controls and main-content axe accessibility, guest-cart persistence/merge and coupon/removal, complete purchase/receipt, catalog sorting/history and twelve reviewed desktop/mobile visual baselines. Baselines were intentionally updated before a separate normal comparison run. The final targeted report is retained at `reports/e2e-cart-reference` in the delivery ZIP. Full-suite and Lighthouse measurements above are historical and were not rerun for this cart-only refinement.

Final normal run: **10 passed**, zero failed/skipped. Cart-content axe checks reported zero violations on desktop and mobile. This is automated coverage, not a certification of complete accessibility or pixel-perfect Figma matching.

Implementation commit `3db1e43`; production deployment `dpl_3nXZZrFCyjVPVaCgQsxMU8ptWrfN` reached **READY**, with no alias error. Work-browser smoke verification opened `https://jungle-marketplace.vercel.app/cart` publicly and confirmed the preserved one-item guest cart, compact row, wallet summary/promotion form, total `1.206 ETH`, checkout link and recommendations. Evidence: `evidence/kurio-cart-1791302098507.jpg`. No new public authenticated purchase or runtime-log scan is claimed.

### Recovery after tab inactivity (2026-10-06)

The new Chromium regression tests explicitly terminate Service Workers through CDP, reproducing `/api` returning the SPA's HTML instead of JSON. The demo now reactivates MSW on returning from a hidden tab and before API traffic after thirty seconds without requests. Concurrent calls share the same recovery promise. An unexpected non-JSON GET receives at most one transport-level retry; writes are never automatically replayed. Recovery does not rerun database initialization, remount React or reset browser storage. Genuine session expiry remains an authentication error and is not bypassed.

Tests cover a first write after simulated inactivity, a terminated worker followed by client-side navigation with the original guest cart retained, and an invalid write response with no automatic resubmission followed by a successful explicit retry. Inactivity time is advanced with Playwright's clock rather than an arbitrary sleep. These are deterministic failure/recovery tests, not a claim of an hours-long manual idle soak test.

Typecheck, lint and production build passed. The broad run exercised 66 cases: 61 passed, four intentionally skipped, and the newly added mobile invalid-write test failed because a concurrent background GET recovered interception before its forced POST failure. The test injection was corrected to isolate reads during that failure (no application-code change). All three recovery cases then passed twice on both desktop and mobile: **12 successful executions**. Broad-run evidence, including the initial test failure, is retained at `reports/e2e-idle-full`; the final repeated recovery report is `reports/e2e-idle-recovery`. The broad suite was not rerun in its entirety after this test-only adjustment; Lighthouse was not rerun.

Implementation commit `f0fa500`; Vercel production deployment `dpl_GPN5VCv5ZZ9CzKSw4GNBvL31gUD2` is **READY**, with no alias error, on the existing public aliases. Recovery regression tests used the local production build. No public-browser hours-long inactivity test or production runtime-log scan is claimed. Already-open tabs need one refresh to load this updated application code; cart storage is retained.

### NFT detail refinement verification (2026-10-06)

Implementation commit: `684f38f`. Vercel production deployment `dpl_81rtwLAJasKhha53ix1mhMVufKCV` reached **READY**, with no alias error. Public Work-browser verification opened `https://jungle-marketplace.vercel.app/nfts/nft-1` without authentication and confirmed the revised gallery, price/rating row, summary, edition controls, purchase/favorite row, metadata and detail text. Evidence: `evidence/kurio-detail-1791300216382.jpg`. Automated functional checks below ran against the local production build; no new authenticated public purchase is claimed.

`npm run check` passed typechecking, lint and production build. The targeted Playwright run covering reference layout, direct detail/unavailable states and visual baselines passed **5 tests**, with **1 deliberate mobile skip** for the desktop-only reference-layout case. Twelve desktop/mobile screenshots cover home, detail, cart, checkout, profile and wallets. The detail baselines were intentionally updated and then compared in a separate normal run. The new layout case checks quantity, illustrative reviews, details selection and purchase API feedback. Report: `reports/e2e-detail` in the delivery ZIP. The full-suite and Lighthouse results above are earlier measurements, not rerun or newly claimed by this UI refinement.

Original artwork, Roboto Mono, colors and supplied cart/login PNGs are integrated. Exported desktop/mobile screens remain the reference; Figma was not revisited for this refinement. Some fallback icons and form/sidebar composition still differ. **Not certified pixel-perfect.** Native select popups depend partly on OS/browser. Social links are platform homepages, not invented KURIO profiles. See `docs/DESIGN.md`.

Source, lockfile, CI, reports, baselines and docs are ready for a personal GitHub repository. No remote has been created or pushed; final submission still needs that URL. ZIP omits node_modules, build output, secrets and local Git internals. MSW is browser-local simulation, not a production commerce backend or multi-tab transaction engine.

## Coupon alignment and functional collection dots — 2026-10-06

- TypeScript, ESLint and production build passed.
- Final targeted Playwright command: `npm test -- --workers=2 --grep 'reference cart|versioned visual baselines|visitor cart survives'`: 6 passed, none failed/skipped. Covers desktop/mobile coupon alignment, invalid/valid/removal flows, keyboard pagination and changed cards, cart accessibility with no axe violations, and visual baselines of six routes.
- Updated desktop detail/cart and mobile cart baselines only. Desktop dots are 12px circles with outlined inactive and filled active states; native buttons retain keyboard focus.
- Production deployment `dpl_38Ka8c6QwE79QVLz9F15JYW6zKb6` confirmed READY with no alias error, including jungle-marketplace.vercel.app. No fresh public-browser smoke, full suite or Lighthouse audit was performed for this adjustment.
- Report: reports/e2e-coupon-carousel.

## Coupon inset focus — 2026-10-06

- Production build and TypeScript passed.
- Targeted cart controls/promotion/removal/axe tests: 2 passed, desktop and mobile.
- Focus override scoped to coupon input; no layout, API, carousel or unrelated focus styles changed. No full-suite, Lighthouse or public-browser verification was run for this CSS-only adjustment.
- Report: reports/e2e-coupon-focus.

## White navbar account icon — 2026-10-06

Production build/TypeScript passed. Two normal visual tests passed (desktop/mobile, six routes each), after updating four desktop logged-in baselines. Change is scoped to the header profile icon. Report: reports/e2e-navbar-account. No full-suite, Lighthouse or public-browser audit run for this cosmetic adjustment.

## Portuguese tab titles — 2026-10-06

TypeScript, ESLint and production build passed. Two desktop/mobile visual tests passed with added browser-title assertions on home, detail, cart, checkout, profile and wallets (12 assertions). Existing screenshot baselines remained unchanged. Report: reports/e2e-page-titles. No full suite, Lighthouse or public-browser audit performed for this adjustment.

## Footer social and wallets refinement — 2026-10-06

- TypeScript, ESLint and production build passed.
- Normal visual baseline tests: 2 passed (desktop/mobile), including the footer screenshot assertion, five social links in the requested order, outlined controls, and compatible-wallet width check.
- Updated desktop footer-containing baselines and added `footer-community-desktop-linux.png`; mobile footer remains hidden at the designed breakpoint.
- No full suite, Lighthouse or public-browser audit was run for this footer-only adjustment. Report: reports/e2e-footer-community.

## Login modal Figma refinement — 2026-10-06

- TypeScript, ESLint and production build passed.
- Authentication modal test passed in desktop and mobile with axe checks, updated login/signup screenshots, and assertions that the extra registration/demo prompts are absent.
- Login and signup functionality remains available through the top tabs; only non-Figma bottom prompts were removed. No full suite, Lighthouse or new Vercel deployment was run for this adjustment because the Work deployment approval limit is still exhausted. Report: reports/e2e-auth-modal.

## Signup modal Figma refinement — 2026-10-06

- TypeScript, ESLint and production build passed after aligning the signup copy, field rhythm, CTA label, separator, provider marks and password visibility control with the supplied Figma frame.
- The authentication visual/accessibility selection passed in desktop and mobile (2 passed, zero violations); signup desktop and mobile baselines were refreshed intentionally. The account regression was updated to exercise the `Criar conta` label.
- No full suite, Lighthouse or new Vercel deployment was run for this focused refinement. The latest Vercel deployment still predates this change because the Work automatic-approval quota is exhausted. Report: reports/e2e-auth-modal.

## Auth copy and placeholder color — 2026-10-06

- Auth placeholders now use the Figma secondary-gold token and the desktop intro text has the wider centered measure shown in the reference.
- Production build and the desktop/mobile authentication visual plus axe selection passed (2 passed). Baselines were refreshed intentionally; no behavior or API contract changed.
- No full suite, Lighthouse or Vercel deployment was run for this cosmetic refinement. The updated package is available locally and in its persistent delivery file.

## Auth divider and overflow — 2026-10-06

- The auth divider text uses the foreground token, desktop rules extend to the dialog edges, and the password-recovery disclosure marker is removed without disabling recovery.
- Corrected the asymmetric negative intro margin that caused horizontal overflow. Both forms retain accessible show/hide password controls with matching eye states.
- TypeScript, ESLint and production build passed. Four targeted desktop/mobile authentication and signup tests passed, including axe checks, visual snapshots, password visibility and scroll-width assertions. Report: reports/e2e-auth-controls.
- No full-suite or Lighthouse rerun was performed for this focused change. Earlier Luna refinements were published successfully before this change.

## Payment reference and breadcrumb — 2026-10-06

- Used the first supplied payment image as the requested reference, without accessing Figma again. Kept collector fields, wallet selection, connection approval/refusal, quote review and order recovery functional.
- Added a dedicated payment heading and semantic, gold breadcrumb with working home/catalog links and current-page announcement; aligned item metadata color with the reference.
- TypeScript, ESLint and production build passed. Four targeted desktop/mobile tests passed for payment geometry, loaded NFT images, axe accessibility, horizontal overflow, collector validation and successful receipt persistence. Report: reports/e2e-payment-layout.
- New payment screenshots are regression baselines, not a claim of certified pixel-perfect equivalence. No full-suite or Lighthouse rerun was performed.

## Thank-you receipt and submission recovery — 2026-10-06

- Rebuilt confirmed receipt from the supplied frame and original exported icon; hid navbar/footer on order routes. Simulated-payment messaging and a real return-to-market action intentionally replace a fabricated Etherscan link.
- Removed automatic attempt recovery during a fresh order mutation; restoration remains enabled for attempts loaded after refresh. This prevents competing recovery/submission navigation. The exact fleeting user-reported error was not independently reproduced.
- TypeScript, ESLint and production build passed. Twelve desktop/mobile tests passed: thank-you screenshots, axe, icon loading, no API error responses during a successful purchase, receipt refresh persistence, collector validation, declined payment, timeout recovery, pending order recovery and wallet refusal/disconnect.
- Report: reports/e2e-thank-you. No full-suite or Lighthouse rerun was performed.

## Receipt footer fidelity — 2026-10-06

- Restored the supplied confirmation copy and `Ver no Etherscan` label, removed the visible metadata disclosure and demo control from the confirmed receipt, and refined the footer typography and spacing.
- The CTA reports the simulation on demand without opening a fictitious blockchain URL. The review dialog and README already explain that payment is simulated.
- TypeScript, ESLint and build passed. Six targeted desktop/mobile tests cover receipt screenshots, axe, the CTA notification, refresh persistence, collector fields and pending-order recovery. No full-suite or Lighthouse rerun. Report: reports/e2e-receipt-footer.

## Payment provider layout — 2026-10-06

- Applied the clarified reference: white breadcrumb, no visible extra payment heading, larger collector heading, compact ENS select, coupon link, fee hint and provider options. Removed the simulation footnote from this summary while retaining the pre-purchase explanation.
- MetaMask and Coinbase options perform simulated API connection; the compatibility row reveals the existing manual wallet/network and refusal controls. No external wallet SDK or real payment is used.
- TypeScript, lint and build passed. Eight targeted desktop/mobile tests passed for payment layout/axe, provider selection, collector validation, connection refusal/disconnect, receipt and refresh. Checkout screenshots were intentionally refreshed. Report: reports/e2e-payment-providers. No full-suite or Lighthouse rerun.

## Collector profile and wallets layout — 2026-10-06

- Reference-based account navigation, compact profile/avatar/password fields, split ENS input and main/secondary wallet sections. Original account icon exports remain pending; current outlines use Lucide.
- `npm run check`: TypeScript, ESLint and production build passed.
- Eight targeted desktop/mobile Playwright checks cover profile/avatar/password persistence and server validation, wallet creation/editing/primary selection, copying primary-wallet details into the new-wallet form, accessible menu/password controls, axe WCAG 2.1 A/AA checks inside the account main content, and no horizontal overflow. Visual baselines were refreshed for profile and wallets only; unrelated baseline pages remained stable.
- Report: `reports/e2e-account-layout`. This is a targeted verification, not a new full-suite or Lighthouse run.

## Original account icon exports — 2026-10-06

Ten supplied PNG assets replace the account-sidebar, default-avatar and hidden-password approximations. Export bytes, native dimensions and colors are preserved. The open-eye export was not supplied; its existing vector fallback remains.

`npm run check` passed. Six targeted Playwright checks passed across desktop/mobile, including actual image loading and native rendered width, account and authentication accessibility, password visibility and visual baselines. Only profile, wallets, login and signup captures changed. Report: `reports/e2e-original-account-icons`. No new full-suite or Lighthouse run.

## Catalog scroll continuity — 2026-10-07

`npm run check` passed. Eight targeted desktop/mobile tests passed for catalog URL/history, combined filters, sorting, pagination, refresh, variable-latency recovery and the new scroll regression. Filter changes retain a nonzero catalog viewport; pagination scrolls to the catalog section rather than the hero. Report: `reports/e2e-catalog-scroll`. No new full-suite, screenshot-baseline update or Lighthouse run.

## Mobile catalog reference — 2026-10-07

Applied the four original mobile PNG exports (home, filter, cart, explore), translucent center navigation, reference hero typography/background and staggered card geometry. Favorite actions share account-scoped REST/cache/optimistic rollback with detail; rare badges use NFT rarity metadata, refreshed for existing mock databases without losing business state. Initial fourth artwork now uses the golden ape reference.

Validation: TypeScript, ESLint and production build passed. Targeted catalog/favorites/scroll checks passed (11 tests; 3 desktop skips for mobile-only cases). Additional visual/geometry/accessibility run passed (6 tests; 2 desktop skips). Verified home at 390 and 414 px, no horizontal overflow, and zero Axe violations on the authenticated mobile catalog. Updated home mobile and desktop home/detail/cart snapshots for the intentional artwork change. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Mobile favorite indicator refinement

The catalog heart is visible for saved NFTs and cards with keyboard focus/hover (on devices that support hover). Unsaved idle cards hide the action and disable its pointer target. Detail remains the accessible touch entry point for favoriting. Reduced motion disables the fade. Verified focus reveal, persistence, failure rollback, visual baseline and Axe on mobile.

### Mobile hero and account export refinement

Applied the original 14 × 17 px account PNG to bottom navigation. Replaced stretched background ellipses with two intersecting circles, adjusted brown tones and copy spacing, and rendered the three decorative dots as 7 px circles with 6 px gaps. Kept the hero at 190 px height and matched the reference three-line description. TypeScript/lint/build and targeted mobile visual, geometry and favorites/Axe checks passed.

### Mobile active tabs and bottom navigation curve

Equalized tab padding across active/inactive states to prevent text displacement. The navigation background now has a 48 px circular concavity around its 64 px center action. Raised that action to the reference position and removed backdrop blur so its existing translucent gradient reveals underlying content. The cutout is confined to a decorative pseudo-element; links retain their touch targets and keyboard focus. Verified mobile tab selection/alignment, center navigation, favorites/accessibility and visual baselines.

### Equal hero circles and smooth bottom concavity

Both intersecting hero circles now share a 280 px diameter, with distinct centers. Enlarged the mobile explore arrow to 16 px. Replaced the radial cutout with an SVG mask whose cubic curves meet the horizontal navigation edge smoothly. Enabled viewport-fit=cover and included the bottom safe-area inset in navigation height/padding. The reported lower strip was not reproducible in the controlled browser: both the previous and new build stayed flush at viewport bottom without horizontal overflow at 320, 360, 368, 390 and 414 px, at top/end of page. Mobile visual, favorites/Axe, tabs and geometry regression checks passed.

### Mobile shoulder radius and RARO width

Widened the smooth shoulder transitions around the center navigation action while preserving its position and bottom cutout depth. The RARO label now spans 68 px, with 8 px left padding and the same 32 px height as the reference. Verified production build and updated mobile visual baselines/geometry.

### Mobile NFT detail reference

Matched the mobile gallery spacing, beige back/favorite/cart controls, compact title with illustrative rating, short description, edition order, transparent edition buttons, metadata spacing and rounded purchase panel. The original mobile cart asset is reused. Stock feedback stays available to screen readers. Added a semantic section heading without changing the visual design.

Validation: TypeScript, ESLint and production build; targeted desktop/mobile detail, favorites rollback and visual baseline checks, plus Axe and a mobile add-to-cart journey with quantity verification. Only the mobile detail snapshot changes. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Mobile detail layering and quantity controls

Raised the mobile collector sheet above the overlapping artwork using its grid stacking order, preserving the favorite control's gallery alignment. Increased back/favorite circles to 40 px. Quantity controls now have the reference vertical capsule shape in mobile detail and cart. Cart keeps its 44 px touch targets while rendering an 18 × 28 px capsule. Verified detail/cart purchase and quantity journeys, Axe accessibility, TypeScript/lint/build and intentional detail/cart screenshot updates.

### Fixed mobile purchase panel and back alignment

Mobile detail purchase controls stay fixed at the viewport bottom with four rounded corners and a safe-area offset. Reserved bottom page space keeps the last description reachable; overflowing error content can scroll within the panel. The back control uses a centered SVG chevron rather than a font glyph. The RARO label uses the already loaded 500 weight.

TypeScript, lint and production build passed. Desktop/mobile visual and detail purchase checks passed (4 tests; 2 profile skips). Additional mobile regression and baseline comparison passed (2 tests; 1 desktop-only skip), checking fixed placement while scrolling at 320/390 px, no horizontal overflow, reachable final description, centered back icon, Axe and cart quantity.

### Mobile cart reference and quantity badge

Added the missing mobile cart quantity badge, compact back/title header, edition metadata and orange unit prices. Matched rounded mobile rows, the separate capsule coupon input/button and the summary background. Quantity and delete controls use separate positions without copying the reference overlap; narrow screens stack the control row. Simulation notes remain in documentation and checkout confirmation; the extra visible cart note is removed on mobile.

Errors no longer auto-dismiss after ten seconds; users can close the notification or see the next action's feedback. The reported fleeting error was not reproduced in normal flows, so no specific root cause is claimed. A forced server error preserves quantity and its message stays readable beyond eleven seconds.

TypeScript/lint/build passed. Targeted desktop/mobile cart actions, coupons, deletion, Axe and visual baselines passed (6 tests; 2 desktop skips for mobile-only regressions). Verified quantity badge across navigation/removal, four cart items, 320/390/414 px, no horizontal overflow and no overlap between increment and delete. Only the cart mobile baseline changed. New evidence: reports/e2e-mobile-cart-reference and reports/mobile-cart-four-items.png. Full-suite/Lighthouse remain pending for final handoff.

Mobile NFT purchase panel follow-up: only the top corners stay rounded. The panel background reaches the viewport bottom, with safe-area spacing inside its bottom padding. Production build, mobile visual comparison and fixed-panel purchase/accessibility regression passed.

### Recovery before writes during active browsing

Reproduced a concrete connection failure by stopping the Service Worker and immediately adding an NFT without waiting thirty seconds or navigating through a GET first. The pre-fix mobile regression failed and displayed “Não foi possível conectar. Tente novamente.” This proves a recoverable transport failure; it does not establish that every previously reported brief notification had the same cause.

Added a read-only demo health handshake before writes. A missing/invalid handshake reactivates the worker before sending the mutation. Healthy concurrent mutations share the check; writes are never automatically replayed. Existing GET recovery, session validation, business error scenarios and checkout idempotency remain intact. Also corrected bottom spacing so the fixed detail purchase panel does not cover the demo trigger.

TypeScript, lint and production build passed. Final targeted recovery/cart run: 18 passed, 2 desktop skips for mobile-only cases. Both profiles cover short and long inactivity, one-write delivery, invalid-response/no-replay, socket interruption/order recovery, stale quote review, wallet refusal, variable latency, cart count and readable business failures. Reports: reports/e2e-write-recovery. Full-suite/Lighthouse remeasurement remains pending for final handoff.

Additional payment validation: four desktop/mobile checks passed for declined payment and recovery after order creation timeout; two confirmed-receipt checks passed with zero API failures, zero error notification, Axe and persistence on refresh. The receipt test now uses a deterministic clock to avoid midnight date drift, and tolerates at most eight thumbnail resampling pixels (observed difference: six pixels confined to the artwork). No receipt UI or baseline was changed. Final validated executions for this change total 24 passes plus two profile skips.

### Mobile wallet-payment reference

Replaced the long mobile collector/quote layout with the supplied wallet-payment composition: back button/title, registered-wallet cards, three provider choices, right-aligned quote total and bottom confirmation button. Collector fields remain editable through the wallet menu and preserve REST validation. No example wallet or static financial value is inserted to match the screenshot. Removed the global demo-scenario trigger from checkout on both profiles; the existing confirmation still makes the simulated transaction explicit.

TypeScript, lint and production build passed. Targeted final verification: 13 passed and one desktop skip for a mobile-only case, covering payment layout/Axe, 320/390/414 px, total above confirmation, collector edit/validation and receipt persistence, wallet rejection/disconnection, stale quote review, confirmed receipt and visual routes on both profiles. Evidence: reports/e2e-mobile-payment-reference and reports/mobile-payment-connected.png. Updated mobile payment and both checkout-page baselines intentionally. Also refreshed the mobile detail baseline to include the previous commit's extra demo-trigger spacing (no detail UI change in this task). An intermediate overlapping Playwright execution collided in trace output; the final single execution verifies the cases together. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Remove normal-page diagnostic trigger and refine mobile controls

Removed the “Cenários de demonstração” trigger from normal navigation on every page. Diagnostic controls remain available only through explicit `demo=1` URL opt-in, documented in README. Updated E2E fixtures to invoke mock endpoints without requiring visible diagnostic controls; Socket.IO events remain on the current screen. Added a soft upward shadow to the fixed mobile purchase panel and joined the mobile coupon input/button into one capsule, with white text and a dark-to-light brown gradient. The gradient retains sufficient white-text contrast; focus feedback stays on the shared capsule.

TypeScript/lint/production build passed. Targeted cart/detail/recovery and visual run: 14 passed, two profile skips. Verified adjacent input/button geometry, coupon application/removal, quantity/purchase, Axe, fixed-panel placement, socket reconnection, stale quote review and network recovery. Updated normal-page visual baselines to remove the trigger and reflect the two mobile refinements; checkout did not change. Evidence: reports/e2e-clean-ui. Final visual comparisons and diagnostic opt-in checks: four passed, reports/e2e-clean-ui-visual. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Mobile checkout/cart typography

Centered the wallet-payment title in a symmetric three-column header and increased it to 18 px. Wallet section/link text is 14 px, with the reference's fixed section heading “Carteira conectada”; a separate accessible status exposes pending/active connection, and confirmation stays disabled until REST connection succeeds. Payment total label/value are 14/18 px. Mobile cart breakdown labels/values are 14 px, total value 16 px and checkout CTA text 16 px. The cart summary remains in document flow: the screenshot does not prove fixed positioning, and coupon/errors can change its height. Existing rounded corners remain; square lower corners would apply to a panel actually anchored to the viewport bottom.

TypeScript/lint/build passed. Nine targeted desktop/mobile cases passed, one desktop skip for a mobile-only case. Covered payment header centering and no overflow at 320/390/414 px, disconnected/connected purchase gating, collector validation and receipt, quantity/coupon/removal, Axe and visual page baselines. Only mobile cart/checkout and payment component snapshots changed. Evidence: reports/e2e-mobile-payment-type; reports/mobile-payment-connected.png refreshed. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Decimal-discount receipt, logout/notice and mobile authentication

Fixed confirmed-receipt rendering for fractional discounts: the UI now compares `wei(discount)` rather than passing a decimal ETH string to `BigInt`. Existing saved orders are readable without resetting data. Added a coupon purchase regression with 0.357 ETH discount and receipt persistence after refresh on both profiles.

Voluntary logout now guards the session-expiry effect and navigates home before replacing private query state. Notification dismissal prevents pointer focus/outside-click propagation to an open modal; shared/auth dialogs also ignore notification interactions. Verified normal desktop dismissal and the reported mobile case of dismissal while login is open. Genuine expiry still preserves checkout context and isolates account data.

Repositioned equal 340 px hero circles with separated centers and a visible intersection on mobile. Mobile login/signup match the supplied composition with adjusted logo/field/CTA spacing, social separator lines, footer navigation and a confirmation-password visibility control. Desktop login/signup baselines remain unchanged. Mobile auth baselines changed intentionally; screenshot evidence: reports/hero-intersection.png.

Final targeted execution: ten tests passed for decimal-discount purchase, voluntary logout, mobile notification/modal preservation, genuine session expiry, auth keyboard/password/Axe and visual routes on both profiles. Report: reports/e2e-order-auth-final. Intermediate failures included tests expecting absent notices after full-page expiry reload and a home URL without normalized search parameters; corrected fixture assertions. A desktop toast expires while the login navigation waits, so desktop dismissal is tested on home and the modal-preservation regression on mobile. TypeScript, lint and build passed. Full-suite and Lighthouse remeasurement remain pending for final handoff.

### Mobile account navigation

The phone layout now shows two persistent route links, Perfil and Carteiras,
with the active route highlighted. Secondary reference menu entries sit inside
native keyboard-accessible details/summary (Mais opções), collapsed initially.
Logout stays separate in the account header. Desktop retains its sidebar and
all entries remain visible. Secondary entries keep their existing unavailable
section feedback; this UI change does not introduce new account features.

Validation: TypeScript, ESLint and production build; account navigation via the
actual links, Enter activation of Mais opções, password visibility, Axe on
profile/wallet forms, horizontal overflow checks, logout regression and visual
baselines on desktop and mobile. Only the two mobile account snapshots changed.
