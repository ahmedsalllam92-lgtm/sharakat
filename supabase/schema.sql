-- =====================================================================
-- منظومة الشراكات — قاعدة البيانات المشتركة على Supabase
-- يُشغَّل مرة واحدة من SQL Editor (ويمكن إعادة تشغيله بأمان).
--
-- مبدأ الحماية:
--   • الجداول كلها مغلقة (RLS مفعّل بلا سياسات + سحب كل الصلاحيات)،
--     فالمفتاح العام (publishable) لا يقرأ ولا يكتب أي جدول مباشرة.
--   • كل الوصول عبر دوال محددة (SECURITY DEFINER) تتحقق من رمز الجلسة.
--   • كلمات المرور تُحفظ بصمات bcrypt فقط، ورموز الجلسات تُحفظ بصمات SHA-256.
--   • كلمة مرور «مدير النظام» لا تغيّرها أي دالة.
--   • قفل مؤقت للحساب بعد 5 محاولات دخول خاطئة.
-- كلمات المرور الأولية تُضاف من ملف منفصل لا يُرفع إلى المستودع.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create sequence if not exists public.shk_rev_seq;

-- السجلات: كل عنصر من بيانات المنصة صف واحد (الإعدادات، الجهات، الشراكات، المقترحات…)
create table if not exists public.shk_records (
  col        text   not null,
  id         text   not null,
  data       jsonb,
  deleted    boolean not null default false,
  rev        bigint not null default nextval('public.shk_rev_seq'),
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (col, id)
);
create index if not exists shk_records_rev on public.shk_records (rev);

-- المرفقات والصور (base64)
create table if not exists public.shk_files (
  id         text primary key,
  meta       jsonb not null default '{}'::jsonb,
  data       text  not null,
  created_at timestamptz not null default now(),
  created_by text
);

-- كلمات المرور المخصّصة لكل حساب (الحساب بلا صف يستخدم كلمة مجموعته الافتراضية)
create table if not exists public.shk_accounts (
  id         text primary key,
  pw_hash    text not null,
  updated_at timestamptz not null default now()
);
-- كلمة المرور الافتراضية لكل مجموعة: admin / team / dept / viewer
create table if not exists public.shk_defaults (
  grp     text primary key,
  pw_hash text not null
);
create table if not exists public.shk_sessions (
  token_hash text primary key,
  account_id text not null,
  grp        text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create table if not exists public.shk_login_fails (
  account_id   text primary key,
  fails        int not null default 0,
  locked_until timestamptz
);

-- إغلاق الجداول أمام المفتاح العام
do $$ declare t text; begin
  foreach t in array array['shk_records','shk_files','shk_accounts','shk_defaults','shk_sessions','shk_login_fails'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end $$;
revoke all on sequence public.shk_rev_seq from public, anon, authenticated;

-- ===== دوال داخلية =====
-- مجموعة الحساب تُستنتج من معرّفه، فلا يستطيع أحد ادعاء مجموعة أعلى
create or replace function public.shk_grp(p_id text) returns text
language sql immutable set search_path = public as $$
  select case
    when p_id = 'sysadmin' then 'sys'
    when p_id = 'admin' then 'admin'
    when p_id = 'viewer' then 'viewer'
    when p_id like 'team:_%' then 'team'
    when p_id like 'dept:_%' then 'dept'
  end
$$;

create or replace function public.shk_hash_token(p_token text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
$$;

-- يتحقق من الرمز ويعيد الحساب ومجموعته
create or replace function public.shk_auth(p_token text, out account_id text, out grp text)
language plpgsql security definer set search_path = public, extensions as $$
begin
  select s.account_id, s.grp into account_id, grp
    from shk_sessions s where s.token_hash = shk_hash_token(p_token) and s.expires_at > now();
  if account_id is null then raise exception 'invalid_token' using errcode = 'P0001'; end if;
end $$;

-- هل كلمة المرور صحيحة لهذا الحساب؟
create or replace function public.shk_check_pw(p_id text, p_pw text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare h text; g text := shk_grp(p_id);
begin
  if g is null or p_pw is null then return false; end if;
  select pw_hash into h from shk_accounts where id = p_id;
  if h is null and g <> 'sys' then select pw_hash into h from shk_defaults where shk_defaults.grp = g; end if;
  return h is not null and extensions.crypt(p_pw, h) = h;
end $$;

-- هل الحساب موجود فعلًا في إعدادات المنصة؟ (الإدارات وأعضاء الفريق)
create or replace function public.shk_account_known(p_id text) returns boolean
language plpgsql security definer set search_path = public as $$
declare g text := shk_grp(p_id); s jsonb;
begin
  if g in ('sys', 'admin', 'viewer') then return true; end if;
  select data into s from shk_records where col = 'settings' and id = 'main' and not deleted;
  if s is null then return false; end if;
  if g = 'team' then return coalesce(s->'lists'->'team', '[]'::jsonb) ? substr(p_id, 6); end if;
  if g = 'dept' then return coalesce(s->'lists'->'departments', '[]'::jsonb) ? substr(p_id, 6); end if;
  return false;
end $$;

-- ===== دوال الواجهة (يستدعيها المفتاح العام) =====
-- أسماء الإدارات وأعضاء الفريق لقائمة الحسابات في شاشة الدخول فقط
create or replace function public.shk_public() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce((
    select jsonb_build_object(
      'org', data->'org',
      'lists', jsonb_build_object('team', data->'lists'->'team', 'departments', data->'lists'->'departments'),
      'wfDepts', data->'wfDepts')
    from shk_records where col = 'settings' and id = 'main' and not deleted), '{}'::jsonb)
    || jsonb_build_object('empty', not exists (select 1 from shk_records where col = 'settings' and id = 'main' and not deleted))
$$;

create or replace function public.shk_login(p_id text, p_pw text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare g text := shk_grp(p_id); f record; tk text;
begin
  -- الأخطاء تُعاد نتيجةً لا استثناءً، حتى يُحفظ عدّاد المحاولات الخاطئة ولا يُلغى مع المعاملة
  if g is null then return jsonb_build_object('error', 'bad_login'); end if;
  delete from shk_sessions where expires_at < now();
  select * into f from shk_login_fails where account_id = p_id;
  if f.locked_until is not null and f.locked_until > now() then
    return jsonb_build_object('error', 'locked', 'wait', ceil(extract(epoch from (f.locked_until - now())))::int);
  end if;
  if not shk_account_known(p_id) or not shk_check_pw(p_id, p_pw) then
    insert into shk_login_fails as lf (account_id, fails) values (p_id, 1)
      on conflict (account_id) do update set fails = case when lf.locked_until is not null and lf.locked_until <= now() then 1 else lf.fails + 1 end,
        locked_until = case when lf.fails + 1 >= 5 then now() + interval '5 minutes' else null end;
    return jsonb_build_object('error', 'bad_login');
  end if;
  delete from shk_login_fails where account_id = p_id;
  tk := encode(extensions.gen_random_bytes(32), 'hex');
  insert into shk_sessions (token_hash, account_id, grp, expires_at) values (shk_hash_token(tk), p_id, g, now() + interval '30 days');
  return jsonb_build_object('token', tk, 'id', p_id, 'grp', g);
end $$;

create or replace function public.shk_logout(p_token text) returns void
language sql security definer set search_path = public as $$
  delete from shk_sessions where token_hash = shk_hash_token(p_token)
$$;

-- تغيير كلمة مرور: صاحب الحساب (بكلمته الحالية) أو إدارة الشراكات/مدير النظام لغيرهما.
-- p_new = null يعيد الحساب إلى كلمة مجموعته الافتراضية. حساب مدير النظام مستثنى دائمًا.
create or replace function public.shk_set_password(p_token text, p_target text, p_new text, p_old text default null) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if p_target = 'sysadmin' or shk_grp(p_target) is null then raise exception 'protected' using errcode = 'P0001'; end if;
  if p_target = me.account_id then
    if not shk_check_pw(p_target, p_old) then raise exception 'bad_old' using errcode = 'P0001'; end if;
  elsif me.grp not in ('sys', 'admin') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_new is null then
    delete from shk_accounts where id = p_target;
  else
    if length(p_new) < 4 then raise exception 'short' using errcode = 'P0001'; end if;
    insert into shk_accounts (id, pw_hash) values (p_target, extensions.crypt(p_new, extensions.gen_salt('bf', 10)))
      on conflict (id) do update set pw_hash = excluded.pw_hash, updated_at = now();
  end if;
  -- إنهاء جلسات الحساب الأخرى بعد تغيير كلمته
  delete from shk_sessions where account_id = p_target and token_hash <> shk_hash_token(p_token);
end $$;

-- الحسابات التي لها كلمة مرور مخصّصة (لإدارة الحسابات فقط)
create or replace function public.shk_pw_status(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(id) from shk_accounts where id <> 'sysadmin'), '[]'::jsonb);
end $$;

-- سحب كل ما تغيّر بعد رقم مراجعة معيّن
create or replace function public.shk_pull(p_token text, p_since bigint default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  return jsonb_build_object(
    'me', me.account_id,
    'rev', (select coalesce(max(rev), 0) from shk_records),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('col', col, 'id', id, 'data', case when deleted then null else data end, 'deleted', deleted, 'rev', rev) order by rev)
                       from shk_records where rev > coalesce(p_since, 0)), '[]'::jsonb));
end $$;

-- رفع التعديلات. الإعدادات تُرفع مع رقم المراجعة التي بُنيت عليها، فإن سبقها تعديل آخر تُعاد للدمج.
create or replace function public.shk_push(p_token text, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record; r jsonb; cur bigint; nr bigint; revs jsonb := '[]'::jsonb; conflicts jsonb := '[]'::jsonb;
begin
  select * into me from shk_auth(p_token);
  if me.grp = 'viewer' then raise exception 'forbidden' using errcode = 'P0001'; end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if (r->>'col') not in ('settings', 'partners', 'partnerships', 'proposals', 'achievements', 'news', 'audit') or coalesce(r->>'id', '') = '' then
      raise exception 'bad_row' using errcode = 'P0001';
    end if;
    if r->>'col' = 'settings' and r ? 'base' then
      select rev into cur from shk_records where col = 'settings' and id = r->>'id' for update;
      if cur is not null and cur > coalesce((r->>'base')::bigint, 0) then
        conflicts := conflicts || jsonb_build_object('col', 'settings', 'id', r->>'id');
        continue;
      end if;
    end if;
    nr := nextval('shk_rev_seq');
    insert into shk_records (col, id, data, deleted, rev, updated_at, updated_by)
      values (r->>'col', r->>'id', case when coalesce((r->>'deleted')::boolean, false) then null else r->'data' end,
              coalesce((r->>'deleted')::boolean, false), nr, now(), me.account_id)
      on conflict (col, id) do update set data = excluded.data, deleted = excluded.deleted, rev = excluded.rev,
              updated_at = excluded.updated_at, updated_by = excluded.updated_by;
    revs := revs || jsonb_build_object('col', r->>'col', 'id', r->>'id', 'rev', nr);
  end loop;
  return jsonb_build_object('revs', revs, 'conflicts', conflicts);
end $$;

create or replace function public.shk_file_put(p_token text, p_id text, p_meta jsonb, p_data text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp = 'viewer' then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if coalesce(p_id, '') = '' or p_data is null or length(p_data) > 22000000 then raise exception 'bad_file' using errcode = 'P0001'; end if;
  insert into shk_files (id, meta, data, created_by) values (p_id, coalesce(p_meta, '{}'::jsonb), p_data, me.account_id)
    on conflict (id) do update set meta = excluded.meta, data = excluded.data;
end $$;

create or replace function public.shk_file_get(p_token text, p_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record; f record;
begin
  select * into me from shk_auth(p_token);
  select * into f from shk_files where id = p_id;
  if f.id is null then return null; end if;
  return jsonb_build_object('id', f.id, 'meta', f.meta, 'data', f.data);
end $$;

-- أي المرفقات موجودة على الخادم (لرفع الناقص فقط)
create or replace function public.shk_file_ids(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  return coalesce((select jsonb_agg(id) from shk_files), '[]'::jsonb);
end $$;

-- الصلاحيات: الدوال الداخلية مغلقة، ودوال الواجهة متاحة للمفتاح العام
revoke execute on function public.shk_grp(text), public.shk_hash_token(text), public.shk_auth(text), public.shk_check_pw(text, text), public.shk_account_known(text) from public, anon, authenticated;
revoke execute on function public.shk_public(), public.shk_login(text, text), public.shk_logout(text), public.shk_set_password(text, text, text, text), public.shk_pw_status(text), public.shk_pull(text, bigint), public.shk_push(text, jsonb), public.shk_file_put(text, text, jsonb, text), public.shk_file_get(text, text), public.shk_file_ids(text) from public;
grant execute on function public.shk_public(), public.shk_login(text, text), public.shk_logout(text), public.shk_set_password(text, text, text, text), public.shk_pw_status(text), public.shk_pull(text, bigint), public.shk_push(text, jsonb), public.shk_file_put(text, text, jsonb, text), public.shk_file_get(text, text), public.shk_file_ids(text) to anon, authenticated;
