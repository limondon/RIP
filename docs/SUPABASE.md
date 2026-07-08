# Supabase для ПАМЯТЬ CRM

Этот слой добавлен как безопасная подготовка. Текущая CRM продолжает работать на `localStorage`, пока Supabase не настроен и не включен в рабочих разделах.

## Что уже есть

- `@supabase/supabase-js` и `@supabase/ssr`.
- Безопасные клиенты в `src/lib/supabase`.
- SQL-схема в `supabase/schema.sql`.
- RLS включен на всех таблицах.
- Политики разрешают доступ только аутентифицированным активным сотрудникам.

## Переменные

В `.env.local` нужны только публичные ключи:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Legacy-вариант тоже поддержан:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Нельзя добавлять `service_role` или `sb_secret_*` в `NEXT_PUBLIC_*`, `.env.example` или клиентский код.

## Как включать дальше

1. Создать Supabase project.
2. Выполнить `supabase/schema.sql` в SQL Editor.
3. Создать сотрудников через Supabase Auth.
4. Добавить строки этих сотрудников в `staff_profiles`.
5. После этого постепенно переводить разделы CRM с `localStorage` на Supabase.

До шага 5 текущий сайт остается рабочим без базы.
