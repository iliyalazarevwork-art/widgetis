# Модулі Widget Builder

## Документація по платформах

- [Horoshop AjaxCart API](module-one-plus-one/docs/horoshop-ajax-cart.md) — кошик, події, AJAX-ендпоінти

## Як додати новий модуль

1. Створіть папку `modules/module-{name}/`
2. Додайте файли:
   - `package.json` — `@laxarevii/module-{name}`, dep: `@laxarevii/core workspace:*`
   - `schema.ts` — Zod-схема конфігурації, експортує тип `{Name}Config`
   - `index.ts` — `export default function {name}(config): void`
3. Додайте per-site конфіг у `sites/{site}/modules/module-{name}/config.ts` та `i18n.ts`
4. Запустіть `pnpm install` для лінкування workspace-пакета
