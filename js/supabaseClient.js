// /js/supabaseClient.js
// Этот файл создаёт Supabase client и кладёт его в window.sb
// (чтобы остальные скрипты могли работать без import/export)

(function () {
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase SDK не загрузился. Проверь подключение @supabase/supabase-js.");
    return;
  }

  if (!window.SUPABASE_URL && typeof SUPABASE_URL === "undefined") {
    console.error("SUPABASE_URL не найден. Проверь js/config.js");
    return;
  }

  try {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (e) {
    console.error("Не удалось создать Supabase client:", e);
  }
})();
