import type { SearchResult } from "./types";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const AUTOCOMPLETE_ENDPOINT =
  "https://places.googleapis.com/v1/places:autocomplete";

export type LocationSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
};

export async function autocompleteLocation(
  input: string,
  apiKey: string,
): Promise<LocationSuggestion[]> {
  const res = await fetch(AUTOCOMPLETE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["br"],
      languageCode: "pt-BR",
      includedPrimaryTypes: [
        "locality",
        "sublocality",
        "administrative_area_level_2",
        "administrative_area_level_1",
        "neighborhood",
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Places Autocomplete ${res.status}: ${errText.slice(0, 500)}`,
    );
  }

  type ApiSuggestion = {
    placePrediction?: {
      placeId?: string;
      place?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  };

  const data = (await res.json()) as { suggestions?: ApiSuggestion[] };
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<ApiSuggestion["placePrediction"]> => !!p)
    .map((p) => ({
      placeId: p.placeId ?? p.place?.split("/").pop() ?? "",
      mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      fullText: p.text?.text ?? "",
    }));
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.types",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

type PlaceApi = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  types?: string[];
  googleMapsUri?: string;
};

function normalize(p: PlaceApi): SearchResult {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    category: p.types?.[0] ?? "",
    address: p.formattedAddress ?? "",
    rating: typeof p.rating === "number" ? p.rating : null,
    reviewCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
  };
}

export async function searchPlaces(
  query: string,
  apiKey: string,
  maxPages = 3,
): Promise<{ results: SearchResult[]; totalFound: number }> {
  const all: SearchResult[] = [];
  let pageToken: string | undefined;

  for (let i = 0; i < maxPages; i++) {
    const body: Record<string, unknown> = {
      textQuery: query,
      pageSize: 20,
      languageCode: "pt-BR",
      regionCode: "BR",
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Places API ${res.status}: ${errText.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      places?: PlaceApi[];
      nextPageToken?: string;
    };
    all.push(...(data.places ?? []).map(normalize));

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { results: all, totalFound: all.length };
}
