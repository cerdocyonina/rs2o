// Obtainium парсит источник RuStore только с хоста rustore.ru
// и путём /catalog/app/{pkg} (lib/app_sources/rustore.dart).
// Ссылка прямая: хелпер apps.obtainium.imranr.dev/redirect.html
// сломан (схлопывает "obtainium://" в "obtainium:/" и ссылается на
// localhost), а своей странице посредник не нужен.
export function makeObtainiumLink(packageName: string): string {
  return `obtainium://add/https://www.rustore.ru/catalog/app/${packageName}`;
}
