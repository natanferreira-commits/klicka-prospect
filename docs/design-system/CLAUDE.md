# Klicka — regras de design

## Marca
- Nome escrito sempre minúsculo com ponto: **klicka.** (não "Klica", não "Klicka Leads").
- Wordmark = `klicka-logo.png` (PNG branco, transparente). Nunca redesenhar em texto/SVG.

## Fonte única de estilo
- `nocturne.css` é a ÚNICA fonte de cor, tipo, espaço, raio e sombra.
- Nunca escrever hex, nome de fonte ou px que os tokens já carregam. Use `var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`.
- Exceção: espaçamento de escala de página (seções de 88–110px) — os tokens param em 22.4px.

## Referência obrigatória
Antes de criar QUALQUER tela nova, ler `Klicka DS.dc.html` e reusar as classes/padrões
de lá (botão, input, tabela, tag, card, dialog, drawer, toast, empty state, shell do app,
paginação, gráfico). Se um padrão não existe lá, criar nele primeiro e só depois usar na tela.

## Direção visual (Nocturne)
- Fundo escuro, layout alinhado à esquerda e assimétrico, muito respiro (produto é "espaçado", poucas ações por tela).
- Ação primária é **contorno** de accent, nunca preenchimento sólido.
- Accent (#9184d9) só como linha, borda, marca curta e brilho — nunca inundando área grande.
  Única exceção: a faixa de números da landing (`--color-section`).
- Réguas livres desvanecem nas pontas (48px por lado). Bordas de caixa e separadores internos ficam sólidos.
- Hierarquia é tamanho e espaço, não peso: não passar títulos de weight 500.
- Sem preto puro nem branco puro. Sem sombra empilhada.
- Ícones: Phosphor (`ph ph-*`), sempre em `currentColor`.
- `:focus-visible` = anel de 2px do accent. Nunca o azul padrão do browser.

## Conteúdo
- Copy em pt-BR, direta e sem corporativês. Sem emoji.
- Números de produto (preços, volumes, métricas) são placeholders até o cliente confirmar.
  Marcar como placeholder ao entregar.
- Dados de demonstração precisam ser plausíveis por cidade (bairro real da cidade buscada, DDD correto).

## Técnico
- Cada tela é um `.dc.html` único. Estilo inline + classes do `nocturne.css`.
- Tweaks (props) para o que edição direta não alcança: comportamento, variante, flag que muda várias coisas.
