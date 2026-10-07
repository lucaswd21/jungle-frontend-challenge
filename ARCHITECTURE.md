# Architecture and decisions

## Small SPA, explicit responsibilities

Vite + React + TypeScript meets the mandatory stack without adding SSR infrastructure or a backend. TanStack Router owns route/search state and guards. TanStack Query owns remote data. Axios is the single HTTP client. Tailwind and the adapted shadcn Button/Dialog composition provide styling and accessible primitives. Local component state is limited to forms, edition choices, wallet connection state and dialogs.

This is not a Vue application translated mechanically. Hooks compose behavior; Query replaces the temptation to place every remote resource into a global store; effects exist for subscriptions, focus, session lifecycle and cleanup. No Redux, dependency injection framework or generic repository layer is required.

## Network simulation boundary

React and hooks do not return fixture responses. Axios calls REST endpoints intercepted by MSW. `database.ts` holds the simulated server state and `handlers.ts` implements validation/authorization/business rules. `socket.ts` publishes changes from the same state mutations, using MSW's WebSocket handler and the published `@mswjs/socket.io-binding` 0.2.0 `toSocketIo` wrapper. HTTP and events cannot independently invent different catalog values.

MSW 2.15.0 is selected for compatibility with the binding's `^2.10.2` peer range. The binding's current GitHub main has a newer, unpublished `SocketIo` API; this implementation deliberately uses the installed version's documented API. MSW 2.15 normalizes `/socket.io/` to `/` when matching connections, so the handler matches the origin root while the real client uses the normal Socket.IO path.

Application and mock modules download concurrently. React renders only after MSW starts, and the realtime hook imports socket.io-client after mount. This removes a download waterfall while preserving interception: engine.io-client captures the global WebSocket constructor at import time, so importing that client before the mocks start would bypass interception even if REST mocks work.

`api/mockRecovery.ts` keeps a small optional recovery hook and a shared in-flight promise; it does not import MSW into the real-backend path. The browser mock registers the hook and reactivates its transport after tab visibility resumes. Axios waits before API traffic after an idle gap, and can recover/retry a non-JSON GET once. POST/PATCH/DELETE are never automatically replayed: an invalid response does not prove a write failed. Recovery uses MSW's lifecycle methods, never modifies the generated worker, and does not reinitialize database state. A real expired session still follows the normal login flow.

Axios rejects successful responses with a non-JSON content type, including an HTML SPA fallback with HTTP 200. The cart endpoint also validates its items array and positive integer quantities before accepting Query data. The header tolerates a missing list and reports query failure; the cart page exposes retry rather than treating malformed data as an empty cart. Session success gates private/guest cart queries to avoid a premature identity request. This addresses the captured undefined `.reduce` failure without assuming its original upstream cause was proven.

The transport is WebSocket-only, default namespace, JSON/text events. `toSocketIo` provides protocol encoding/decoding and a simulated handshake; the mock explicitly sends an Engine.IO ping every 10 seconds. No polling fallback, rooms, namespaces, binary events or acknowledgements are required. Network reconnection is real socket.io-client behavior over intercepted WebSockets. This simulates protocol behavior, not actual distributed sockets, blockchain or external infrastructure.

## Session and privacy

The simulated server issues a random token with a 30-minute expiry. Axios captures the bearer token at request dispatch; handlers authorize that captured token rather than reading whichever account happens to be current when an asynchronous response completes. This avoids attributing a late mutation to a newly signed-in user.

Session query refreshes on navigation guards, focus and a 15-second interval. A protected response of 401 invalidates it. Active private pages redirect to sign-in with a validated local return destination when the session ends. A 403 displays a permission error instead of retrying blindly. Context and server-side cart remain available for reauthentication.

Query keys include userId for private resources and all URL parameters for list resources. Logout cancels requests, clears the Query cache and closes the previous socket. Account changes evict previous private keys; old event callbacks are marked inactive. Order handlers verify ownership rather than trusting route IDs. Favorite optimistic snapshots are scoped to the current user.

Passwords are salted PBKDF2/SHA-256 hashes; fixtures are fictitious. The 10,000-iteration choice keeps deterministic browser simulation responsive and is not production password-hardening guidance. The complete mock database is visible/editable in localStorage; this is intentionally a demo, not a secure production backend. A real backend would own session cookies, password verification, database transactions and authorization. Client-side hashes do not make localStorage a secure account database.

## Cart and exact money

The visitor cart is separate from each authenticated cart. Sign-in merges equal NFT/edition lines, clamps to availability, and consumes the visitor cart. Logout does not leak the previous user's cart into the next session.

Quantities are positive integers. Prices are decimal ETH strings with at most 18 decimals. A central utility converts to wei as BigInt, performs arithmetic and converts back to strings. Never add money using JS floating-point numbers. Display retains exact precision rather than rounding silently. Coupon discount rounds down to wei. The server quote is authoritative; the interface displays its subtotal, discount, fee and total.

Cart state and quote are separate resources. Stock/price events invalidate quote and catalog while preserving selected items; invalid availability remains visible with an actionable error instead of silently removing a line.

## Purchase consistency and idempotency

Review captures a quote signature. Before submission the client fetches a fresh quote; if it changed, another review is required. The server revalidates the same signature again to close the gap between client check and POST. Stock is reserved atomically in the mock handler before a pending order is returned. Decline restores reserved stock.

An attempt key and its exact payload persist by user. A synchronous ref prevents two clicks in the same render from generating two keys. The server indexes attempts by user/key and verifies identical content. A replay returns the original order; changed content returns 409. Mutations are not automatically retried with new keys. After uncertain transport failure, recovery looks up the existing order first. Refresh at checkout recovers the stored attempt.

Orders persist their terminal status, immutable quote, registered wallet and full collector form snapshots plus a dueAt timestamp for simulated settlement. Socket notification and REST polling both discover the same result. If the page closes before a timer runs, a later order GET settles due orders. Confirmed and declined are terminal. Confirmation UI renders only the server's confirmed status.

Confirmation subtracts purchased quantities from the current cart instead of clearing the cart wholesale. This preserves lines/quantities added after submission. Catalog updates never edit the stored quote/receipt.

## Cache, retries and ordering

Default staleTime 15 seconds and gcTime 5 minutes reduce redundant reads while retaining useful back-navigation data. Session uses 10 seconds plus an expiry poll. GET queries retry at most once for transient errors; no retries on 4xx. Mutations have zero automatic retries. Order queries poll every second only while pending, covering missed events without polling terminal receipts indefinitely.

Axios receives Query's AbortSignal for GET requests. Catalog keys include normalized search, combined category, sort and page; obsolete requests are canceled/isolated and cannot overwrite a newer parameter set. Filters reset page to 1. Router navigation restores state through browser history and refresh.

Favorite mutation cancels its query, snapshots the previous list, applies optimistic change and restores the snapshot on failure; settlement reconciles with REST. Cart mutations update the returned cart and invalidate quote. Profile/wallet writes synchronize their resource and session when needed.

Socket subscriptions maintain seen event IDs and highest resource versions. Older/duplicate events are ignored. An order cannot be regressed from terminal to pending. Reconnect invalidates active catalog/details/cart/quote/order queries, using REST as the authority. Listeners, timers and connections are cleaned up when their lifecycle ends.

## Accessibility and performance

Desktop header authentication is local dialog state, not a route navigation. The existing Outlet/catalog stays mounted and its URL, filters and scroll remain intact; direct auth routes reuse the same form. Radix presence keeps close animation alive before unmount and focus returns to the trigger. Catalog tabs are pressed-state buttons whose URL changes go through the simulated API. Navigation scroll tracking is requestAnimationFrame-throttled and removes listeners/observers on cleanup.

`Account.tsx` orchestrates profile/account state; password and wallet forms own their focused responsibilities in `features/account`. The checkout consistency state remains together instead of introducing another abstraction layer. `style.css` imports `styles/base.css`, `market.css` and `pages.css` in the original cascade order. Tailwind handles component utilities; semantic CSS remains appropriate for reference-specific layouts and responsive rules.

Radix manages dialog modality, trapping focus and Escape. The controlled review dialog explicitly restores focus to its review button. Route transitions move focus to main, while initial loading leaves the skip link available as the first tab target. Inputs have labels and field errors; global feedback uses a dismissible Portuguese polite live region. The Query mutation cache reports rejected writes consistently alongside inline field errors; repeated messages restart their visibility timer. Stock and validation states have text, not just colors.

Pages other than the catalog use TanStack Router lazyRouteComponent; guards remain eager. Socket.IO is dynamically imported after identity resolution, scheduled during browser idle time with a one-second fallback deadline, and still cleans up on account changes. Mobile avoids mounting desktop-only content and closed filters. The first visible catalog images are eager/high priority; subsequent artwork is lazy. Default mocks add no artificial delay; explicit slow/variable/timeout scenarios retain their network behavior.

Catalog/detail/summary use dimension-preserving shimmer skeletons. Reduced motion disables animation. Self-hosted fonts and high-quality WebP artwork avoid remote dependencies. Original PNG exports remain included; WebP quality 95 preserves dimensions and transparency while reducing transfer size. See reports/image-optimization.json. Supplied SVGs and Lucide fallbacks are documented in docs/DESIGN.md. Audit code uses the actual production build and default scenario, without omitting mocks/assets or disabling functionality for scores.

## Known limitations and visual deviations

- Original assets and exported desktop/mobile references are integrated; visual baselines establish regression stability, not certified pixel equality. Remaining icon/form differences are documented in docs/DESIGN.md.
- Public production is hosted on Vercel; deployment-specific evidence and smoke-check scope are in docs/VALIDATION.md.
- Mock persistence is browser-local and does not implement transactions across multiple tabs or devices. The protocol simulation supports one active demo account per browser storage context. Tests use isolated contexts.
- This SPA includes metadata but does not perform SSR; deep-link SEO is limited compared with prerendering. A production marketplace would have a different backend and rendering strategy.
- Editorial/support/activity/offers/download pages are intentionally excluded. External challenge link is real; transaction identifiers are clearly simulated rather than falsely linked to a real explorer.
