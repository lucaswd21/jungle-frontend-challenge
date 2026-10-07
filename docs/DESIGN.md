# Referência visual e implementação

Referência oficial: [Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). A implementação foi comparada às telas desktop/mobile e aos assets exportados fornecidos durante o desenvolvimento. As referências desktop usam 1440 px; as mobile, 414 px. Layouts estreitos e de tablet complementam essas referências.

## Fonte e cores

**Roboto Mono**, pesos 400, 500 e 700, hospedada pelo pacote `@fontsource/roboto-mono`. Os tokens abaixo são compartilhados por CSS e Tailwind.

| Token             | Cor       |
| ----------------- | --------- |
| `background`      | `#140D0A` |
| `foreground`      | `#F5F1EB` |
| `primary`         | `#D28A4C` |
| `accent`          | `#E89B55` |
| `secondary`       | `#B39463` |
| `muted`           | `#CFB28C` |
| `surface-card`    | `#241612` |
| `surface-raised`  | `#2F1D15` |
| Superfície escura | `#38220F` |
| `border`          | `#3F2319` |
| `border-soft`     | `#55321F` |

Erros, alertas e sucesso usam cores semânticas próprias: esses estados funcionais não estavam definidos nas telas fornecidas.

## Assets

`public/assets/kurio` reúne hero, macacos, wordmark e ícones fornecidos. Cart/login/delete, navegação mobile e ícones da conta usam os PNGs originais; o agradecimento usa `public/assets/thank-you.png`. SVGs são preservados; filtros CSS localizados ajustam a cor dos ícones brancos do header.

As cinco imagens principais são servidas em WebP, qualidade 95, método 6, preservando dimensões e transparência. A redução final foi de 492.882 para 120.552 bytes (75,5%) em relação à versão WebP anterior. A compressão tem perdas; os PNGs originais permanecem disponíveis. Não houve recoloração nem substituição por imagens geradas. O relatório por asset está em `reports/image-optimization.json`, no pacote validado.

## Composição por tela

| Tela            | Composição implementada                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo        | Sidebar e três colunas desktop; duas colunas escalonadas, hero com círculos sobrepostos e navegação inferior mobile                                           |
| Detalhe         | Miniaturas verticais e painel de arte desktop; informações sobrepostas e compra fixa mobile; modal ampliado com miniaturas horizontais e lupa circular marrom |
| Carrinho        | Linhas compactas, colunas e controles alinhados; cupom integrado ao resumo; resumo mobile no fluxo para comportar erros/cupom                                 |
| Pagamento       | Breadcrumb e campos do colecionador; seleção/conexão de carteiras; composição mobile compacta com edição dos dados                                            |
| Pedido          | Card de agradecimento sem navbar/rodapé; imagem, quantidades e valores do pedido persistido                                                                   |
| Autenticação    | Abas e modal desktop; telas próprias mobile; placeholders dourados, divisor e controle de visibilidade de senha                                               |
| Conta/carteiras | Sidebar desktop; links de perfil/carteiras e menu secundário recolhível mobile; campos e ícones fornecidos                                                    |
| Rodapé          | Facebook, Instagram, Twitter, LinkedIn e YouTube em botões com borda; nomes de carteiras distribuídos no container                                            |

Os controles continuam interativos: dados, quantidades, estoque e totais vêm da API. Exemplos de itens/carteiras do Figma não são inseridos artificialmente nas contas. Tag RARO depende de `rarity`; coração preenchido depende do favorito salvo. Abas de catálogo, cupom, paginação de relacionados, edição e compra usam seus fluxos reais.

## Diferenças e extensões

- As referências visuais versionadas verificam regressão da própria aplicação; não certificam equivalência pixel a pixel com o Figma.
- Ícones sem export fornecido usam Lucide ou SVGs inline, incluindo olho de senha visível e parte dos ícones de carteira/social. Redes sociais levam às páginas iniciais das plataformas, sem inventar perfis KURIO.
- O menu aberto de `select` nativo depende do navegador/sistema operacional. Seu controle fechado segue os tokens e alinhamentos da página.
- As 19 avaliações são ilustrativas e abrem uma explicação; não há API de avaliações reais. Dados extras reutilizam assets para exercitar busca/paginação.
- Loading, falhas, sessão expirada, recusa de pagamento e reconexão são extensões funcionais com os mesmos tokens e feedback acessível.
- Confirmação da compra, edição de carteira e campos adicionais necessários aos fluxos estendem a referência estática. Dados persistidos determinam a quantidade de carteiras exibidas.
- O botão `Ver no Etherscan` do layout informa a simulação por notificação; não abre uma transação fictícia. Controles de diagnóstico aparecem apenas quando habilitados pela URL, fora da interface normal.

Movimento reduzido desativa fades e scroll suave. Detalhes de foco, animação e carregamento ficam em [Arquitetura](../ARCHITECTURE.md#acessibilidade-e-performance); resultados de acessibilidade/regressão ficam em [Validação](VALIDATION.md).
