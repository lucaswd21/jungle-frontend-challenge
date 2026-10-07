# Jungle NFT Marketplace

Marketplace de NFTs desenvolvido para o desafio Frontend da Jungle Gaming com React e TypeScript. Inclui catálogo, autenticação, conta, favoritos, carrinho persistente, checkout idempotente e atualização em tempo real. API REST, carteiras, pagamentos e protocolo Socket.IO são simulados.

- **Aplicação:** [jungle-marketplace.vercel.app](https://jungle-marketplace.vercel.app/)
- **Código:** [lucaswd21/jungle-frontend-challenge](https://github.com/lucaswd21/jungle-frontend-challenge)
- **Desafio:** [junglegaming/frontend-challenge](https://github.com/junglegaming/frontend-challenge)
- **Design oficial:** [Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)

Os layouts desktop/mobile usam as referências exportadas do Figma, os assets fornecidos e Roboto Mono. Os resultados executados, incluindo a limitação de performance mobile, estão em [Validação](docs/VALIDATION.md).

## Executar localmente

Use Node 22.12 ou superior (Node 24 suportado) e npm. O `package-lock.json` está versionado.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://127.0.0.1:5173. No Windows, `.env.example` também pode ser copiado manualmente para `.env.local`. O MSW inicia antes da interface e do cliente Socket.IO, inclusive no build de demonstração. Service Workers exigem localhost ou HTTPS.

## Verificações

```bash
npm run check       # TypeScript, ESLint e build de produção
npm test            # E2E; execute o build antes
npm run test:report  # Abre o relatório Playwright
npm run audit       # Lighthouse: 3 execuções por página/perfil
```

`npm test` inicia seu próprio preview. No Linux, Chromium vem do pacote `@sparticuz/chromium` fixado no lockfile, sem download externo. Em outras plataformas, execute `npx playwright install chromium` para os testes. Para auditoria fora do Linux, configure `CHROMIUM_EXECUTABLE_PATH` com um Chromium instalado; o preparador Linux utiliza `tar` e bibliotecas do sistema.

Relatórios E2E são gerados em `playwright-report`, traces de falha em `test-results` e auditorias em `reports/lighthouse`. Referências visuais estão versionadas nas pastas `tests/e2e/*-snapshots`. Os relatórios já executados acompanham o pacote validado; arquivos gerados não fazem parte do código-fonte no GitHub.

## Ambiente

| Variável                   | Padrão                                                                  | Finalidade                                                      |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`        | Habilitado, exceto quando `false`                                       | Ativa a simulação HTTP/WebSocket em desenvolvimento e no deploy |
| `CHROMIUM_EXECUTABLE_PATH` | Chromium do pacote no Linux; Playwright nas demais plataformas para E2E | Seleciona o executável dos testes/auditorias                    |
| `AUDIT_URL`                | `http://127.0.0.1:4173`                                                 | Endereço auditado com o cenário padrão                          |

Não há backend privado. Desabilitar mocks exige API e serviço realtime compatíveis. A demonstração usa mocks habilitados e não requer credenciais externas.

## Contas e dados de teste

| E-mail              | Senha        |
| ------------------- | ------------ |
| `alex@example.test` | `Jungle123!` |
| `maya@example.test` | `Jungle123!` |

Cupom `JUNGLE10`: desconto de 10% do subtotal. `EXPIRED` produz erro de validade. Taxa simulada: `0.016 ETH`. Edições: 1/50, 1/10, 1/1 e ABERTA; o NFT 3 tem a edição 1/10 esgotada.

Google/Facebook autenticam as contas de demonstração pela API simulada. A recuperação de senha apresenta orientação e não envia e-mail. Conexão de carteira e dados ENS são validados sem extensão ou resolução externa.

Perfil, avatar, senha, carteiras, favoritos, carrinho e pedidos persistem neste navegador até o reset. O armazenamento usa `jungle.mock.db.v2`. As contas têm dados independentes; o carrinho visitante é incorporado no login, respeitando estoque. Os campos do checkout são preenchidos a partir da conta e podem ser editados; indicação, sufixo ENS e observações são validados e armazenados.

## Reproduzir falhas e eventos

Abra `/?demo=1` ou acrescente `&demo=1` a uma URL com parâmetros. O botão **Cenários de demonstração** aparece abaixo do conteúdo nas páginas com diagnóstico. Para testar checkout, selecione o cenário no mercado antes de navegar para pagamento. Na navegação normal, esses controles ficam ocultos.

Os controles fazem chamadas HTTP. Eventos atravessam a conexão Socket.IO interceptada, sem alterar diretamente o estado React.

| Cenário/controle                    | Como reproduzir                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `standard`                          | Fluxos normais, sem latência artificial                                         |
| `empty`                             | Volte ao catálogo para ver o estado vazio                                       |
| `slow`                              | Abra um detalhe novo; skeleton por 2 segundos                                   |
| `variable`                          | Altere buscas rapidamente; latências alternadas de 900/80 ms                    |
| `offline` / `server-error`          | Falha de rede / HTTP 503; restaure `standard` e tente novamente                 |
| `invalid-cart` / `html-response`    | JSON de carrinho inválido / HTML com HTTP 200; erro recuperável                 |
| `unauthorized`                      | API privada retorna 403                                                         |
| `expired` / Expire session          | Sessão expira no checkout; login preserva carrinho/destino; restaure `standard` |
| `signup-conflict`                   | Cadastro retorna conflito de e-mail                                             |
| `validation`                        | API rejeita nome do perfil com erro no campo                                    |
| `invalid-coupon` / `expired-coupon` | Aplique cupom; remoção continua disponível                                      |
| `favorite-failure`                  | Favorite um NFT; a alteração otimista é desfeita                                |
| `price-change` / `sold-out`         | Envie a compra revisada; alteração de preço/estoque exige nova revisão          |
| `timeout`                           | Pedido é criado, mas a resposta atrasa; recuperação usa a mesma chave           |
| `declined`                          | Pagamento recusado; carrinho preservado e estoque reservado devolvido           |
| Change NFT price / Exhaust edition  | Emita `nft.updated` para mudar preço/estoque de item no carrinho                |
| Duplicate event / Send older event  | Reenvie evento repetido ou antigo; dados não devem regredir                     |
| Interrupt socket                    | Interrompa conexão; cliente reconecta e reconcilia por REST                     |
| Resolve pending orders              | Resolva pedidos pendentes pelo simulador e Socket.IO                            |
| Reset all demo data                 | Restaure catálogo, contas, senhas, carteiras, sessões, pedidos e cenário        |

## Rotas e navegação

`/`, `/nfts/:nftId`, `/cart`, `/login`, `/signup`, `/checkout`, `/orders/:orderId`, `/profile`, `/wallets`. Rotas privadas validam sessão também no acesso direto. Busca, filtros, ordenação, página e aba do catálogo ficam na URL. Pedidos verificam proprietário; rotas desconhecidas exibem 404.

No desktop, **Entrar** abre modal sobre a página atual, preservando catálogo e URL. As rotas de login/cadastro também funcionam diretamente; no mobile, têm formulários próprios. Filtros mantêm a posição da seção; paginação volta ao início do catálogo. A navbar acompanha as seções da home e a rota nas outras páginas. Transições respeitam movimento reduzido.

As três abas do catálogo usam a mesma API. Novos lançamentos são as primeiras 12 entradas; Em alta usa ranking determinístico de teste. Redes sociais do rodapé levam às páginas iniciais das plataformas, pois não foram fornecidos perfis oficiais da KURIO.

## Deploy

Comando: `npm run build`. Saída: `dist`. Mantenha mocks habilitados e inclua Service Worker, fontes e assets. `vercel.json` e `public/_redirects` configuram fallback da SPA na Vercel e em Netlify/Cloudflare Pages. Para conferir localmente, use `npm run preview`.

Antes de entregar, teste no endereço público acesso direto e refresh de detalhe, checkout, perfil, carteiras e pedido, uma compra completa e alteração realtime de preço.

## Organização e documentação

| Local               | Responsabilidade                                                   |
| ------------------- | ------------------------------------------------------------------ |
| `src/api`           | Contratos tipados e transporte Axios                               |
| `src/mocks`         | Dados de teste, estado persistente, REST e binding Socket.IO       |
| `src/app`           | Providers, rotas, política de queries e estrutura da aplicação     |
| `src/features`      | Fluxos de negócio e hooks; formulários de conta em `account`       |
| `src/styles`        | Tokens e layouts responsivos; utilitários Tailwind nos componentes |
| `src/realtime`      | Assinaturas, versões de recursos e reconciliação REST              |
| `src/components/ui` | Composição shadcn/ui adaptada com Radix, Slot e cva                |
| `tests/e2e`         | Interações reais em contextos isolados e falhas de rede            |

- [Arquitetura](ARCHITECTURE.md): decisões, consistência, cache e limites da simulação.
- [Contratos](docs/CONTRACTS.md): endpoints, payloads, erros e eventos.
- [Design](docs/DESIGN.md): referências, tokens, assets e diferenças visuais.
- [Validação](docs/VALIDATION.md): resultados executados e condições de medição.
- [Requisitos](docs/REQUIREMENTS.md): correspondência com critérios do desafio.
