import { test, expect } from "bun:test";
import { makeObtainiumLink } from "../src/shared/obtainium";

test("makeObtainiumLink строит прямую obtainium-ссылку с источником rustore.ru/catalog/app", () => {
  expect(makeObtainiumLink("ru.dublgis.dgismobile")).toBe(
    "obtainium://add/https://www.rustore.ru/catalog/app/ru.dublgis.dgismobile",
  );
});
