# REST and event contracts

Base `/api`, JSON requests/responses. Axios sends `Authorization: Bearer <token>` when a session exists. Types are defined in `src/api/contracts.ts`. ETH is a decimal string, quantities and versions are integers.

| Method / endpoint           | Request                                               | Response / behavior                                   |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| GET `/session`              | captured token                                        | `{user, expiresAt}`; anonymous user is null           |
| POST `/session`             | `{email,password}`                                    | session; visitor cart merge                           |
| DELETE `/session`           | token                                                 | revoke that session                                   |
| POST `/accounts`            | `{name,email,password}`                               | created session; 409 duplicate email                  |
| GET `/nfts`                 | `q,category,sort,page,minPrice,maxPrice,network,view` | `{items,total,pages}`; 9 items/page                   |
| GET `/nfts/:id`             | ID                                                    | NFT with editions, stock and version; 404 missing     |
| GET `/favorites`            | authenticated                                         | NFT IDs                                               |
| POST `/favorites`           | `{id,active}`                                         | updated NFT IDs                                       |
| GET `/cart`                 | visitor or authenticated                              | `{items,coupon,version}`                              |
| POST `/cart/items`          | `{nftId,editionId,quantity}`                          | add quantity; updated cart                            |
| PATCH `/cart/items`         | same                                                  | set quantity; stock validation                        |
| DELETE `/cart/items`        | same identity in body                                 | remove edition line                                   |
| GET `/quote`                | current cart                                          | lines, signature/id, totals and issues                |
| POST `/quote/coupon`        | `{code}`                                              | validated updated quote; empty string removes         |
| POST `/orders`              | CheckoutInput + `Idempotency-Key`                     | pending/existing order; 409 changed quote/key payload |
| GET `/orders/attempt/:key`  | authenticated                                         | same user's order; 404 if absent                      |
| GET `/orders/:id`           | authenticated                                         | owned order; 403 another user's order                 |
| GET `/profile`              | authenticated                                         | User                                                  |
| PATCH `/profile`            | `{name,email,avatar,bio,username?,ens?,walletAlias?}` | confirmed User; avatar data URL PNG/JPEG/WebP <=500KB |
| POST `/profile/password`    | `{current,password}`                                  | `{ok:true}` after verified password change            |
| GET `/wallets`              | authenticated                                         | Wallet[]                                              |
| POST `/wallets`             | `{id?,label,address,network,primary}`                 | Wallet[]; at most two; update by owned ID             |
| POST `/wallets/:id/connect` | `{network,approve}`                                   | `{connected}`; simulated connection decision          |

A quote includes `lines[{nftId,editionId,quantity,name,edition,image,unitPrice,total,available}]`, `subtotal`, `discount`, `fee`, `total`, `coupon`, `issues`, and a stable signature over quoted values. In the demo the signature itself is used as quoteId, keeping stale-quote rejection explicit without a separate quote table. Production would use a signed/opaque quote ID and expiry.

CheckoutInput: `{quoteId,walletId,network,collector:{name,email,username,profileName,address,secondary,provider,referral,ensSuffix,note},connected}`. The address must match the owned registered wallet. Username/profile name/referral/provider and ENS suffix are validated; optional secondary address accepts a valid 0x address or .eth name, and notes are limited to 500 characters. Wallets accept optional displayName/profileName/email/provider/referral/ens/secondary metadata, validated when present. These are demo metadata, not verified external identities or ENS resolution. Order: `{id,userId,status,version,quote,collector,wallet,transaction,createdAt,reason?}`. All order financial fields belong to the creation snapshot.

Errors: `{code,message,fields?:Record<string,string>}`. Statuses: 401 invalid/expired session, 403 ownership/permission, 404 resource not found, 409 conflict, 422 validation, 503 transient failure. Network error and timeout scenarios have no successful HTTP result to trust.

## Events

| Event           | Payload                                     | Reconciliation                                                               |
| --------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `nft.updated`   | `{eventId,resourceId,version,nft}`          | update newer detail; invalidate catalog/quote                                |
| `order.updated` | `{eventId,resourceId,version,userId,order}` | update only matching user; refuse terminal regression; invalidate cart/quote |

`eventId` is stable on duplicate replay. Versions are monotonic per resource. Older-event scenarios carry a deliberately stale price/stock or pending order snapshot, not merely a changed timestamp. Connections use `socket.io-client`, MSW WebSocket interception and Socket.IO binding. A new connection reconciles active resources with REST; subscription cleanup prevents a previous session's listener from applying data.

## Mock-only controls

`view=new` selects the first twelve fixture entries; `view=trending` uses a stable fixture-derived popularity order. Omitting view means all entries. Filters are combined first; explicit price sorting overrides the default/trending ordering. Tab changes reset page to 1 and survive refresh/history.

The `invalid-cart` scenario returns JSON without the cart contract. `html-response` returns an HTML document with HTTP 200. These deliberately exercise transport/schema rejection and UI retry, without corrupting persisted cart data. `standard` restores normal responses.

POST `/demo/scenario` with `{scenario}` selects a named reproducible scenario. POST `/demo/event` with `{kind}` mutates mock state/emits protocol events. POST `/demo/reset` restores the known fixture. These endpoints are deliberately part of the demonstration network layer and have no production meaning.

Mobile catalog cards use optional NFT `rarity` (`standard` or `rare`) for the RARO badge. The favorite heart reads account-scoped GET `/favorites` and uses the same optimistic POST `/favorites` mutation and rollback as the detail page. Guests are directed to login with a return URL. Existing mock databases refresh artwork/rarity metadata without resetting accounts, orders, prices or stock. On mobile, saved NFTs always show the filled heart. Unsaved cards reveal the outline heart on keyboard focus or hover where supported. Touch users can favorite any NFT through its detail page. No invisible touch target intercepts card navigation.

NFT `summary` is optional short editorial copy for the compact mobile detail header; `description` remains the full desktop copy and the fallback for integrations without a summary. Existing mock databases receive missing summaries without resetting business state. The mobile rating uses the same illustrative review panel as desktop; no real review score API is implied.

The mobile navigation cart badge sums cart item quantities from the same account-scoped query used by desktop. It hides at zero and its link exposes the quantity in its accessible name. Mobile cart rows show the API edition label and unit price; the quote remains the authority for totals and discounts.

Demo write readiness: GET `/api/_mock-health` is a read-only MSW transport handshake, independent of the selected business fault scenario. Before POST/PATCH/DELETE, the configured demo transport checks this marker and reactivates MSW if needed. Concurrent writes share the readiness check. No business write is automatically replayed. With mocks disabled there is no health request or recovery hook; business API requests continue through Axios. Database initialization is not rerun during recovery.

Mobile checkout shows registered wallets and provider selection (WalletConnect, MetaMask, Coinbase Wallet). Saved-wallet selection resets the previous connection; provider selection invokes the existing REST connection mutation. The quote remains authoritative and uses the same review/idempotency/order-recovery flow as desktop. Collector fields are prefilled from the session and can be edited through the saved-wallet menu. Invalid native form values prevent collapsing the editor; API validation reveals it again. The wallet card list follows actual account data, without adding fake wallets to match the reference's example count. Demo scenario controls are omitted from checkout; select test scenarios on the market before entering checkout. Mock limitations remain documented and explicit in the confirmation dialog.

Diagnostic UI is opt-in via `?demo=1` (or `&demo=1` when other search parameters exist). Normal home, detail, cart, checkout and account pages do not render its trigger. E2E scenario fixtures call the mock-only endpoints directly; scenario changes refresh cached reads, while protocol events stay on the current screen to exercise Socket.IO listeners. This keeps fault coverage independent of the normal-page design.
