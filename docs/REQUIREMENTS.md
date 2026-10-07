# Requirement checklist

The README at junglegaming/frontend-challenge is the source of truth. This is a checklist, not a claim that unexecuted checks passed.

| Area               | Implementation                                                               | Evidence                                                                    |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| React / TypeScript | All UI and contracts typed                                                   | typecheck                                                                   |
| TanStack Router    | Routes, search validation, private guards                                    | catalog/history and auth E2E                                                |
| TanStack Query     | Queries, mutations, cache, optimistic favorite rollback                      | E2E                                                                         |
| Axios / REST       | All business calls in api/client.ts                                          | MSW interception, E2E                                                       |
| Tailwind / shadcn  | Utility styling; shadcn-pattern Button/Dialog using Radix, cva, Slot         | components/ui, components.json                                              |
| MSW                | Browser worker + stateful HTTP handlers                                      | demonstration and E2E share handlers                                        |
| Socket.IO          | socket.io-client over intercepted WebSocket and published toSocketIo binding | event E2E                                                                   |
| Playwright         | Chromium desktop/mobile                                                      | HTML report, traces on failure                                              |
| Lighthouse         | Audit script: home/detail, mobile/desktop, 3 runs each                       | Current production-build measurements: docs/VALIDATION.md                   |
| Figma fidelity     | Original artwork/font/colors, desktop/mobile layouts                         | Exported references; reviewed baselines; remaining differences in DESIGN.md |
| Public deploy      | Production READY and public UI/visitor-cart smoke verified                   | Work browser: font/colors, catalog/detail/cart, refresh persistence         |

## Eliminatory requirements

| Gate                                      | Implementation and evidence                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required stack is used effectively        | Typed React components, Router URL/guards, Query cache/mutations, Axios REST, Tailwind/shadcn composition, MSW HTTP/WebSocket, real socket.io-client, Playwright and Lighthouse. |
| Core business flows use the simulated API | Catalog/detail/session/cart/quote/order/profile/wallet calls use api/client.ts and stateful handlers; E2E exercises real UI and interception.                                    |
| Confirmation depends on server status     | Order page renders pending/confirmed/declined from the order response; timeout and pending-refresh tests recover the same order.                                                 |
| Accounts remain isolated                  | Scoped query keys, captured request tokens, cleanup on logout/account change and ownership checks; session/account E2E.                                                          |
| Realtime uses the protocol                | Demo controls make API calls; MSW Socket.IO binding emits versioned events consumed by socket.io-client. Price/stock/reconnect/old-event tests.                                  |
| Automated flows exist and pass            | Final full desktop/mobile run: 88 passed, 12 device-specific cases skipped; no failures. HTML report: reports/e2e-final-full. Visual baselines are versioned.                                                                          |

Evaluation areas additionally cover UI fidelity, documentation, accessible failure states and performance. Mobile Lighthouse Performance remains below 90; exact measurements and causes are recorded in VALIDATION.md. Remaining design differences are explicit in DESIGN.md. Submission links: https://github.com/lucaswd21/jungle-frontend-challenge and https://jungle-marketplace.vercel.app .
