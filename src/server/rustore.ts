import type { SearchResponse } from "../shared/types";

const SEARCH_URL = "https://backapi.rustore.ru/applicationData/apps";
const PAGE_SIZE = 20;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

type RuStoreApp = {
  packageName: string;
  appName: string;
  iconUrl: string;
  shortDescription: string | null;
  averageUserRating: number;
  roundedDownloadsText: string;
};

type RuStoreSearchResponse = {
  code: string;
  message: string | null;
  body: {
    content: RuStoreApp[];
    pageNumber: number;
    totalPages: number;
  } | null;
};

export function normalizeSearchResponse(raw: RuStoreSearchResponse): SearchResponse {
  if (raw.code !== "OK" || !raw.body) {
    throw new Error(`RuStore API error: ${raw.message ?? raw.code}`);
  }
  return {
    apps: raw.body.content.map(app => ({
      packageName: app.packageName,
      appName: app.appName,
      iconUrl: app.iconUrl,
      shortDescription: app.shortDescription ?? "",
      rating: app.averageUserRating,
      downloadsText: app.roundedDownloadsText,
    })),
    hasMore: raw.body.pageNumber + 1 < raw.body.totalPages,
  };
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

type SearchClientOptions = {
  fetchImpl?: FetchLike;
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
};

export function createSearchClient(options: SearchClientOptions = {}) {
  const {
    fetchImpl = fetch,
    ttlMs = 5 * 60_000,
    maxEntries = 500,
    now = Date.now,
  } = options;

  const cache = new Map<string, { expiresAt: number; value: SearchResponse }>();
  const inFlight = new Map<string, Promise<SearchResponse>>();

  async function fetchSearch(query: string, page: number): Promise<SearchResponse> {
    const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&pageNumber=${page}&pageSize=${PAGE_SIZE}`;
    const response = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`RuStore API returned HTTP ${response.status}`);
    }
    return normalizeSearchResponse((await response.json()) as RuStoreSearchResponse);
  }

  async function search(query: string, page: number): Promise<SearchResponse> {
    const key = `${query.toLowerCase()}|${page}`;

    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.value;
    if (cached) cache.delete(key);

    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = fetchSearch(query, page)
      .then(value => {
        if (cache.size >= maxEntries) {
          // Map хранит порядок вставки — выбрасываем самую старую запись
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        cache.set(key, { expiresAt: now() + ttlMs, value });
        return value;
      })
      .finally(() => inFlight.delete(key));

    inFlight.set(key, promise);
    return promise;
  }

  return { search };
}
