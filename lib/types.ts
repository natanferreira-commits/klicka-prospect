export type SearchResult = {
  placeId: string;
  name: string;
  category: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
};

export type ScrapeStatus =
  | "ok"
  | "no_website"
  | "timeout"
  | "parse_failed"
  | "empty";

export type EnrichmentResult = {
  placeId: string;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  scrapeStatus: ScrapeStatus;
};

export type EnrichedRow = SearchResult & EnrichmentResult;
