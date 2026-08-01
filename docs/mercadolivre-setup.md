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

## O que voce precisa fazer uma vez

### 1. Criar o app no Mercado Livre

- Entre em https://developers.mercadolivre.com.br -> **Suas aplicacoes** -> criar.
- Copie o **App ID** (client id) e o **Secret Key** (client secret).
- Em **Redirect URI** cadastre EXATAMENTE a mesma URL do `.env.local`
  (`ML_REDIRECT_URI`). Precisa bater caractere por caractere, inclusive a porta.

### 2. Preencher o `.env.local`

```
ML_CLIENT_ID=seu-app-id
ML_CLIENT_SECRET=seu-client-secret
ML_REDIRECT_URI=http://localhost:3000/api/ml/callback
```

> **Atencao na porta:** o `redirect_uri` tem que apontar pra porta onde o app esta
> rodando. Se o `npm run dev` subir em outra porta (ex: 3006 porque a 3000 esta ocupada),
> ajuste a porta aqui E no cadastro do app no ML. O ideal e rodar esse projeto sozinho
> pra ele pegar sempre a 3000.

### 3. Conectar

- Abra o app, escolha a fonte **Mercado Livre** e clique em **Conectar Mercado Livre**.
- Faca o login no ML e autorize. Voce volta pro app ja conectado.
- O token fica salvo em `.ml-tokens.json` (no `.gitignore`, nunca vai pro GitHub) e
  se renova sozinho depois disso.

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
