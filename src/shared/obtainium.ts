const REDIRECT_HELPER = "https://apps.obtainium.imranr.dev/redirect.html?r=";

// Obtainium парсит источник RuStore только с хоста rustore.ru
// и путём /catalog/app/{pkg} (lib/app_sources/rustore.dart).
export function makeObtainiumLink(packageName: string): string {
  return `${REDIRECT_HELPER}obtainium://add/https://www.rustore.ru/catalog/app/${packageName}`;
}
