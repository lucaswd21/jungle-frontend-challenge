# Arquitetura e decisões

## Responsabilidades

Vite, React e TypeScript atendem à stack obrigatória sem infraestrutura extra de SSR ou backend. TanStack Router controla rotas, parâmetros de busca e proteção de páginas; TanStack Query controla recursos remotos, cache e mutações; Axios concentra o transporte HTTP. Tailwind e a composição Button/Dialog adaptada de shadcn/ui fornecem estilos e primitivas acessíveis.

Estado local fica nos formulários, seleção de edição, conexão de carteira e modais. Hooks compõem comportamento; efeitos cuidam de assinaturas, foco, sessão e limpeza. Não há Redux ou outra store duplicando o estado da API.

`Account.tsx` coordena o perfil; formulários de senha e carteiras ficam em `features/account`. A consistência do checkout permanece no mesmo fluxo para evitar abstrações extras. `style.css` importa `base.css`, `market.css`, `pages.css`, `detail.css` e `cart.css`, nessa ordem. Utilitários Tailwind convivem com CSS semântico para composições específicas das referências.

## Fronteira da simulação

A interface consulta a rede. Axios chama endpoints REST interceptados pelo MSW; `database.ts` mantém o servidor simulado, e `handlers.ts` aplica validação, autorização e regras de negócio. `socket.ts` publica eventos das mesmas mutações. HTTP e eventos compartilham os dados.

MSW 2.15.0 atende à compatibilidade `^2.10.2` de `@mswjs/socket.io-binding` 0.2.0; o projeto usa sua API publicada `toSocketIo`. O cliente real `socket.io-client` usa o caminho padrão; o handler corresponde à raiz da origem porque MSW normaliza `/socket.io/` para `/` ao associar conexões.

Os módulos da aplicação e dos mocks são baixados em paralelo. React só renderiza após MSW iniciar; Socket.IO é importado depois. Isso preserva interceptação: `engine.io-client` captura o construtor global de WebSocket ao ser importado.

O transporte usa apenas WebSocket, namespace padrão e eventos JSON/texto. O binding implementa codificação, decodificação e handshake; o mock envia ping Engine.IO a cada 10 segundos. Não são necessários polling de transporte, salas, namespaces extras, eventos binários ou acknowledgements. O próprio cliente Socket.IO reconecta sobre WebSockets interceptados.

### Recuperação do transporte

`api/mockRecovery.ts` mantém um hook opcional e uma promessa compartilhada, sem importar MSW na configuração com backend real. Ao retomar a aba, o mock reativa o transporte se necessário. Após inatividade, Axios aguarda preparação; um GET com resposta não JSON pode ser recuperado e repetido uma vez.

Antes de escritas, GET `/api/_mock-health` confirma interceptação, independentemente do cenário de falha. Escritas concorrentes compartilham a verificação. POST/PATCH/DELETE não são repetidos automaticamente: uma resposta inválida não prova que a escrita deixou de acontecer. Recuperação não modifica o worker gerado nem reinicializa a base.

Axios rejeita sucesso com conteúdo não JSON, inclusive HTML de fallback da SPA com HTTP 200. O carrinho valida lista de itens e quantidades inteiras positivas; oferece nova tentativa, sem tratar resposta inválida como carrinho vazio. A resolução da sessão precede suas queries para evitar requests com identidade prematura.

## Sessão e isolamento de contas

O servidor simulado emite token aleatório válido por 30 minutos. Axios captura o bearer token no envio; os handlers autorizam esse token, em vez de consultar a conta atual quando uma resposta atrasada termina. Uma mutação antiga não é atribuída a uma conta recém-autenticada.

A sessão é consultada nas proteções de rota, no foco da janela e a cada 15 segundos. Uma resposta privada 401 invalida a sessão; páginas protegidas voltam ao login com destino local validado. Um 403 apresenta erro de permissão. O carrinho persistido permite retomar após autenticação.

Chaves privadas incluem `userId`; listas incluem parâmetros da URL. Logout cancela requests, limpa cache e encerra socket. Troca de conta remove chaves privadas antigas e desativa callbacks anteriores. Pedidos verificam propriedade na API; snapshots de favoritos ficam restritos ao usuário.

Senhas usam PBKDF2/SHA-256 com salt. As 10.000 iterações mantêm a simulação responsiva e não são recomendação para produção. A base é visível/editável em localStorage: hashes no cliente não tornam esse armazenamento seguro. Em produção, sessões, senhas, transações e autorização pertenceriam ao backend.

## Carrinho e precisão monetária

Carrinho visitante é separado dos autenticados. Login soma linhas da mesma combinação NFT/edição, limita à disponibilidade e consome o carrinho visitante. Logout não transfere carrinho privado a outra sessão.

Quantidades são inteiros positivos; preços são strings decimais ETH com até 18 casas. Uma função central converte para wei com `BigInt`, calcula e converte de volta. A apresentação preserva precisão; desconto de cupom arredonda para baixo em wei. Cotação do servidor determina subtotal, desconto, taxa e total.

Carrinho e cotação são recursos separados. Eventos de preço/estoque invalidam cotação e catálogo, preservando itens escolhidos. Falta de disponibilidade gera erro acionável, sem remoção silenciosa.

## Checkout e idempotência

Revisão captura assinatura da cotação. Antes do envio, cliente consulta novamente; alteração exige nova revisão. Servidor compara assinatura no POST para fechar a janela entre consulta e envio. Handler reserva estoque antes de retornar pedido pendente; recusa devolve a reserva. A operação é atômica na execução do simulador, não entre abas.

Chave da tentativa e payload persistem por usuário. Uma ref síncrona bloqueia cliques duplicados antes do próximo render. Servidor indexa usuário/chave e compara conteúdo: repetição idêntica devolve o pedido original; conteúdo diferente retorna 409. Não há retry automático com chave nova. Após falha de transporte incerta, recuperação consulta a tentativa existente; refresh usa a tentativa armazenada.

Pedido guarda cotação imutável, carteira, dados do colecionador e `dueAt` para liquidação simulada. Socket e polling REST descobrem o mesmo resultado. Se a aba fechar antes do timer, GET posterior resolve pedidos vencidos. `confirmed` e `declined` são terminais; a tela confirma somente quando a API retorna `confirmed`.

Confirmação subtrai do carrinho as quantidades compradas, preservando itens adicionados após envio. Atualização de catálogo não altera cotação salva/recibo.

## Cache, cancelamento e realtime

Padrão: `staleTime` de 15 segundos e `gcTime` de 5 minutos. Sessão usa 10 segundos de cache e consulta periódica. Queries GET repetem no máximo uma vez em falhas transitórias, sem retry para 4xx; mutações têm zero retries automáticos. Pedidos consultam API a cada segundo apenas enquanto pendentes.

Axios recebe `AbortSignal` do Query. Chaves do catálogo incluem busca normalizada, filtros, ordenação e página: requests obsoletos são cancelados/isolados e não substituem outra combinação. Filtros voltam à página 1; histórico e refresh restauram estado da URL.

Favoritos cancelam query, salvam snapshot, aplicam mudança otimista e restauram em falha; ao concluir, reconciliam por REST. Mutações do carrinho atualizam o recurso retornado e invalidam cotação. Perfil/carteiras sincronizam seu recurso e sessão quando necessário.

Assinaturas guardam IDs vistos e maior versão por recurso. Eventos duplicados/antigos são ignorados; pedidos terminais não voltam a pendentes. Reconexão invalida recursos ativos para reconciliar por REST. Listeners, timers e conexões são removidos ao encerrar o ciclo de vida.

## Acessibilidade e performance

Login do header desktop usa modal local; mantém página, filtros e scroll. Rotas de autenticação reutilizam formulários. Radix controla modalidade, foco, Escape e presença durante fechamento animado. Diálogo de revisão devolve foco ao botão de origem. Transições de rota focam o conteúdo principal; carregamento inicial mantém o link de pular conteúdo disponível.

Campos têm labels/erros associados. Feedback global usa região viva educada em português, com fechamento manual. Cache de mutações informa falhas junto aos erros locais; mensagens repetidas reiniciam tempo de exibição. Estoque/validação têm texto. Movimento reduzido desativa animações/scroll suave. Acompanhamento das seções usa `requestAnimationFrame` e remove listeners/observers ao encerrar.

Rotas fora do catálogo usam `lazyRouteComponent`; proteções continuam carregadas de início. Socket.IO é importado após resolver identidade, em período ocioso com prazo de um segundo. Mobile evita montar conteúdo exclusivo desktop/filtros fechados. Imagens inicialmente visíveis são prioritárias; demais usam lazy loading. Skeletons preservam dimensões. Cenário padrão não adiciona latência.

Fontes locais e WebP de alta qualidade reduzem transferência. Originais permanecem; compressão preserva dimensões/transparência, mas tem perdas. Assets/diferenças estão em [Design](docs/DESIGN.md). Auditorias usam build de produção com mocks/funcionalidades ativos; resultados/gargalos estão em [Validação](docs/VALIDATION.md).

## Limites

- Persistência local ao navegador, sem transações entre abas/dispositivos. Há uma conta ativa por contexto; testes usam contextos isolados.
- A SPA tem metadados, mas não SSR; SEO de rotas diretas é limitado em comparação com pré-renderização.
- Blockchain, carteiras, OAuth, e-mail e pagamentos externos são simulados. Identificadores de transação não apontam para explorer real.
- Páginas editoriais, suporte, atividade, ofertas e downloads estão fora do escopo. Limites visuais/de medição ficam nos documentos específicos, sem declarar fidelidade pixel a pixel.
