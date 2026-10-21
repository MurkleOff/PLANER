/**
 * Supabase REST Cloud Sync Service
 * Works seamlessly using standard Supabase PostgREST API without bloated SDK dependencies.
 */

export const SUPABASE_SQL_SETUP = `-- 1. Создание таблицы синхронизации
create table if not exists public.panel_sync (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Включение Row Level Security и публичный доступ по anon key
alter table public.panel_sync enable row level security;

drop policy if exists "Доступ к синхронизации" on public.panel_sync;
create policy "Доступ к синхронизации"
  on public.panel_sync
  for all
  using (true)
  with check (true);
`;

function normalizeUrl(url) {
  if (!url) return '';
  let clean = url.trim();
  if (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Test Supabase connection and table presence
 */
export async function testSupabaseConnection(config) {
  const { supabaseUrl, supabaseAnonKey, syncId } = config;

  if (!supabaseUrl || !supabaseAnonKey || !syncId) {
    return { ok: false, message: 'Заполните все три поля (URL, Anon Key и Sync ID).' };
  }

  const baseUrl = normalizeUrl(supabaseUrl);
  const endpoint = `${baseUrl}/rest/v1/panel_sync?id=eq.${encodeURIComponent(syncId)}&select=id,updated_at`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey.trim(),
        'Authorization': `Bearer ${supabaseAnonKey.trim()}`,
      },
    });

    if (res.status === 404 || res.status === 400) {
      const errText = await res.text();
      if (errText.includes('42P01') || errText.includes('does not exist')) {
        return {
          ok: false,
          message: 'Таблица "panel_sync" ещё не создана в Supabase. Скопируйте SQL-скрипт ниже и выполните в SQL Editor.',
        };
      }
      return { ok: false, message: `Ошибка Supabase (${res.status}): ${errText}` };
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: 'Ошибка авторизации: проверьте правильность SUPABASE_ANON_KEY.' };
    }

    if (res.ok) {
      return { ok: true, message: 'Подключение успешно! Таблица найдена и готова к синхронизации.' };
    }

    return { ok: false, message: `Ошибка сервера Supabase: HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, message: `Сетевая ошибка: ${e.message}. Проверьте SUPABASE_URL.` };
  }
}

/**
 * Push full state snapshot to Supabase
 */
export async function pushToSupabase(config, payload) {
  const { supabaseUrl, supabaseAnonKey, syncId } = config;
  const baseUrl = normalizeUrl(supabaseUrl);
  const endpoint = `${baseUrl}/rest/v1/panel_sync`;

  const nowIso = new Date().toISOString();
  const body = [
    {
      id: syncId.trim(),
      payload,
      updated_at: nowIso,
    },
  ];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey.trim(),
      'Authorization': `Bearer ${supabaseAnonKey.trim()}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка сохранения в облако (${res.status}): ${text}`);
  }

  return { ok: true, updatedAt: nowIso };
}

/**
 * Pull state snapshot from Supabase
 */
export async function pullFromSupabase(config) {
  const { supabaseUrl, supabaseAnonKey, syncId } = config;
  const baseUrl = normalizeUrl(supabaseUrl);
  const endpoint = `${baseUrl}/rest/v1/panel_sync?id=eq.${encodeURIComponent(syncId.trim())}&select=*`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey.trim(),
      'Authorization': `Bearer ${supabaseAnonKey.trim()}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки из облака (${res.status}): ${text}`);
  }

  const rows = await res.json();
  if (rows && rows.length > 0) {
    return {
      found: true,
      payload: rows[0].payload,
      updatedAt: rows[0].updated_at,
    };
  }

  return { found: false, payload: null, updatedAt: null };
}
