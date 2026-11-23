# Публикация @ekho/telegram-api-mcp

Пакет этого форка — `@ekho/telegram-api-mcp`, репозиторий — [ekho/telegram-api-mcp](https://github.com/ekho/telegram-api-mcp). Имя исполняемой команды остаётся `telegram-api-mcp`. Исходный проект и автор: [timoncool/telegram-api-mcp](https://github.com/timoncool/telegram-api-mcp), лицензия MIT.

[Настройка workflow](../.github/workflows/publish.yml) и npm Trusted Publishing через OIDC для этого форка **завершена**. Пакет создан ручной публикацией `0.2.1`, доверие к GitHub Actions настроено, а [релиз v0.2.2](https://github.com/ekho/telegram-api-mcp/releases/tag/v0.2.2) успешно прошёл задания `validate` и `publish` в [запуске 45140379678](https://github.com/ekho/telegram-api-mcp/actions/runs/45140379678). Опубликованный архив собран из коммита `6a47f07f378b81121e6c11eba682b0541a2dda70`.

Для следующего выпуска переходите к разделу [«Последующие релизы»](#последующие-релизы). Разделы о создании пакета и Trusted Publisher ниже сохранены как справка об уже выполненной одноразовой настройке.

## Как работает workflow

| Событие | Результат |
| --- | --- |
| Опубликован обычный GitHub Release с тегом `v<version>` | Проверки и публикация в npm с тегом `latest` |
| Ручной запуск `workflow_dispatch` | Только проверки, без публикации |
| GitHub prerelease | Задание пропускается |
| Запуск в репозитории, отличном от `ekho/telegram-api-mcp` | Задание пропускается |

Один push коммита или тега публикацию не запускает: нужен опубликованный GitHub Release. Версия должна быть новой и стабильной, например `0.2.3`, а тег — в точности `v0.2.3`.

Workflow использует GitHub-hosted runners, Node.js 24 и npm **11.21.3**. Задание `validate` имеет только право чтения репозитория. Перед публикацией оно:

1. Сверяет имя пакета, публичный доступ, URL репозитория и версии в `package.json`, `package-lock.json` и `server.json`. Для релиза также проверяет совпадение тега с версией.
2. Выполняет `npm ci`, включая сборку через lifecycle `prepare`.
3. Запускает `npm run typecheck` и `npm test`.
4. Создаёт архив через `npm pack` и проверяет его командой `npm run smoke:package -- <archive.tgz>`: устанавливает архив во временный каталог, запускает упакованный CLI и проверяет MCP `initialize` и `tools/list`.
5. Сохраняет проверенный архив как артефакт текущего запуска.

Только для опубликованного стабильного релиза запускается отдельное задание `publish` с правом `id-token: write`. Оно получает проверенный архив по его ID, проверяет целостность при скачивании и публикует его через `npm publish ... --access public --tag latest --ignore-scripts`. Исходники, зависимости проекта и тесты в этом задании не выполняются. Ручной запуск не получает право публикации.

Smoke-проверка использует фиктивный токен и не вызывает Telegram API. Настоящий `TELEGRAM_BOT_TOKEN` для выпуска не нужен.

Для OIDC в задании задано `id-token: write`. Секрет `NPM_TOKEN` и переменная `NODE_AUTH_TOKEN` для публикации не нужны. npm автоматически создаёт provenance для публичного пакета из публичного репозитория при публикации через GitHub Actions OIDC; см. [документацию npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

## Одноразовая настройка: создание пакета — выполнено

Первоначальная версия [**0.2.1**](https://www.npmjs.com/package/@ekho/telegram-api-mcp/v/0.2.1) опубликована вручную после подтверждённого входа в npm под аккаунтом `ekho`. Это создало пакет, к которому затем был привязан Trusted Publisher. Повторять первоначальную публикацию не нужно: версии `0.2.1` и `0.2.2` уже использованы.

Перед первоначальной публикацией были выполнены `npm ci`, `npm run typecheck`, `npm test`, `npm pack` и `npm run smoke:package` для подготовленного архива. В npm отправлен проверенный архив с публичным доступом. Последующие выпуски выполняет workflow по процедуре [ниже](#последующие-релизы).

Справочно: настройка `npm trust` требует уже существующего пакета, прав на него и включённой двухфакторной аутентификации аккаунта. См. [требования npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/#prerequisites).

## Одноразовая настройка: Trusted Publisher — выполнено

В **Settings → Trusted publishing** пакета на npmjs.com настроен GitHub Actions со следующими значениями. Работа доверия подтверждена успешной OIDC-публикацией `0.2.2` в [запуске 45140379678](https://github.com/ekho/telegram-api-mcp/actions/runs/45140379678).

| Поле | Значение |
| --- | --- |
| Organization or user | `ekho` |
| Repository | `telegram-api-mcp` |
| Workflow filename | `publish.yml` |
| Environment name | Пустое |
| Allow npm publish | Включено |

Имя workflow указывается без `.github/workflows/`. Пустое окружение соответствует текущему workflow, в котором нет GitHub Environment. Право **Allow npm publish** нужно для прямой публикации; одного разрешения на staged publishing недостаточно. Точные поля описаны в [руководстве npm](https://docs.npmjs.com/trusted-publishers/#for-github-actions).

Справочный эквивалент настройки через CLI приведён ниже. Текущая конфигурация уже создана; повторно выполнять эту команду для неё не нужно:

```bash
npm trust github @ekho/telegram-api-mcp \
  --repo ekho/telegram-api-mcp \
  --file publish.yml \
  --allow-publish
```

Команда доступна начиная с npm 11.15.0; npm 11.21.3 подходит. Создание конфигурации требует подтверждения 2FA. Синтаксис приведён в [документации npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

Для новой конфигурации первая успешная публикация должна завершиться **в течение двух дней**; это условие для текущего доверия уже выполнено релизом `0.2.2`. Если когда-либо потребуется пересоздать доверие, тот же срок будет действовать для новой конфигурации. Ручной запуск проверок через `workflow_dispatch` не публикует пакет и не подтверждает настройку OIDC. См. [срок действия новой конфигурации](https://docs.npmjs.com/trusted-publishers/#trusted-publisher-configuration-expiry).

## Последующие релизы

1. Выберите ещё не опубликованную версию. Обновите её в `package.json` и `package-lock.json`, например командой `npm version patch --no-git-tag-version`. Укажите эту же версию в обоих полях `version` файла `server.json`.
2. Закоммитьте и отправьте изменения в `ekho/telegram-api-mcp`.
3. При необходимости запустите **Actions → Publish to npm → Run workflow** для проверки выбранной ветки. Этот запуск не публикует пакет.
4. Создайте GitHub Release на нужном коммите с тегом `v<version>`. Снимите отметку prerelease и опубликуйте релиз.
5. Дождитесь успешного задания **Publish to npm** и проверьте опубликованную версию в [npm](https://www.npmjs.com/package/@ekho/telegram-api-mcp).

Если публикация не прошла, сначала проверьте соответствие тега и всех версий, поля Trusted Publisher и право **Allow npm publish**. Наличие пакета можно проверить командой `npm view @ekho/telegram-api-mcp version`. Успешный `npm whoami` проверяет интерактивный вход, но не подтверждает права OIDC; их подтверждает успешная публикация из workflow.
