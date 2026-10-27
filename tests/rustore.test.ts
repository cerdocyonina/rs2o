import { test, expect } from "bun:test";
import { normalizeSearchResponse, createSearchClient } from "../src/server/rustore";

// усечённая копия реального ответа backapi.rustore.ru/applicationData/apps (query=2gis, pageSize=2)
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
          "Автомобильный и пешеходный навигатор. Расписание автобусов. Геопозиция близких. ",
        iconUrl:
          "https://static.rustore.ru/2026/2/2/1e/apk/260799/content/ICON/8e439c58-11cf-4e0a-a3dc-9596eda08cfd.png",
        appType: "MAIN",
        versionCode: 282010635,
        price: 0,
        averageUserRating: 4.21,
        totalRatings: 42008,
        labelIds: [7],
        isNavSuggest: false,
        roundedDownloadsText: "30 млн +",
      },
    ],
    advertAppInfo: null,
    pageNumber: 0,
    pageSize: 2,
    totalElements: 122,
    totalPages: 61,
    searchQueryId: "ad26b0994743f95d",
    showcaseQId: "ad26b0994743f95d",
    spellchecker: { originQuery: "2gis", modifiedQuery: "2gis" },
    navigSuggestsAppsIds: [],
    paymentTypeFilterEnabled: false,
    searchAnimationUrl: null,
  },
  timestamp: "2026-10-27T07:44:42.512Z",
};

test("normalizeSearchResponse маппит поля и считает hasMore", () => {
  const result = normalizeSearchResponse(rawFixture);
  expect(result).toEqual({
    apps: [
      {
        packageName: "ru.dublgis.dgismobile",
        appName: "2ГИС: навигатор, транспорт, друзья на карте",
        iconUrl:
          "https://static.rustore.ru/2026/2/2/1e/apk/260799/content/ICON/8e439c58-11cf-4e0a-a3dc-9596eda08cfd.png",
        shortDescription:
          "Автомобильный и пешеходный навигатор. Расписание автобусов. Геопозиция близких. ",
        rating: 4.21,
        downloadsText: "30 млн +",
        isPaid: false,
      },
    ],
    hasMore: true,
  });
});

test("normalizeSearchResponse: hasMore=false на последней странице", () => {
  const lastPage = { ...rawFixture, body: { ...rawFixture.body, pageNumber: 60 } };
  expect(normalizeSearchResponse(lastPage).hasMore).toBe(false);
});

test("normalizeSearchResponse помечает платные приложения", () => {
  const paid = {
    ...rawFixture,
    body: { ...rawFixture.body, content: [{ ...rawFixture.body.content[0]!, price: 9900 }] },
  };
  expect(normalizeSearchResponse(paid).apps[0]!.isPaid).toBe(true);
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
