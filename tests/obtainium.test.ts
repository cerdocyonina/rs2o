import { test, expect } from "bun:test";
import { makeObtainiumLink } from "../src/shared/obtainium";

test("makeObtainiumLink строит redirect-ссылку с источником rustore.ru/catalog/app", () => {
  expect(makeObtainiumLink("ru.dublgis.dgismobile")).toBe(
    "https://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://www.rustore.ru/catalog/app/ru.dublgis.dgismobile",
  );
});
