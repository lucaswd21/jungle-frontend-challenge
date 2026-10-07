# Validação executada

Verificações realizadas em 07/10/2026 com build de produção, dados originais de teste e cenário padrão do MSW. As medições são locais, não do CDN publicado. Esta revisão de documentação não representa nova execução da suíte ou do Lighthouse.

## TypeScript, lint e E2E

`npm run check` passou TypeScript, ESLint e build. A última suíte completa Playwright, sem atualização de snapshots e sem retries, terminou com **88 testes aprovados, 12 ignorados e zero falhas**. Os casos ignorados são exclusivos do outro viewport, não fluxos obrigatórios pendentes. Chromium desktop: 1440 × 1000; mobile: 390 × 844. Duração: 4,9 minutos. Playwright 1.63.0, Vite 8.3.2.

Cobertura: URL/histórico do catálogo; detalhe direto/ausente; edições/quantidade; isolamento e expiração de sessão; favoritos com rollback; persistência/incorporação do carrinho visitante; cupons; perfil/avatar/senha/carteiras; pedidos confirmados, recusados e pendentes; envio duplicado/timeout; recibos imutáveis; eventos Socket.IO novos, repetidos e antigos; reconexão; recuperação após inatividade/worker parado; feedback, teclado/foco, Axe e ausência de overflow horizontal.

Referências visuais versionadas cobrem home, detalhe, carrinho, pagamento, autenticação, perfil, carteiras, recibo e rodapé. A passagem final corrigiu paginação coberta pela navegação inferior mobile e um preparo inadequado do cenário de falha de carrinho; ambos foram confirmados com cliques normais. Relatórios e traces iniciais permanecem no pacote validado.

Artefatos: `reports/e2e-final-full/index.html`, `reports/e2e-final-initial/index.html`, `reports/e2e-final-fixes`, `reports/e2e-final-visual`.

### Ajuste posterior da galeria

Depois da suíte completa/auditoria, a galeria recebeu textos em português, miniaturas horizontais no modal e lupa com fundo circular marrom. A coluna de miniaturas da página desktop foi preservada. `npm run check` passou; testes focados aprovaram quatro casos e ignoraram dois específicos do outro viewport, verificando troca de imagem, alinhamento, Escape, retorno de foco e Axe no modal.

A atualização visual passou quatro casos; a comparação normal, sem atualizar snapshots, passou os dois casos visuais multipágina desktop/mobile. Evidências: `reports/e2e-gallery-final`, `reports/e2e-gallery-visual`, `reports/e2e-gallery-visual-confirmed`, `reports/gallery-1440.png`, `reports/gallery-390.png`.

## Lighthouse: última medição

Três execuções por página/perfil, 12 no total; mediana independente de cada categoria/métrica. Auditoria após encerrar E2E, com limitação simulada padrão do Lighthouse, configuração desktop quando aplicável, Chromium do pacote e perfil temporário isolado a cada execução. Mocks, assets e funcionalidades permaneceram ativos. As medições precedem o ajuste pequeno da galeria descrito acima.

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) |    CLS | TBT (ms) |
| ------- | ------- | ----------: | -------------: | ------------: | --: | -------: | -----: | -------: |
| Home    | Mobile  |          85 |            100 |            96 | 100 |     3878 | 0,0010 |     27,5 |
| Home    | Desktop |          98 |            100 |           100 | 100 |     1026 | 0,0063 |      0,0 |
| Detalhe | Mobile  |          85 |            100 |            96 | 100 |     3785 | 0,0293 |      3,0 |
| Detalhe | Desktop |          98 |            100 |           100 | 100 |      984 | 0,0464 |      0,0 |

Ambiente: Node v24.19.0, Linux x64, Lighthouse 13.5.0, Chromium 153.0.8010.0. URL: `http://127.0.0.1:4173`.

**Performance mobile ficou em 85 na home e no detalhe, abaixo da meta de 90.** As demais categorias atingiram as metas. O resultado abaixo da meta permanece uma limitação explicada, não um resultado aprovado.

A cadeia observada indica custo de inicialização React/Router/Query/MSW e descoberta das imagens após resposta da API. O chunk do MSW tem cerca de 454 KB minificado / 169 KB gzip; bloqueio é baixo, mas carregamento inicial atrasa a imagem principal. Experimentos com dicas antecipadas de módulos/imagens e renderização antes da preparação do mock pioraram as notas simuladas e foram descartados. Mudanças maiores de bundle/renderização exigiriam trabalho adicional.

O alerta de boas práticas mobile está associado aos ícones PNG fornecidos em baixa resolução para densidades maiores que 1. As notas de acessibilidade/SEO refletem nomes acessíveis alinhados ao texto visível, áreas de toque ajustadas, `robots.txt` e descrição em português. A otimização de imagens e suas limitações estão em [Design](DESIGN.md#assets).

Relatórios HTML/JSON e medianas: `reports/lighthouse`; comparação anterior à otimização: `reports/lighthouse-final-before-optimization`. Runner: `scripts/audit.mjs`. Os valores não são uma seleção das melhores execuções.

## Publicação e reprodução

- [Produção](https://jungle-marketplace.vercel.app/): deploy Vercel confirmado como `READY`, sem erro de alias. A inspeção pública registrada cobriu catálogo, detalhe, carrinho e persistência no refresh. Não equivale a executar toda a suíte contra o CDN.
- [Código](https://github.com/lucaswd21/jungle-frontend-challenge): fonte, assets, lockfile, E2E, referências visuais, CI e documentação publicados. A publicação inicial foi conferida por igualdade da árvore Git com a fonte local validada.
- Os relatórios gerados acompanham o pacote validado e não são dependências do repositório. Comandos para reproduzir estão no [README](../README.md#verificações). A configuração de CI está versionada; os resultados acima são das execuções locais, sem afirmar uma execução aprovada no GitHub Actions.
