# Handoff: klicka. — design system e telas

## Visão geral

**klicka.** é um SaaS de prospecção local: o usuário escolhe um nicho e uma região, a
aplicação varre negócios locais via API do Google Maps e devolve os contatos (nome,
telefone, site, nota, nº de avaliações, endereço). Público: quem vende serviço para
empresa — designers, gestores de tráfego, social media, agências.

Este pacote contém a direção visual fechada, os tokens, a especificação dos componentes,
a arquitetura de informação completa e três telas de referência.

## Sobre os arquivos de design

Os arquivos em `design/` são **referências de design escritas em HTML** — protótipos que
mostram aparência e comportamento pretendidos. **Não são código de produção para copiar.**

A tarefa é **recriar esses designs no ambiente do codebase de destino** (Next/React, Vue,
etc.) usando os padrões e bibliotecas já estabelecidos lá. Se o codebase ainda não existe,
escolha o stack e implemente seguindo esta especificação.

Os `.dc.html` usam um runtime próprio de prototipagem (`support.js`). Abra-os no navegador
para ver e interagir — **não porte esse runtime**. O que importa neles é: layout, tokens,
copy, estados e comportamento.

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamento e interações são finais.
Recreie a UI fielmente usando os componentes do codebase. Onde este documento diz um
valor, ele é o valor.

Exceção — são **placeholders** aguardando confirmação do cliente e podem mudar sem afetar
o design: preços (R$ 97 / R$ 297), a faixa de números (2,4 mi / 5.570 / 38 s), volumes de
crédito (25 / 2.000 / 10.000) e todos os leads de demonstração.

---

## Design tokens

Ver `tokens.css` (CSS custom properties) ou `tailwind.config.js` — mesmos valores nos dois.
Use um dos dois como fonte única; não mantenha valores divergentes.

### Cor

| Papel | Hex | Uso |
| --- | --- | --- |
| `bg` | `#161826` | fundo da página |
| `surface` | `#232532` | card, painel, input, modal, drawer |
| `text` | `#e9e9ed` | texto principal |
| `accent` | `#9184d9` | linha, borda, ícone, marca curta, brilho |
| `divider` | `#e9e9ed` a 16% | régua e borda |
| `section` / `section-glow` | `#262a60` / `#353b80` | única área grande saturada |

Rampa neutra (100→900): `#f3f5fe` `#e4e7f5` `#cfd3e5` `#b2b6ca` `#9397ab` `#75798c` `#595d6c` `#3f424d` `#292b31`
Rampa do accent (100→900): `#f5f4ff` `#e7e5fe` `#d2cefd` `#b5abfc` `#968ae0` `#796cbf` `#5d5294` `#423a6a` `#2b2741`

Regras não negociáveis:

- **Accent nunca preenche área grande.** Ele é linha, borda, ícone e texto curto. A única
  exceção no produto inteiro é a faixa de números da landing (`section` → `section-glow`).
- Accent puro contra o fundo dá ~3:1 — serve para ícone, texto grande e cromo de
  interface. Para **texto corrido em accent use `accent-300`** (`#d2cefd`).
- No escuro: passos 700–900 para preenchimento tintado, hover e borda sutil; 500 é a base;
  100–300 para texto sobre esses tints.
- Sem preto puro e sem branco puro. Nenhum hex fora destas rampas.
- Texto secundário = `text` a 55% de opacidade (`color-mix(in srgb, #e9e9ed 55%, transparent)`).

### Tipografia

Inter (Google Fonts, pesos 400/500/600/700). Títulos em **weight 500** — nunca mais.
Hierarquia é tamanho e espaço, não peso.

| Nível | Tamanho | line-height | letter-spacing |
| --- | --- | --- | --- |
| h1 | 42px | 1.12 | -0.015em |
| h2 | 32px | 1.12 | -0.015em |
| h3 | 25px | 1.12 | -0.015em |
| h4 | 20px | 1.12 | -0.015em |
| h5 | 16px | 1.12 | -0.015em |
| h6 | 13px | 1.12 | 0.08em + uppercase |
| corpo | 15px | 1.55 | — |

Hero da landing: `clamp(40px, 5.4vw, 70px)`, line-height 1.02, letter-spacing -0.03em.
Título de seção da landing: `clamp(28px, 3.2vw, 42px)`, letter-spacing -0.025em.
Kicker de seção: 11px, uppercase, letter-spacing 0.14em, cor `accent`.
Números tabulares (`font-variant-numeric: tabular-nums`) em toda coluna numérica.

### Espaço

Escala densa (0.70×) para **interior de componente**: 2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4px.
Espaço de **página** é maior e fica fora da escala: seções respiram 88–110px verticais,
padding lateral 32px (landing) e 56px (app). Container da landing: `max-width: 1180px`.
Coluna de conteúdo do app/docs: `max-width: 1000px`.

### Raio e elevação

Raio: 4px (sm, chip pequeno) · **8px (md — padrão: botão, input, card)** · 14px (lg — painel, modal, drawer).

| Nível | Valor | Onde |
| --- | --- | --- |
| sm | `0 0 0 1px #3f424d` | card em lista |
| md | `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)` | painel de resultado, dropdown |
| lg | `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)` | **só** modal, drawer e toast |

Nunca empilhar sombra. No escuro, elevação é fio + escuridão ambiente.

### Ícones

**Phosphor Icons**, peso regular, sempre em `currentColor`.
16px em linha de texto · 17px dentro de botão · 20–22px em cabeçalho de card.
`npm i @phosphor-icons/react`.

### Marca

Wordmark = `design/klicka-logo.png` (PNG branco com transparência, 719×263). O nome se
escreve sempre minúsculo com ponto: **klicka.** Nunca redesenhar em texto ou SVG.
Alturas: 24px na topbar da landing, 20px na sidebar do app, 20px no footer.
⚠️ Ao usar em container flex-column, fixe `align-self: flex-start` — senão a imagem estica.

---

## Componentes

Referência viva e interativa: `design/Klicka DS.dc.html`.

### Botão

Altura 36px no app, **44px** em hero e formulário de conversão. Raio 8px, font-family de
título, weight 500, 14px (15px na variante grande). Ícone sempre à esquerda, gap 6px.
Padding horizontal ≈ 10px (12px+ na variante grande).

| Variante | Repouso | Hover | Active |
| --- | --- | --- | --- |
| **primary** | transparente, borda 1px `accent`, texto `accent` | fundo `accent` 12% | fundo `accent` 22% |
| **secondary** | transparente, borda 1px `divider`, texto `text` | fundo `text` 7% | fundo `text` 14% |
| **ghost** | sem borda, texto `accent` | fundo `accent` 10% | fundo `accent` 18% |
| **icon** | 36×36, sem padding | igual à variante base | igual |

`disabled`: opacidade 45%, `cursor: not-allowed`.
**A primária é contorno, nunca preenchimento sólido. Uma primária por tela.**

### Tag

11px, padding 3px 10px, raio 6px. `accent` (fundo `accent-800`, texto `accent-100`) marca
oportunidade e novidade — ex.: "sem site". `neutral` (fundo `neutral-800`, texto
`neutral-100`) é metadado. `outline` (borda `accent`, texto `accent`) é ação disponível,
não estado.

### Campo

Rótulo acima, 12px, `text` a 70%. Input: altura mínima 36px (44px em hero), padding 6px
10px, 14px, fundo `surface`, borda 1px `divider`, raio 8px, caret em `accent`.
Hover: borda `text` 45%. Foco: borda `accent` sem offset.
Erro: borda `accent-400` + linha de 12px em `accent-300` com ícone `warning-circle` 14px.
Desabilitado: opacidade 45%.
Radio: círculo 16px, borda 1.5px; marcado = fundo `accent` com `inset 0 0 0 4px` do fundo.
Segmented: grupo com borda `divider`, raio 8px, separador interno sólido de 1px; opção
selecionada recebe `inset 0 0 0 1px accent` e texto `accent`.

### Tabela (componente central do produto)

Cabeçalho: 11px, uppercase, letter-spacing 0.08em, `text` a 60%.
Régua de linha: 1px que **desvanece nos 48px de cada ponta** (gradiente para
transparente) — assinatura do sistema. `thead` usa `divider`; `tbody` usa `text` a 8%.
Hover de linha: `text` a 4%, sobreposto sem apagar a régua.
Célula: padding 12px 8px; 20px nas colunas de borda. Número à direita e tabular.
Célula de empresa = duas linhas: nome (font de título, 14px) + endereço (11px, muted).

Paginação: barra no pé com "1–3 de 248" à esquerda; à direita botões `icon` de seta,
números como botões secondary de 34px de largura, página atual com borda e texto `accent`.

### Card e métrica

Card: fundo `surface`, raio 8px, padding 18–24px, gap 5.6px, `shadow-sm`.
Estrutura: kicker (10px, uppercase, letter-spacing 0.1em, `accent`) → título (17px, font
de título) → corpo (13px, opacidade 0.8) → meta (11px, `text` a 50%).
Métrica: rótulo 12px muted acima, número 34px weight 500 letter-spacing -0.02em,
sublegenda 11px muted. Sem ícone decorativo e sem seta colorida de variação.
Barra de progresso: trilho 3px `neutral-800`, preenchimento `accent`, raio 2px.

### Gráfico

Barras com `accent-800`; **accent puro só na série ou barra em destaque**. Nunca mais de
uma cor saturada por gráfico. Rótulo de eixo 10px muted; o rótulo da barra destacada
ganha a cor `accent`.

### Modal, drawer, toast — os únicos com `shadow-lg`

Modal: backdrop `neutral-900` a 50%, centralizado, largura `min(440px, 100%)`, raio 14px,
padding 11.2px, fundo `surface`. Ações no rodapé alinhadas à direita: secondary + primary.
Entrada: `opacity 0→1` + `translateY(8px→0)` em 160ms ease-out.
Drawer: colado à direita, `width: min(420px, 100%)`, altura total, padding 24px, mesmo
backdrop. Cabeçalho com kicker + título + botão `icon` de fechar à direita; pares
rótulo/valor no corpo; ações grudadas no pé.
Toast: canto inferior direito, 24px de margem, ícone `check-circle` em `accent`, texto
14px, ação "Desfazer" como ghost. Auto-dismiss em **2600ms**. Entrada de 180ms.
Fechar modal e drawer: clique no backdrop e tecla Esc.

### Estado vazio

**Alinhado à esquerda**, nunca centralizado na tela. Padding 36px 24px em `surface` com
`shadow-sm`. Um ícone de 26px em `neutral-500`, um h4 do que aconteceu, uma frase de 13px
do que fazer (máx. 34ch), uma ação. **Sem ilustração.**

### Shell do app

Toda tela logada usa a mesma moldura.

- **Sidebar**: 232px fixa, `border-right: 1px divider`, padding 24px 20px. Logo no topo
  (20px). Grupos de navegação com rótulo de 10px uppercase em `neutral-600` e itens de
  13px em `neutral-300`. Item ativo: `inset 0 0 0 1px accent`, texto `accent`, raio 4px.
  No pé: medidor de crédito ("1.412 créditos" 10px muted + barra de 3px).
- **Topbar**: padding 14px 20px, `border-bottom: 1px divider`. Título da tela (16px, font
  de título) à esquerda, ação primária à direita.
- **Conteúdo**: padding 64px 56px, coluna de `max-width: 1000px`, alinhada à esquerda.

Sidebar carrega **só quatro destinos**: Nova busca · Minhas listas · Histórico · Conta.
Ficam fora de propósito: exportações (vivem na tela de resultado), plano e faturas e
equipe (dentro de Conta), ajuda (link discreto no pé), detalhe do lead (drawer, nunca
página).

### Estados globais de interação

- `:focus-visible` = `outline: 2px solid accent; outline-offset: 2px`. **Nunca** o anel
  azul padrão do browser. Em input, offset 0.
- `::selection` = `accent` a 30%.
- Régua livre (`hr`, separador de seção) **desvanece 48px em cada ponta**. Borda de caixa
  e separador dentro de controle ficam sólidos.
- Link: cor `accent`, hover `accent-300`, `text-underline-offset: 3px`.

---

## Telas

### 1. Landing — `design/Klicka Landing.dc.html`

Rota `/`. É o canal de captação: a hero **já é o produto**, com busca funcionando.

Seções, em ordem:

1. **Topbar** sticky, `backdrop-filter: blur(14px)`, fundo `bg` a 78%. Logo 24px à
   esquerda; links "Como funciona / Para quem é / Planos" (14px, `neutral-300`); "Entrar"
   ghost + "Criar conta" primary à direita.
2. **Hero** (padding-top 88px). Kicker "PROSPECÇÃO LOCAL" + traço de 56px em accent +
   "DADOS DO GOOGLE MAPS". H1 de 3 linhas, `max-width: 15ch`. Subtítulo 19px
   `neutral-300`, `max-width: 52ch`. Fundo: dois gradientes radiais suaves (accent 13% no
   canto superior esquerdo, `section-glow` 30% à direita) sobre `bg`.
3. **Busca da demo**. Rótulo "DEMONSTRAÇÃO AO VIVO — BUSQUE AGORA" com bolinha de 7px em
   accent. Linha em `surface` a 80%, raio 14px, padding 16px, `shadow-sm`: select de nicho
   (flex 1 1 220px), input de região (flex 1 1 260px), botão primary de 44px com ícone
   `magnifying-glass`.
4. **Painel de resultado**. Cabeçalho "{Nicho} em {Região}" (17px) + "N negócios
   encontrados · M sem site" (13px muted) + tags CSV / Excel / Enviar pro CRM à direita.
   Tabela em `surface` com `shadow-md`, raio 14px. Colunas: Empresa · Telefone · Site ·
   Nota · Avaliações. A célula Site mostra o domínio ou a tag `accent` "sem site".
   Abaixo das linhas livres: **paywall** — 3 linhas com `filter: blur(4px)` e opacidade
   0.5, cobertas por overlay absoluto com gradiente para `surface` contendo
   "+N contatos nesta busca" e botão primary "Liberar a lista completa".
5. **Como funciona** — 3 colunas. Número "01" em accent 13px, régua de 1px que desvanece
   para a direita, h4, parágrafo 14px muted.
6. **Faixa de números** — full-bleed, `linear-gradient(120deg, section, section-glow)`,
   padding 72px. 4 números em `clamp(34px, 4vw, 52px)` com rótulo 13px em `accent-200`.
   **É a única área saturada grande do produto.**
7. **Para quem é** — 4 cards com ícone `monitor` / `target` / `instagram-logo` /
   `users-three`.
8. **O que vem em cada contato** — duas colunas: texto à esquerda, 11 tags de campo à
   direita ("Nome do negócio", "Telefone", "WhatsApp", "Site", "Endereço completo",
   "Bairro", "Categoria", "Nota média", "Nº de avaliações", "Horário de funcionamento" e
   "Link do perfil no Maps" como `outline`).
9. **Planos** — 3 cards. O do meio (Pro) recebe `0 0 0 1px accent` + tag "mais assinado".
10. **FAQ** — 4 `<details>` com separador de 1px `divider`, ícone `plus` em accent.
11. **CTA final** — bloco raio 14px, `linear-gradient(120deg, accent-900, surface)`,
    padding 64px 48px.
12. **Footer** — régua que desvanece, logo 20px a 85%, links 13px `neutral-400`, linha de
    copyright 12px muted.

### 2. Design system — `design/Klicka DS.dc.html`

Documentação navegável com sidebar de âncoras. Referência de implementação de todos os
componentes acima, com modal, drawer e toast funcionando (clique nos botões da seção
"Modal, drawer e toast"). Não precisa ir para produção — é material da equipe.

### 3. Sitemap — `design/Klicka Sitemap.dc.html`

Arquitetura de informação completa: 5 áreas, cada tela com rota e fase (MVP / v1 / v2),
e overlays/abas/estados aninhados na tela que os abre. Use como plano de implementação.
Resumo do que é **MVP**:

- Público: `/` · `/planos` · `/termos` · `/privacidade`
- Acesso: `/cadastro` · `/entrar` · `/recuperar` (+ `/recuperar/:token`) · `/confirmar/:token`
- Produto: `/app/buscar` · `/app/buscas/:id` · `/app/historico`
- Conta: `/app/conta` · `/app/conta/plano` · `/app/checkout`

---

## Interações e comportamento

### Busca da hero (landing)

Estado: `{ niche, region, status: 'done' | 'loading' }`.

- Monta **já com resultado carregado** (nicho padrão "Odontologia", região "Curitiba, PR")
  — a primeira impressão precisa ter dados na tela.
- Trocar o select dispara busca imediatamente; `Enter` no input de região também; o botão
  também.
- `loading`: substitui a tabela por 5 linhas de esqueleto — barras de 11px em
  `neutral-700` com `animation: pulse 1.1s ease-in-out infinite` entre 30% e 70% de
  opacidade. No protótipo o loading dura 950ms fixos; **em produção é a requisição real.**
- `done`: tabela + paywall.
- Na produção esta busca deve devolver os primeiros ~4 contatos reais sem exigir cadastro,
  e travar o resto. Os dados do protótipo são gerados no cliente com hash determinístico.

### Dados de demonstração — regra que não pode ser quebrada

O protótipo gera leads plausíveis **por cidade**: DDD correto e **bairro que existe
naquela cidade** (mapa de 14 capitais + fallback genérico "Centro / Zona Norte / …").
Num produto cuja proposta é precisão de dado local, uma demo dizendo "Setor Oeste,
Curitiba" destrói a credibilidade da hero. Se a demo em produção usar mock, respeite isso.

### Regras de formulário

- Região aceita "Cidade, UF". Cidade não encontrada no Maps → erro no campo, não toast.
- Antes de rodar uma busca no app, **estimar o custo em créditos** e confirmar em modal
  ("Gastar 248 créditos?"). Contato já entregue em busca anterior não é cobrado de novo.
- Sem crédito suficiente: modal de upgrade, nunca botão desabilitado sem explicação.

### Responsivo

Landing: colunas em `repeat(auto-fit, minmax(...))`, quebram sozinhas. A linha de busca é
`flex-wrap` — em telas estreitas os três campos empilham em largura cheia. Alvo de toque
nunca abaixo de 44px. O app é primariamente desktop (ferramenta de trabalho com tabela);
a sidebar de 232px deve virar drawer abaixo de 900px.

---

## Estado da aplicação

Por tela de busca/resultado:

- `niche`, `region`, filtros (`semSite: boolean`, `notaMinima: number`, `minAvaliacoes: number`)
- `status: idle | estimating | running | done | error`
- `results: Lead[]`, `selectedIds: Set`, `page`, `perPage`, `total`
- `credits: { used, limit }` — global, exibido na sidebar

`Lead`: `{ id, name, category, phone, whatsapp, site, rating, reviews, address, neighborhood, city, mapsUrl, alreadyDelivered: boolean }`

Estados obrigatórios em toda tela que mostra dado (se um não foi desenhado, a tela não
está pronta): carregando · vazio de primeira vez · vazio por filtro · erro da busca ·
sem créditos. Mais dois do app inteiro: sessão expirada e 404.

---

## Assets

- `design/klicka-logo.png` — wordmark, PNG branco transparente 719×263, enviado pelo
  cliente. Existe um SVG, mas **inutilizável como está**: o texto está como `<text>` com
  fonte não embutida e as classes `cls-*` vazias. Para trocar por SVG, reexportar com o
  texto convertido em contorno.
- Fonte: Inter, Google Fonts, pesos 400/500/600/700.
- Ícones: Phosphor Icons, peso regular.
- Não há fotografia no design atual. Se entrar, o sistema pede imagem sobre fundo escuro
  com `mix-blend-mode: lighten`.

## Arquivos deste pacote

```
tokens.css                    tokens como CSS custom properties
tailwind.config.js            os mesmos tokens no vocabulário do Tailwind
design/Klicka Landing.dc.html landing com a busca funcionando
design/Klicka DS.dc.html      design system navegável
design/Klicka Sitemap.dc.html arquitetura de informação
design/nocturne.css           folha de estilo completa do sistema base
design/klicka-logo.png        wordmark
design/CLAUDE.md              regras de design em formato curto — vale copiar para a
                              raiz do repo para o Claude Code seguir a direção visual
design/support.js             runtime dos protótipos — NÃO portar
```

Para ver os protótipos: abra os `.dc.html` no navegador (precisam estar na mesma pasta que
`support.js`, `nocturne.css` e `klicka-logo.png`, como já estão).
