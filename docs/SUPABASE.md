# Supabase для ПАМЯТЬ CRM

Supabase является общей рабочей базой CRM. `localStorage` используется как локальный кеш и как fallback для локальной разработки без настроенного Supabase.

## Что уже есть

- `@supabase/supabase-js` и `@supabase/ssr`.
- Безопасные клиенты в `src/lib/supabase`.
- SQL-схема в `supabase/schema.sql`.
- Транзакционные функции платежей и склада в `supabase/transactional-payments-inventory.sql`.
- RLS включен на всех таблицах.
- Политики разрешают доступ только аутентифицированным активным сотрудникам.
- Критические таблицы платежей и склада изменяются только серверными функциями.
- `staff_action_log` хранит сотрудника, время, действие и состояния до/после.

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

Транзакционные платежи и склад работают от сессии сотрудника и не требуют `service_role`.

Только для отдельной админ-панели создания сотрудников нужен серверный ключ:

```bash
SUPABASE_SERVICE_ROLE_KEY=
STAFF_ADMIN_SETUP_TOKEN=
```

Они используются только в `/api/staff` на сервере. Не добавляйте к ним `NEXT_PUBLIC_`.
`STAFF_ADMIN_SETUP_TOKEN` вводится в CRM как код администратора при создании сотрудника.

## Порядок настройки нового проекта

1. Создать Supabase project.
2. Выполнить `supabase/schema.sql` в SQL Editor.
3. Выполнить целиком `supabase/transactional-payments-inventory.sql` в SQL Editor.
4. Создать сотрудников через Supabase Auth.
5. Добавить строки этих сотрудников в `staff_profiles`.

Для существующего проекта достаточно выполнить только шаг 3. Файл идемпотентен: его можно безопасно выполнить повторно. После миграции платежи, полная оплата, возвраты, поступления, резервы, списания и снятие резервов проходят атомарно в PostgreSQL.

Не вставляйте ключи в SQL Editor и не запускайте миграцию через браузерный клиент CRM.
