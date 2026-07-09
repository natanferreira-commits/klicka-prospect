# Klicka Prospect

Lead extractor via Google Maps Places API + scraping HTML.

Ferramenta interna que transforma uma busca tipo "Dentistas Niterói" numa lista de leads B2B enriquecida com email, WhatsApp e Instagram, exportável em CSV pra cadência de outbound.

Ver [docs/PRD-lead-extractor.md](docs/PRD-lead-extractor.md) pro documento de produto completo.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- TypeScript
- cheerio (scraping HTML)
- papaparse (export CSV)
- Google Places API (New)

## Setup local

1. Instale as dependências (já feito no scaffold):
   ```
   npm install
   ```

2. Configure a chave da Google Places API:
   - Crie projeto em [console.cloud.google.com](https://console.cloud.google.com/)
   - Habilite **Places API (New)**
   - Crie API key em **APIs & Services > Credentials**
   - Restrinja a key: em **API restrictions**, marca só Places API (New)
   - Em **Billing > Budgets & alerts**, seta teto de $50/mês com alerta em $25
   - Cole a chave em `.env.local`:
     ```
     GOOGLE_MAPS_API_KEY=xxx
     ```

3. Rode local:
   ```
   npm run dev
   ```
   Abre em [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Push do repo no GitHub
2. Em [vercel.com/new](https://vercel.com/new), importa o repo
3. Em **Environment Variables**, adiciona `GOOGLE_MAPS_API_KEY` com o valor
4. Deploy

Tier Hobby serve pro MVP (limite de 10s por API route). Se precisar de scrapes maiores, migra pra Pro (60s).

## Estrutura

```
app/
  api/
    search/route.ts       POST: busca no Places API
    enrich/route.ts       POST: scraping dos sites em lote
  layout.tsx
  page.tsx                Página única com 3 estados: search, results, enriched
lib/
  types.ts                tipos compartilhados
  places.ts               cliente Google Places API (New)
  url-classifier.ts       classifica URL: website, insta, wa, linktree, etc
  scraper.ts              scraper com cheerio + regex
docs/
  PRD-lead-extractor.md
  PRD-lead-extractor.pdf
```

## Uso

1. Digita `Dentistas Niterói` (ou qualquer tipo + cidade/bairro)
2. Marca os que interessam
3. Clica em **Extrair contatos**
4. Exporta CSV
