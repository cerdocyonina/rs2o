# rs2o — RuStore-2-Obtainium

Поиск по каталогу RuStore с иконками, рейтингом и описанием. Клик по
карточке открывает в [Obtainium](https://github.com/ImranR98/Obtainium)
экран "Add App" с уже подставленным источником
`https://www.rustore.ru/catalog/app/{packageName}`. Скачивает и обновляет
APK сам Obtainium, rs2o только ищет.

```bash
bun install
bun dev      # dev-сервер с HMR
bun start    # продакшен
bun test
```

Сервер нужен как прокси: `backapi.rustore.ru` не отдаёт CORS, а результаты
поиска кэшируются на 5 минут, чтобы не долбить API. RuStore может резать
запросы не из РФ — выход сервера к `*.rustore.ru` должен идти через
российский IP.

## Требования к Obtainium

Нужен **Obtainium ≥ 1.7.2**. Что сломалось в RuStore и где починено:

| Что изменилось у RuStore | Версия Obtainium с фиксом |
|---|---|
| `overallInfo` и `download-link` требуют подпись запроса (HTTP 419 без неё) | 1.6.12 |
| CDN с APK (`static-m.rustore.ru`) перешёл на Russian Trusted Root CA (Минцифры) | 1.6.14 |
| Приложения только со split APK | 1.6.16 |
| Доверие корню Минцифры только для `rustore.ru`, сеть через Cronet и хранилище Android | 1.7.2 |
| Исправлено получение ссылок на скачивание при фоновых проверках | 1.7.2 |

Начиная с 1.6.15 Obtainium сам умеет искать по RuStore ("Add App" →
поиск), но показывает только название и package name.

## Сертификаты RuStore и pinning

Сейчас RuStore использует два CA:

- `rustore.ru`, `www`, `backapi`, `api`, `static` — HARICA (публичный CA, доверенный в Android);
- `static-m.rustore.ru` (откуда качаются APK) — Russian Trusted Sub CA → Russian Trusted Root CA.

**Настраивать ничего не нужно.** В Obtainium ≥ 1.7.2 корень Минцифры
вшит в `network_security_config` как доверенный только для `rustore.ru` и
поддоменов. Для остальных сайтов он не действует, ставить его в систему не
надо.

Pinning опционален и только ужесточает проверку:
"Settings" → "Update checks" → "Certificate pinning" → "Enable certificate
pinning". Встроенный набор для `rustore.ru` (с поддоменами) уже содержит
HARICA TLS RSA/ECC Root CA 2021 и Russian Trusted Root CA. С включённым
pinning для RuStore доверяются только эти три корня. Если RuStore снова
сменит CA, загрузки сломаются: тогда выключите pinning или добавьте свой
pin set с новым корнем.

## Ограничения

- Платные приложения помечены "платное": у Obtainium нет аккаунта RuStore, так что купленную копию он не получит (на реальном платном приложении не проверялось).
- Часть карточек — импортированные в RuStore приложения без APK у самого RuStore (например, `com.github.android`). На них Obtainium выдаёт "No APK found", а по ответу поиска их не отличить.
- Эндпоинты неофициальные и могут поменяться без предупреждения.
