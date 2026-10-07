# Guia de defesa técnica

Leia o código e execute os cenários antes de apresentar o projeto. Você deve conseguir explicar e modificar os fluxos, especialmente os pontos abaixo.

| Seu repertório Vue/Nuxt      | Escolha em React neste projeto                            |
| ---------------------------- | --------------------------------------------------------- |
| composables                  | Hooks em features/hooks.ts                                |
| Vue Router / query de rota   | TanStack Router com search validado como fonte de verdade |
| refs locais / formulário     | useState para estado de interação                         |
| chamadas assíncronas e cache | TanStack Query, sem duplicar recursos num store global    |
| onMounted/onUnmounted        | useEffect com cleanup para socket, listeners e foco       |
| componentes Vuetify          | Composição shadcn/Radix adaptada com Tailwind             |

## Decisões que importam

1. **Por que React?** O desafio exige React e TypeScript; Vue/Nuxt seria eliminatório. Vite mantém a base pequena e evita infraestrutura que não foi solicitada.
2. **Por que não Redux?** O estado de negócio pertence à API simulada. Query resolve cache, requests, mutations e sincronização; um segundo store duplicaria a fonte de verdade.
3. **Como evitar erro com ETH?** Strings na API, BigInt em wei para cálculos. `0.1 + 0.2` em JS não é um cálculo monetário aceitável aqui.
4. **Como lidar com timeout?** Timeout não prova que o servidor não criou o pedido. A mesma tentativa guarda sua chave e recupera o pedido; não cria outra compra.
5. **Como evitar preço antigo?** Revisão captura assinatura; cliente reconsulta; servidor compara novamente e rejeita alterações. O usuário precisa confirmar a nova cotação.
6. **Como o realtime funciona?** O evento percorre WebSocket interceptado pelo MSW, binding Socket.IO, socket.io-client e hooks. Não é um botão chamando um setter. A inicialização antes do import do cliente é essencial.
7. **Por que consultar REST depois de reconectar?** Eventos podem ter sido perdidos. A API é a autoridade; versões e IDs protegem contra repetição e regressão.
8. **Como proteger usuários?** Chaves incluem userId; callbacks de socket encerram com a sessão; handlers validam o token capturado pelo request e a propriedade do pedido.
9. **Como testar falhas?** MSW produz falhas na rede, usando a mesma implementação em demo e E2E. Playwright observa a interface; não injeta resultados de negócio no React.
10. **Como explicar a fidelidade visual?** Assets originais, fonte local e tokens do Figma; CSS responsivo por seção. WebP sem perdas preserva os pixels. Baselines são testes de regressão, não uma certificação pixel perfect; os ícones e diferenças de formulário restantes estão em DESIGN.md.

## Roteiro de demonstração

- Buscar, filtrar, ordenar e voltar no histórico.
- Abrir detalhe direto, selecionar edição e quantidade, adicionar ao carrinho como visitante.
- Autenticar e demonstrar merge; aplicar JUNGLE10.
- Conectar carteira simulada, revisar e comprar; atualizar página pendente/confirmada.
- Alterar preço durante checkout e explicar por que uma nova revisão é obrigatória.
- Demonstrar timeout e recuperação do mesmo ID.
- Mostrar rollback de favorito, troca de conta e isolamento.
- Mostrar testes, traces e relatórios reais; explicar limites dos mocks e desvios visuais.
