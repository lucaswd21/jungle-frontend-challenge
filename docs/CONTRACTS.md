# Contratos REST e eventos

Base `/api`, requests/respostas JSON. Axios envia `Authorization: Bearer <token>` quando há sessão. Tipos: `src/api/contracts.ts`. ETH é string decimal; quantidades e versões são inteiros.

## Endpoints

| Método / endpoint           | Entrada                                               | Resposta / comportamento                                         |
| --------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| GET `/session`              | Token capturado no request                            | `{user,expiresAt}`; usuário anônimo é `null`                     |
| POST `/session`             | `{email,password}`                                    | Sessão; incorpora carrinho visitante                             |
| DELETE `/session`           | Token                                                 | Revoga essa sessão                                               |
| POST `/accounts`            | `{name,email,password}`                               | Sessão criada; 409 para e-mail repetido                          |
| GET `/nfts`                 | `q,category,sort,page,minPrice,maxPrice,network,view` | `{items,total,pages}`; 9 itens/página                            |
| GET `/nfts/:id`             | ID                                                    | NFT com edições, estoque/versão; 404 se ausente                  |
| GET `/favorites`            | Autenticação                                          | IDs de NFTs                                                      |
| POST `/favorites`           | `{id,active}`                                         | IDs atualizados                                                  |
| GET `/cart`                 | Visitante ou autenticação                             | `{items,coupon,version}`                                         |
| POST `/cart/items`          | `{nftId,editionId,quantity}`                          | Soma quantidade; retorna carrinho                                |
| PATCH `/cart/items`         | Mesmos campos                                         | Define quantidade, validando estoque                             |
| DELETE `/cart/items`        | Identidade da linha no corpo                          | Remove linha da edição                                           |
| GET `/quote`                | Carrinho atual                                        | Linhas, assinatura/ID, totais e problemas                        |
| POST `/quote/coupon`        | `{code}`                                              | Cotação validada; string vazia remove cupom                      |
| POST `/orders`              | `CheckoutInput` + `Idempotency-Key`                   | Pedido pendente/existente; 409 para cotação ou payload alterados |
| GET `/orders/attempt/:key`  | Autenticação                                          | Pedido da tentativa do usuário; 404 se ausente                   |
| GET `/orders/:id`           | Autenticação                                          | Pedido próprio; 403 para pedido de outra conta                   |
| GET `/profile`              | Autenticação                                          | `User`                                                           |
| PATCH `/profile`            | `{name,email,avatar,bio,username?,ens?,walletAlias?}` | `User` salvo; avatar data URL PNG/JPEG/WebP até 500 KB           |
| POST `/profile/password`    | `{current,password}`                                  | `{ok:true}` após verificar senha atual                           |
| GET `/wallets`              | Autenticação                                          | `Wallet[]`                                                       |
| POST `/wallets`             | `{id?,label,address,network,primary}`                 | `Wallet[]`; máximo duas; edição por ID próprio                   |
| POST `/wallets/:id/connect` | `{network,approve}`                                   | `{connected}`; decisão simulada                                  |

`view=new` seleciona as primeiras 12 entradas; `view=trending` usa ranking estável dos dados de teste. Sem `view`, entram todas. Filtros são combinados antes da ordenação; ordenação explícita por preço prevalece sobre ranking. Troca de aba volta à página 1.

NFT pode ter `rarity` (`standard` ou `rare`) para a tag RARO e `summary` para o resumo mobile. `description` contém a descrição completa e serve de fallback. Esses campos editoriais não alteram estoque/preço nem representam uma API real de avaliações.

## Cotação, checkout e pedido

A cotação contém `lines[{nftId,editionId,quantity,name,edition,image,unitPrice,total,available}]`, `subtotal`, `discount`, `fee`, `total`, `coupon`, `issues` e assinatura estável dos valores. Na simulação, a assinatura é o próprio `quoteId`; produção precisaria de ID opaco/assinado e expiração.

`CheckoutInput`: `{quoteId,walletId,network,collector:{name,email,username,profileName,address,secondary,provider,referral,ensSuffix,note},connected}`. O endereço deve coincidir com a carteira cadastrada do usuário. Nome de usuário/perfil, indicação, provedor e sufixo ENS são validados; endereço secundário aceita `0x` válido ou nome `.eth`; observações têm até 500 caracteres.

Carteiras aceitam metadados opcionais `displayName`, `profileName`, `email`, `provider`, `referral`, `ens` e `secondary`, validados quando presentes. São dados de demonstração, sem verificação externa de identidade/ENS.

Pedido: `{id,userId,status,version,quote,collector,wallet,transaction,createdAt,reason?}`. Os valores financeiros pertencem ao snapshot da criação. Estados: `pending`, `confirmed`, `declined`. Consistência, reserva e recuperação por chave estão em [Arquitetura](../ARCHITECTURE.md#checkout-e-idempotência).

## Erros

Formato: `{code,message,fields?:Record<string,string>}`. HTTP 401: sessão inválida/expirada; 403: permissão/propriedade; 404: recurso ausente; 409: conflito; 422: validação; 503: falha transitória. Falhas de rede/timeout não fornecem uma resposta bem-sucedida que possa confirmar escrita.

## Eventos

| Evento          | Payload                                     | Reconciliação                                                                              |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `nft.updated`   | `{eventId,resourceId,version,nft}`          | Atualiza detalhe mais recente e invalida catálogo/cotação                                  |
| `order.updated` | `{eventId,resourceId,version,userId,order}` | Aplica apenas à conta correspondente; impede regressão terminal; invalida carrinho/cotação |

`eventId` permanece igual em repetição; versões crescem por recurso. O cenário de evento antigo carrega snapshot desatualizado de preço/estoque ou pedido pendente. Conexão usa cliente Socket.IO real, interceptação WebSocket do MSW e binding do protocolo. Reconexão e descarte de eventos antigos estão em [Arquitetura](../ARCHITECTURE.md#cache-cancelamento-e-realtime).

## Diagnóstico da simulação

| Endpoint              | Entrada/finalidade                                                           |
| --------------------- | ---------------------------------------------------------------------------- |
| POST `/demo/scenario` | `{scenario}`; seleciona falha reproduzível                                   |
| POST `/demo/event`    | `{kind}`; altera estado e emite evento pelo protocolo                        |
| POST `/demo/reset`    | Restaura dados iniciais                                                      |
| GET `/_mock-health`   | Marcador de interceptação `{transport:"jungle-msw"}` independente do cenário |

Esses endpoints existem apenas nos mocks. Cenários disponíveis e passos de reprodução ficam no [README](../README.md#reproduzir-falhas-e-eventos); E2E chama a mesma camada de rede. O mecanismo de preparação não reinicializa dados nem repete escritas automaticamente.
