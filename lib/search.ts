import { Meilisearch } from "meilisearch";
import { DEFAULT_FILTERS } from "./types";
import type { Bounds, Filters, Listing, SearchCriteria, SortOption } from "./types";
import { enrichListing, LISTINGS, localSearch, normalizeSearchQuery } from "./data";

type MeiliHit = {
  id: string;
  title: string;
  category: string;
  price_per_night: number;
  rating: number;
  review_count: number;
  images: string[];
  _geo: { lat: number; lng: number };
  neighborhood?: string;
  summary?: string;
  amenities?: string[];
};

function normalize(hit: MeiliHit): Listing {
  const numericId = Number(hit.id.replace(/\D/g, "")) || 1;
  return enrichListing({
    id: hit.id,
    title: hit.title,
    category: hit.category,
    neighborhood: hit.neighborhood ?? "",
    summary: hit.summary ?? "",
    amenities: hit.amenities ?? [],
    pricePerNight: hit.price_per_night,
    rating: hit.rating,
    reviewCount: hit.review_count,
    images: hit.images,
    lat: hit._geo.lat,
    lng: hit._geo.lng,
  }, numericId - 1);
}

const host = process.env.NEXT_PUBLIC_MEILISEARCH_HOST;
const apiKey = process.env.NEXT_PUBLIC_MEILISEARCH_KEY;
const indexName = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX ?? "listings";
const client = host ? new Meilisearch({ host, apiKey }) : null;

const SORT_MAP: Partial<Record<SortOption, string>> = {
  price_asc:  "price_per_night:asc",
  price_desc: "price_per_night:desc",
  rating:     "rating:desc",
};

const MEILI_TIMEOUT_MS = 250;

export async function searchListings(
  query: string,
  category: string,
  bounds: Bounds,
  filters: Filters,
  sortBy: SortOption = "default",
  criteria?: SearchCriteria,
): Promise<Listing[]> {
  const effectiveQuery = normalizeSearchQuery(query);

  if (!client) {
    return localSearch(LISTINGS, effectiveQuery, category, bounds, filters, sortBy, criteria);
  }

  const filter: string[] = [
    `_geoBoundingBox([${bounds.north}, ${bounds.east}], [${bounds.south}, ${bounds.west}])`,
  ];

  if (category !== "all") filter.push(`category = "${category}"`);
  if (filters.priceMin > 0)     filter.push(`price_per_night >= ${filters.priceMin}`);
  if (filters.priceMax < 10000) filter.push(`price_per_night <= ${filters.priceMax}`);
  if (filters.minRating > 0)    filter.push(`rating >= ${filters.minRating}`);

  const sort = SORT_MAP[sortBy] ? [SORT_MAP[sortBy]!] : undefined;

  try {
    const result = await withTimeout(
      client.index(indexName).search<MeiliHit>(effectiveQuery, {
        filter,
        sort,
        limit: 50,
        attributesToRetrieve: [
          "id", "title", "category", "price_per_night", "rating",
          "review_count", "images", "_geo", "neighborhood", "summary", "amenities",
        ],
      }),
      MEILI_TIMEOUT_MS,
    );

    return localSearch(result.hits.map(normalize), "", "all", bounds, DEFAULT_FILTERS, sortBy, criteria);
  } catch {
    return localSearch(LISTINGS, effectiveQuery, category, bounds, filters, sortBy, criteria);
  }
}

export const isMeilisearchConfigured = Boolean(host);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Meilisearch request timed out"));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
