// Obtainium парсит источник RuStore только с хоста rustore.ru
// и путём /catalog/app/{pkg} (lib/app_sources/rustore.dart).
// Ссылка прямая: хелпер apps.obtainium.imranr.dev/redirect.html
// сломан (301 на localhost), а свой странице посредник не нужен.
export function makeObtainiumLink(packageName: string): string {
  return `obtainium://add/https://www.rustore.ru/catalog/app/${packageName}`;
}
