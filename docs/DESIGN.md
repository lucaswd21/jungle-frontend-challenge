# Design reference and implementation status

Payment refinements (2026-10-06): white mixed-case breadcrumb, visually hidden page heading, larger collector heading and compact ENS selector follow the latest supplied reference. The order summary includes the coupon link, launch discount, estimated-fee hint and provider rows. Selecting MetaMask or Coinbase invokes the simulated connection API; the first compatibility row expands the existing manual wallet/network and approval/refusal controls when needed. No real wallet integration is claimed.

Reference: [Frontend Challenge — Copy](https://www.figma.com/design/s5h7MFeAxlZJ4xEOjX6RqN/Frontend-Challenge--Copy-?node-id=0-1).

## Confirmed and applied

The source uses **Roboto Mono**, regular 400, medium 500 and bold 700. These weights are self-hosted through `@fontsource/roboto-mono`, with no external font request. The source color variables below map to semantic CSS and Tailwind tokens (`background`, `foreground`, `primary`, `accent`, `surface-card`, `surface-raised`, `border`, `border-soft`, `secondary`, `muted`).

| Source token   | Hex       |
| -------------- | --------- |
| Background     | `#140D0A` |
| Foreground     | `#F5F1EB` |
| Primary        | `#D28A4C` |
| Text accent    | `#E89B55` |
| Secondary      | `#B39463` |
| Text secondary | `#CFB28C` |
| Surface card   | `#241612` |
| Surface raised | `#2F1D15` |
| Surface dark   | `#38220F` |
| Border         | `#3F2319` |
| Border soft    | `#55321F` |

Functional errors, warnings and success feedback keep semantic status colors; those states were not specified in the retrieved source screens. Original token values are documented here rather than claiming every state was present in Figma.

## Inspected source screens and assets

The user's exported full Figma canvas supplies all desktop and mobile references, including the catalog, detail, cart, checkout, receipt, sign-in, sign-up, profile and wallets. Desktop references use 1440 px, mobile frames 414 px. Narrow 320 px and tablet layouts extend those references without horizontal overflow.

`public/assets/kurio` contains the original hero, Emerald, Sage, Vessel, Golden, wordmark PNG and supplied message/close/arrow/search/user/shop SVGs. Artwork is served as high-quality WebP (quality 95, method 6, exact alpha), re-encoded from the original exports without recoloring or generated replacements. The final pass reduces the five artwork files from 492,882 to 120,552 bytes (75.5%). Dimensions and alpha channels are unchanged; compression is perceptually high quality, not pixel-lossless. Original PNGs remain available. Per-asset checks are in reports/image-optimization.json. The flattened Products image and full canvas are reference material, not rendered UI.

Named CSS sections implement the three-column catalog/sidebar on desktop, staggered two-column grid and bottom navigation on mobile, hero composition, detail gallery/edition controls, native quantity input with step buttons and token metadata, desktop authentication overlays and standalone mobile forms, cart summary, checkout and account layouts. Forms and overlays remain interactive components.

## Scope and remaining visual differences

### Cart reference refinement

The supplied cart screenshot guides compact brown item rows, aligned NFT/price/edition/total columns, token identifiers derived from each artwork's displayed number, minus/input/plus controls, a trash action, the promotion form inside the wallet summary and the related-artwork section. The desktop title remains available to screen readers while the visible breadcrumb follows the reference. Mobile preserves the dedicated responsive cart and touch-sized controls. Shared checkout summary defaults are unchanged. The demonstration notice stays accessible on desktop and visible on mobile/checkout. Data and totals remain API-derived; the example's three items and quantities are not silently added to users' carts. Exact matching is not certified, and fallback trash/social icons remain documented.

Catalog ordering now displays the requested `Ordenar por:` label on desktop and mobile.

The cart trash icon now uses the user's original Figma `Desktop/Iconly/Curved/Delete.png` export, preserved byte-for-byte at `public/assets/kurio/delete.png` (18×20, transparent). It replaces the Lucide fallback without filters or recoloring. Scoped dimensions keep artwork-image sizing rules from stretching this icon, including on mobile. The removal button's accessible name and mutation are unchanged.

### NFT detail reference refinement

The desktop detail now follows the supplied screenshot composition: narrow vertical thumbnails, a 444px artwork panel, price alongside ratings, summary before editions, quantity/purchase/favorite on one line, token metadata and sharing, followed by details/reviews controls and network/contract information. Mobile keeps its dedicated responsive composition. Emerald Ape thumbnails use the original Emerald Ape exports rather than unrelated NFTs; stored catalog image metadata is refreshed without resetting accounts, carts or orders.

The reference's nineteen reviews are explicitly illustrative, not fabricated API reviews. The reviews panel explains this limitation. Sharing supports LinkedIn, email and copy-link; exact missing social icons/alternate artwork exports remain visual differences. Scoped `src/styles/detail.css` keeps the reference-specific adjustments separate from other pages. Purchase, editions, quantity, favorites and image enlargement retain their existing handlers.

Refinement: the desktop search SVG is displayed in white through a scoped CSS filter, preserving the original file. Ordering resets the shared form label margin and uses matching line heights. Criadores targets Diário da Cunhagem; Aprenda targets the lower wallet/security/creator information block. The scroll indicator follows this same top-to-bottom order.

This implementation targets the exported design but has not been certified as a pixel-for-pixel match. Regression baselines compare the application to its own reviewed screenshots; they are not automated Figma diffs.

- The supplied SVG set and the subsequently provided cart/login PNGs are original; their exported dimensions/colors are preserved. Other navigation/wallet icons use Lucide fallbacks. Footer social icons are recognizable inline SVGs; exact provider/social exports would further improve fidelity. Social destinations are explicitly platform homepages, not invented KURIO profiles.
- The sort control now has sufficient width, aligned label/value and dark native options. The operating system/browser still controls a native select popup, so its open-menu pixels are not guaranteed identical across platforms.
- Home navigation underlines follow the visible section; other pages follow their route. Desktop login opens over the mounted page. Dialog fades are 180 ms opening/140 ms closing; route fades use the browser View Transition API at 180 ms, with instant fallback where unsupported. Reduced-motion disables the fades and smooth scroll.
- The first nine catalog names/prices follow the desktop design. Additional mock entries reuse the provided artwork to exercise pagination, filtering and unavailable states.
- Checkout, profile and wallet forms include the reference fields with API validation/persistence. Account defaults, connection approval/refusal controls, optional biography and recovery feedback extend the static reference. Some form composition and copy differ; mobile keeps the full editable checkout form and catalog order follows the same API sort as desktop.
- Non-design loading, errors, session expiry, declined payment and reconnection states use the same tokens and accessible feedback.
- Social sign-in and wallet connection are explicitly simulated. No real provider, wallet, email or payment integration is claimed.

The integration's Starter quota originally prevented complete MCP inspection. The user-supplied canvas and assets allowed visual work to continue without relying on broken asset downloads.

### Coupon and collection pagination
The cart promotion field follows the supplied crop: Código promocional label, 40px joined input/button on desktop, gold border and secondary-colored placeholder. Mobile uses 44px controls. Removal is a separate button so an applied coupon cannot disturb alignment.
RelatedCollection now uses native keyboard-accessible pagination buttons instead of decorative text. Up to 15 real catalogue entries from the first two API pages are grouped into five-card pages. The initial reference cards are retained, active dots are filled and inactive dots outlined (12px). Page count derives from returned data, with no duplicated or invented NFT entries and no autoplay. API results are cached by TanStack Query.

Coupon focus is drawn inside the input with an accent border and inset shadow. The external global outline is overridden only for this input; the field retains a visible focus indication without changing layout or extending over the label/button.

The navbar profile icon uses the same white filter as the search icon, scoped to the header profile link. Original SVG shapes and profile content icons are preserved.

Browser tab titles use a single Portuguese route-label map in Layout, followed by ` | Kurio`. Home: Mercado de NFTs; details: Detalhes do NFT; cart: Carrinho de NFTs; login: Entrar; signup: Criar conta; checkout: Finalizar compra; order: Detalhes do pedido; profile: Meu perfil; wallets: Minhas carteiras. Unknown routes use Página não encontrada. The initial HTML title matches the home route. Titles depend only on the pathname; query parameters never become labels.

The footer community block follows the reference with Facebook, Instagram, Twitter, LinkedIn and YouTube, each in a 32px outlined button with an accessible external link label. The compatible-wallet chip is a flex row sized to the community block, with the three wallet names distributed across its width.

The auth dialog keeps the Figma desktop structure: centered Entrar | Criar conta tabs, intro, email/password fields, forgot-password control, primary action and social buttons. The post-form `Novo na Kurio? / Crie uma conta` prompt and expandable demo-account block were removed because they are not part of the supplied Figma modal. Signup remains available through the top tab and route.

The signup variant now follows the supplied frame copy and rhythm: `Crie seu perfil de colecionador e conecte uma carteira quando quiser.`, `Nome de usuário`, `Criar conta`, 52px field cadence, 45px primary action and 40px social actions. The separator uses the reference rules, Google uses the four-color mark, and the password field includes an accessible show/hide control. The API contract still receives the same `name`, `email` and `password` values.

Auth placeholders use the reference secondary-gold token (`#B39463`) rather than the browser's light default. The desktop intro copy intentionally uses a wider centered measure than the fields, matching the supplied frame where the sentence extends slightly beyond the input edges.
# Thank-you receipt refinement (2026-10-06)

The supplied thank-you frame is rendered as a standalone compact card without the marketplace navbar or footer. The original exported 80×80 icon is stored at `public/assets/thank-you.png`; NFT images stay dynamic. Transaction facts, edition quantities and totals come from the persisted order, not screenshot constants. The review dialog remains a safety step before submitting an order.

The receipt copy and `Ver no Etherscan` CTA match the supplied design. Simulation is explained before purchase and in the README; clicking the CTA shows an accessible notification instead of opening a fabricated blockchain transaction. Extra collector metadata remains available to assistive technology and persisted in the order, without a visible disclosure. Demo controls are hidden on the confirmed receipt; pending and declined orders retain their recovery/status UI.

## Account references (2026-10-06)

The account sidebar follows the supplied reference labels, outlined icons, selected marker and separate sign-out row. Profile and wallets share the same compact two-column fields, split ENS control and mobile single-column layout. Avatar changes keep the validated file upload behind an accessible Alterar button; password visibility is independently controlled for each field. Wallets retain API-backed creation, editing and primary selection beneath the main/secondary headings.

Profile save and optional biography remain separate from password changes so saving personal details never requires entering the current password. Wallet management and primary selection remain available for the required account flows. The remaining sidebar sections have no defined implementation in the challenge and display an availability message rather than routing to unrelated pages. Sidebar, default-avatar and hidden-password icons now use the ten original PNG exports supplied on 2026-10-06, retaining their native dimensions and colors. The visible-password eye still uses the existing vector fallback because its export was not supplied.

Catalog URL updates disable automatic route scroll reset. Filters, search, ordering and tabs retain the current viewport; explicit pagination scrolls to the start of `#catalog`, respecting reduced-motion preferences. Search state and browser history still use TanStack Router.
