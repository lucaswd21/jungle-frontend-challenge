# Correspondência com o desafio

Fonte de requisitos: [README oficial](https://github.com/junglegaming/frontend-challenge). Esta matriz aponta implementação e evidência; não declara aprovação de verificações não executadas. Resultados/limitações ficam em [Validação](VALIDATION.md).

## Stack e critérios

| Requisito          | Implementação                                                    | Onde conferir                                        |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| React / TypeScript | Interface e contratos tipados                                    | `src`, `npm run typecheck`                           |
| TanStack Router    | Rotas, busca validada e proteção de páginas                      | `src/app`, E2E de URL/histórico/autenticação         |
| TanStack Query     | Queries, mutações, cache e favorito otimista                     | `src/features`, E2E de rollback                      |
| Axios / REST       | Transporte centralizado                                          | `src/api/client.ts`, handlers MSW                    |
| Tailwind / shadcn  | Utilitários e composição Button/Dialog com Radix, cva e Slot     | `src/components/ui`, `components.json`               |
| MSW                | Worker e handlers HTTP com estado persistente                    | `src/mocks`, cenários/E2E                            |
| Socket.IO          | Cliente real sobre WebSocket interceptado e binding `toSocketIo` | `src/realtime`, E2E de eventos                       |
| Playwright         | Chromium desktop/mobile, testes funcionais e visuais             | `tests/e2e`, CI                                      |
| Lighthouse         | Home/detalhe, desktop/mobile, 3 execuções por combinação         | `scripts/audit.mjs`, [medições](VALIDATION.md)       |
| Fidelidade visual  | Assets, fonte e cores fornecidos; layouts responsivos            | [Design](DESIGN.md), referências visuais versionadas |
| Deploy público     | Produção Vercel e fallback SPA                                   | [Aplicação](https://jungle-marketplace.vercel.app/)  |

## Requisitos eliminatórios

| Critério                                    | Implementação/evidência                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Stack obrigatória usada efetivamente        | Bibliotecas integradas aos fluxos acima, não apenas instaladas                                                            |
| Fluxos de negócio via API simulada          | Catálogo, detalhe, sessão, carrinho, cotação, pedido, perfil e carteiras passam por Axios/handlers; E2E interage com a UI |
| Confirmação depende da resposta do servidor | Página deriva status do pedido; testes cobrem pendência, recusa, refresh e timeout                                        |
| Isolamento entre usuários                   | Chaves privadas por conta, tokens capturados, limpeza de cache/socket e propriedade na API                                |
| Realtime pelo protocolo                     | Diagnóstico faz chamadas HTTP; eventos versionados percorrem MSW/binding/cliente Socket.IO                                |
| Testes automatizados executáveis            | Suíte desktop/mobile, relatórios e referências visuais; contagens e escopo registrados em [Validação](VALIDATION.md)      |

Entregáveis: [repositório público](https://github.com/lucaswd21/jungle-frontend-challenge) e [deploy](https://jungle-marketplace.vercel.app/). Performance mobile ficou abaixo da meta de 90 na última medição e está explicada em Validação; diferenças visuais estão em Design.
