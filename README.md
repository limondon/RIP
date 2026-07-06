# ПАМЯТЬ CRM

Локальная CRM для мастерской по изготовлению и установке памятников.

## Стек

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- localStorage для demo-данных

## Локальный запуск

```bash
npm install
npm run dev
```

## Проверки

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Публикация на Vercel

1. Убедитесь, что проект запушен в GitHub-репозиторий `limondon/RIP`.
2. В Vercel выберите `Add New Project`.
3. Импортируйте GitHub-репозиторий `limondon/RIP`.
4. Framework Preset: `Next.js`.
5. Install Command: `npm ci`.
6. Build Command: `npm run build`.
7. Environment Variables: для текущей версии не нужны.
8. Нажмите `Deploy`.

Важно: сейчас данные CRM хранятся в браузерном `localStorage`, поэтому на Vercel это будет demo-режим без общей базы между пользователями.
