# Fonte Mercado Livre (setup)

O Lead Extractor agora tem duas fontes: **Google Maps** (como era) e **Mercado Livre**.
No modo ML voce busca por um nicho, ele lista as lojas que mais anunciam nesse nicho e
depois acha os contatos delas por busca web.

## Como funciona por dentro

1. Busca no `sites/MLB/search` do ML pelo nicho, deduplica por vendedor e enriquece cada
   loja unica via `/users/{id}` (nickname, reputacao, cidade/estado, link do perfil).
2. No "Extrair contatos", pra cada loja faz uma busca web pelo nome e tenta achar
   site proprio / Instagram / WhatsApp. Se acha site, raspa email e telefone dele
   reaproveitando o mesmo scraper do fluxo do Google.

## Onde o token fica guardado

O token do ML fica num **cookie httpOnly seguro do navegador** onde voce logou.
Isso funciona em serverless (Vercel) sem banco/KV externo. Consequencias:
- O acesso ao ML fica preso ao navegador onde voce clicou "Conectar".
- Se limpar os cookies do site, e so clicar em "Conectar" de novo.
- Como e uma ferramenta interna de um usuario so, isso resolve.

## Setup no Vercel (fluxo recomendado)

### 1. Criar o app no Mercado Livre

- Entre em https://developers.mercadolivre.com.br -> **Suas aplicacoes** -> criar.
- Copie o **App ID** (client id) e o **Secret Key** (client secret).

### 2. Descobrir a URL de producao do Vercel

No painel do projeto no Vercel, pegue o dominio de producao
(ex: `https://klicka-prospect.vercel.app`). A Redirect URI vai ser esse dominio
mais `/api/ml/callback`.

### 3. Cadastrar a Redirect URI no app do ML

No painel do app, no campo de URIs de redirecionamento, cole EXATAMENTE:

```
https://SEU-PROJETO.vercel.app/api/ml/callback
```

O ML aceita `https` de boa (e ate exige em producao).

### 4. Setar as variaveis no Vercel

No projeto do Vercel -> **Settings -> Environment Variables**, adicione (Production
e Preview):

```
ML_CLIENT_ID=seu-app-id
ML_CLIENT_SECRET=seu-client-secret
ML_REDIRECT_URI=https://SEU-PROJETO.vercel.app/api/ml/callback
ML_WEBSEARCH=duckduckgo
```

O `GOOGLE_MAPS_API_KEY` ja deve estar la (a busca do Google depende dele).
Depois de adicionar, faca um redeploy pra pegar as variaveis novas.

### 5. Conectar

- Abra a URL de producao, escolha a fonte **Mercado Livre** e clique em
  **Conectar Mercado Livre**.
- Faca o login no ML e autorize. Voce volta pro app ja conectado, e o token
  passa a renovar sozinho.

## Rodar local (opcional)

Se um dia quiser rodar na maquina, use `ML_REDIRECT_URI=http://localhost:3000/api/ml/callback`
no `.env.local`, cadastre essa mesma URL no app do ML, e rode o projeto sozinho pra
ele pegar a porta 3000.

## Busca de contatos: trocar o motor

Por padrao usa **DuckDuckGo** (sem chave, bom pra testar). Pra mais estabilidade/volume,
ligue o **Google Custom Search**:

1. No Google Cloud (mesma conta da chave de Maps), ative a **Custom Search JSON API**.
2. Crie um mecanismo em https://programmablesearchengine.google.com (busca na web toda)
   e pegue o **Search engine ID** (cx).
3. No `.env.local`:

```
ML_WEBSEARCH=google
GOOGLE_CSE_KEY=sua-chave
GOOGLE_CSE_CX=seu-cx
```

Gratis ate 100 buscas/dia, depois ~US$5 por mil.

## Limites atuais (MVP)

- Ate ~30 lojas por busca (2 paginas de 50 anuncios, ordenado por relevancia no nicho).
- Enrich em lotes de 10, sequencial, pra nao tomar bloqueio na busca gratuita.
- Contato via ML nunca sai da API (privacidade); tudo vem da busca web, entao a taxa de
  acerto varia por nicho.
