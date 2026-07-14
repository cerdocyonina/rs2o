import { test, expect } from "bun:test";
import { normalizeSearchResponse, createSearchClient } from "../src/server/rustore";

// усечённая копия реального ответа backapi.rustore.ru/applicationData/apps (query=2gis)
const rawFixture = {
  code: "OK",
  message: null,
  body: {
    content: [
      {
        appId: 260799,
        packageName: "ru.dublgis.dgismobile",
        minSdkVersion: 28,
        appName: "2ГИС: навигатор, транспорт, друзья на карте",
        shortDescription:
          "Геопозиция близких. Автомобильный и пешеходный навигатор. Расписание автобусов.",
        iconUrl: "https://static.rustore.ru/2026/2/2/1e/apk/260799/content/ICON/icon.png",
        appType: "MAIN",
        versionCode: 282010622,
        price: 0,
        averageUserRating: 4.23,
        totalRatings: 38092,
        isNavSuggest: false,
        roundedDownloadsText: "20 млн +",
      },
    ],
    pageNumber: 0,
    pageSize: 20,
    totalElements: 99,
    totalPages: 99,
  },
  timestamp: "2026-07-14T15:43:54.753Z",
};

test("normalizeSearchResponse маппит поля и считает hasMore", () => {
  const result = normalizeSearchResponse(rawFixture);
  expect(result).toEqual({
    apps: [
      {
        packageName: "ru.dublgis.dgismobile",
        appName: "2ГИС: навигатор, транспорт, друзья на карте",
        iconUrl: "https://static.rustore.ru/2026/2/2/1e/apk/260799/content/ICON/icon.png",
        shortDescription:
          "Геопозиция близких. Автомобильный и пешеходный навигатор. Расписание автобусов.",
        rating: 4.23,
        downloadsText: "20 млн +",
      },
    ],
    hasMore: true,
  });
});

test("normalizeSearchResponse: hasMore=false на последней странице", () => {
  const lastPage = { ...rawFixture, body: { ...rawFixture.body, pageNumber: 98 } };
  expect(normalizeSearchResponse(lastPage).hasMore).toBe(false);
});

function fixtureResponse() {
  return new Response(JSON.stringify(rawFixture), {
    headers: { "Content-Type": "application/json" },
  });
}

test("search кэширует одинаковые запросы в пределах TTL", async () => {
  let calls = 0;
  let nowMs = 0;
  const client = createSearchClient({
    fetchImpl: async () => (calls++, fixtureResponse()),
    ttlMs: 5 * 60_000,
    now: () => nowMs,
  });

  const first = await client.search("2gis", 0);
  const second = await client.search("2gis", 0);
  expect(calls).toBe(1);
  expect(second).toEqual(first);

  nowMs = 5 * 60_000 + 1;
  await client.search("2gis", 0);
  expect(calls).toBe(2);
});

test("search дедуплицирует одновременные одинаковые запросы", async () => {
  let calls = 0;
  const client = createSearchClient({
    fetchImpl: async () => {
      calls++;
      await Bun.sleep(10);
      return fixtureResponse();
    },
  });

  const [a, b] = await Promise.all([client.search("2gis", 0), client.search("2gis", 0)]);
  expect(calls).toBe(1);
  expect(a).toEqual(b);
});

test("search бросает ошибку при code !== OK", async () => {
  const client = createSearchClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ code: "ERROR", message: "bad", body: null })),
  });
  expect(client.search("2gis", 0)).rejects.toThrow();
});
