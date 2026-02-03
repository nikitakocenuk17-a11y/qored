# Qored Auth — проверка email без двойной отправки OTP

## Что исправлено
- На `register.html` и `login.html` сначала идёт **проверка существования email**, и только потом (если нужно) отправляется OTP.
- Проверка **не отправляет OTP**, поэтому вы не ловите «подождите N секунд для повторной отправки».

## Как это работает
Фронт вызывает Edge Function `check-email`, а она (с Service Role ключом) проверяет наличие пользователя по email.

## Деплой Edge Function (Supabase CLI)
1) Установи Supabase CLI и залогинься.
2) В корне проекта:
   - `supabase init` (если папки `supabase/` ещё нет)
   - `supabase functions deploy check-email`
3) Добавь секрет:
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`

Service Role key берётся в Supabase Dashboard → Project Settings → API Keys.

## Важно
Если у тебя очень много пользователей, поиск по `listUsers` может быть медленным.
Тогда лучше сделать более оптимальную проверку через сервер/SQL-функцию — скажи, и я дам улучшенный вариант.
