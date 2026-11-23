# Публикация @ekho/telegram-api-mcp

Пакет этого форка — `@ekho/telegram-api-mcp`, репозиторий — [ekho/telegram-api-mcp](https://github.com/ekho/telegram-api-mcp). Имя исполняемой команды остаётся `telegram-api-mcp`. Исходный проект и автор: [timoncool/telegram-api-mcp](https://github.com/timoncool/telegram-api-mcp), лицензия MIT.

[Workflow публикации](../.github/workflows/publish.yml) подготовлен для GitHub Actions и npm Trusted Publishing через OIDC. Само наличие workflow не создаёт пакет в npm: перед первой автоматической публикацией нужно войти в npm, создать пакет и настроить доверие. Эти действия ещё не подразумеваются выполненными.

## Как работает workflow

| Событие | Результат |
| --- | --- |
| Опубликован обычный GitHub Release с тегом `v<version>` | Проверки и публикация в npm с тегом `latest` |
| Ручной запуск `workflow_dispatch` | Только проверки, без публикации |
| GitHub prerelease | Задание пропускается |
| Запуск в репозитории, отличном от `ekho/telegram-api-mcp` | Задание пропускается |

Один push коммита или тега публикацию не запускает: нужен опубликованный GitHub Release. Версия должна быть стабильной, например `0.2.2`, а тег — в точности `v0.2.2`.

Workflow использует GitHub-hosted runners, Node.js 24 и npm **11.21.3**. Задание `validate` имеет только право чтения репозитория. Перед публикацией оно:

1. Сверяет имя пакета, публичный доступ, URL репозитория и версии в `package.json`, `package-lock.json` и `server.json`. Для релиза также проверяет совпадение тега с версией.
2. Выполняет `npm ci`, включая сборку через lifecycle `prepare`.
3. Запускает `npm run typecheck` и `npm test`.
4. Создаёт архив через `npm pack` и проверяет его командой `npm run smoke:package -- <archive.tgz>`: устанавливает архив во временный каталог, запускает упакованный CLI и проверяет MCP `initialize` и `tools/list`.
5. Сохраняет проверенный архив как артефакт текущего запуска.

Только для опубликованного стабильного релиза запускается отдельное задание `publish` с правом `id-token: write`. Оно получает проверенный архив по его ID, проверяет целостность при скачивании и публикует его через `npm publish ... --access public --tag latest --ignore-scripts`. Исходники, зависимости проекта и тесты в этом задании не выполняются. Ручной запуск не получает право публикации.

Smoke-проверка использует фиктивный токен и не вызывает Telegram API. Настоящий `TELEGRAM_BOT_TOKEN` для выпуска не нужен.

Для OIDC в задании задано `id-token: write`. Секрет `NPM_TOKEN` и переменная `NODE_AUTH_TOKEN` для публикации не нужны. npm автоматически создаёт provenance для публичного пакета из публичного репозитория при публикации через GitHub Actions OIDC; см. [документацию npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/).

## Первый запуск: создать пакет в npm

Самый прямой путь — один раз опубликовать подготовленную версию **0.2.1** вручную, затем выпускать следующие версии через GitHub Actions. Настроить `npm trust` можно только для уже существующего пакета; нужны права на него и включённая двухфакторная аутентификация аккаунта. См. [требования npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/#prerequisites).

В локальном checkout подготовленного форка используйте Node.js 24 и npm 11.21.3. Сначала проверьте пакет:

```bash
npm ci
npm run typecheck
npm test
npm pack
npm run smoke:package -- ./ekho-telegram-api-mcp-0.2.1.tgz
```

Затем войдите в npm под аккаунтом с правом публикации в scope `@ekho`, пройдите интерактивную проверку и опубликуйте проверенный архив:

```bash
npm login --auth-type=web
npm whoami
npm publish ./ekho-telegram-api-mcp-0.2.1.tgz --access public
```

Если версия в checkout уже другая, используйте имя архива, которое вывел `npm pack`. Не публикуйте повторно существующую версию.

После ручной публикации `0.2.1` следующий автоматический релиз должен иметь **новую версию**, например `0.2.2`. GitHub Release `v0.2.1` после ручной публикации запустит попытку повторной публикации и завершится ошибкой npm.

## Настроить npm Trusted Publisher

После создания пакета откройте его **Settings → Trusted publishing** на npmjs.com, выберите GitHub Actions и задайте:

| Поле | Значение |
| --- | --- |
| Organization or user | `ekho` |
| Repository | `telegram-api-mcp` |
| Workflow filename | `publish.yml` |
| Environment name | Оставить пустым |
| Allow npm publish | Включить |

Имя workflow указывается без `.github/workflows/`. Пустое окружение соответствует текущему workflow, в котором нет GitHub Environment. Право **Allow npm publish** нужно для прямой публикации; одного разрешения на staged publishing недостаточно. Точные поля описаны в [руководстве npm](https://docs.npmjs.com/trusted-publishers/#for-github-actions).

Альтернатива веб-форме — после входа в npm выполнить:

```bash
npm trust github @ekho/telegram-api-mcp \
  --repo ekho/telegram-api-mcp \
  --file publish.yml \
  --allow-publish
```

Команда доступна начиная с npm 11.15.0; npm 11.21.3 подходит. Подтвердите запрос 2FA. Синтаксис приведён в [документации npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

Создавайте доверие, когда готовы выпустить следующую версию: новая конфигурация должна завершить **первую успешную публикацию в течение двух дней**. Иначе её нужно удалить и создать заново. Ручной запуск проверок через `workflow_dispatch` не публикует пакет и не подтверждает настройку OIDC. См. [срок действия новой конфигурации](https://docs.npmjs.com/trusted-publishers/#trusted-publisher-configuration-expiry).

## Последующие релизы

1. Обновите версию в `package.json` и `package-lock.json`, например командой `npm version patch --no-git-tag-version`. Укажите эту же версию в обоих полях `version` файла `server.json`.
2. Закоммитьте и отправьте изменения в `ekho/telegram-api-mcp`.
3. При необходимости запустите **Actions → Publish to npm → Run workflow** для проверки выбранной ветки. Этот запуск не публикует пакет.
4. Создайте GitHub Release на нужном коммите с тегом `v<version>`. Снимите отметку prerelease и опубликуйте релиз.
5. Дождитесь успешного задания **Publish to npm** и проверьте опубликованную версию в [npm](https://www.npmjs.com/package/@ekho/telegram-api-mcp).

Если публикация не прошла, сначала проверьте соответствие тега и всех версий, поля Trusted Publisher и право **Allow npm publish**. Наличие пакета можно проверить командой `npm view @ekho/telegram-api-mcp version`. Успешный `npm whoami` проверяет интерактивный вход, но не подтверждает права OIDC; их подтверждает успешная публикация из workflow.
