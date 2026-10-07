# Guia de estudo e demonstração

Roteiro opcional para revisar o projeto antes da entrevista. Decisões técnicas estão em [Arquitetura](../ARCHITECTURE.md); este guia organiza a leitura e os exercícios sem repetir sua especificação.

## Relação com Vue/Nuxt

| Experiência em Vue/Nuxt      | Equivalente usado aqui                                |
| ---------------------------- | ----------------------------------------------------- |
| Composables                  | Hooks em `src/features/hooks.ts`                      |
| Vue Router e query da rota   | TanStack Router com parâmetros de busca validados     |
| Refs locais e formulários    | `useState` para interação                             |
| Chamadas assíncronas e cache | TanStack Query, sem duplicar recursos em store global |
| `onMounted` / `onUnmounted`  | `useEffect` com limpeza de listeners/socket/foco      |
| Componentes Vuetify          | Composição shadcn/Radix adaptada com Tailwind         |

## Roteiro prático

1. Busque, combine filtros/ordenação e volte pelo histórico. Localize onde a URL compõe a chave da query.
2. Abra detalhe direto, altere edição/quantidade e adicione como visitante. Faça login e explique a incorporação do carrinho.
3. Aplique `JUNGLE10`, conecte carteira simulada e revise a compra. Acompanhe o caminho UI → Axios → MSW → resposta → Query.
4. Ative mudança de preço durante checkout e mostre por que outra revisão é necessária.
5. Ative `timeout`; confirme que recuperação/refresh mantêm o mesmo ID. Localize a chave idempotente no cliente e no servidor.
6. Demonstre falha de favorito, evento duplicado/antigo e reconexão. Identifique rollback, versão e reconciliação REST.
7. Troque de conta e explique limpeza das queries/listeners e verificação de propriedade do pedido.
8. Execute testes e abra relatórios. Explique que referências visuais são regressões, WebP usa compressão com perdas e a performance mobile não atingiu 90.

Antes de apresentar, pratique pequenas alterações no código e confira os cenários. Diferencie sempre o que é simulação do que exigiria backend e integrações reais.
