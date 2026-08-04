@AGENTS.md

# Design System — klicka. (Nocturne)

A direção visual é **fechada e de alta fidelidade**. Antes de criar ou alterar QUALQUER tela, siga:

- **Fonte única de estilo:** `app/nocturne.css` (tokens + classes de componente). Nunca escrever hex, nome de fonte ou px que já exista como token. Use `var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)` e as classes `.btn`, `.input`, `.field`, `.table`, `.tag`, `.card`, `.hr`, `.elev-*`, `.dialog`.
- **Regras completas:** `docs/design-system/CLAUDE.md`. Handoff e spec: `docs/design-system/HANDOFF.md`. Protótipos de referência: `docs/design-system/refs/` (Landing, DS, Sitemap — abrir no navegador, NÃO portar o `support.js`).
- **Marca:** sempre `klicka.` (minúsculo, com ponto). Wordmark = `public/klicka-logo.png` (nunca redesenhar em texto/SVG).
- **Não-negociáveis:** ação primária é **contorno** de accent (nunca preenchimento sólido); accent (`#9184d9`) só como linha/borda/ícone/brilho, nunca inunda área grande (exceção: faixa de números da landing); títulos no máximo weight 500; réguas livres desvanecem 48px nas pontas; sem preto/branco puro; `:focus-visible` = anel de 2px do accent; ícones **Phosphor** (`@phosphor-icons/react`), sempre `currentColor`.
- **Rotas (sitemap):** ver `docs/design-system/refs/Klicka Sitemap.dc.html`. MVP público: `/` `/planos` `/termos` `/privacidade`; acesso: `/cadastro` `/entrar` `/recuperar` `/confirmar/:token`; produto: `/app/buscar` `/app/buscas/:id` `/app/historico`; conta: `/app/conta` `/app/conta/plano` `/app/checkout`.

> Transição em andamento: a ferramenta em `/app` ainda usa utilitários Tailwind (roxo antigo) e será migrada pro nocturne. Landing, login e cadastro já seguem o DS.
