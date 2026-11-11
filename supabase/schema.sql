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

-- ===== الملفات الكبيرة (حتى 50 ميجا): تُرفع على أجزاء ثم تُسجَّل بياناتها الوصفية =====
create table if not exists public.shk_file_chunks (
  id   text not null,
  n    int  not null,
  data text not null,
  primary key (id, n)
);
alter table public.shk_file_chunks enable row level security;
revoke all on table public.shk_file_chunks from public, anon, authenticated;

create or replace function public.shk_file_chunk_put(p_token text, p_id text, p_n int, p_data text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp = 'viewer' then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if coalesce(p_id, '') = '' or p_n is null or p_n < 0 or p_n > 40 or p_data is null or length(p_data) > 6000000 then raise exception 'bad_file' using errcode = 'P0001'; end if;
  insert into shk_file_chunks (id, n, data) values (p_id, p_n, p_data)
    on conflict (id, n) do update set data = excluded.data;
end $$;

create or replace function public.shk_file_chunk_get(p_token text, p_id text, p_n int) returns text
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  return (select data from shk_file_chunks where id = p_id and n = p_n);
end $$;

-- حذف مرفق لم يعد مستخدمًا (لتوفير المساحة)
create or replace function public.shk_file_del(p_token text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp = 'viewer' then raise exception 'forbidden' using errcode = 'P0001'; end if;
  delete from shk_files where id = p_id;
  delete from shk_file_chunks where id = p_id;
end $$;

-- المساحة المستخدمة (لعرضها في الإعدادات)
create or replace function public.shk_usage(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  return jsonb_build_object('db', pg_database_size(current_database()), 'files', (select count(*) from shk_files));
end $$;

-- الصلاحيات: الدوال الداخلية مغلقة، ودوال الواجهة متاحة للمفتاح العام
revoke execute on function public.shk_grp(text), public.shk_hash_token(text), public.shk_auth(text), public.shk_check_pw(text, text), public.shk_account_known(text) from public, anon, authenticated;
revoke execute on function public.shk_public(), public.shk_login(text, text), public.shk_logout(text), public.shk_set_password(text, text, text, text), public.shk_pw_status(text), public.shk_pull(text, bigint), public.shk_push(text, jsonb), public.shk_file_put(text, text, jsonb, text), public.shk_file_get(text, text), public.shk_file_ids(text), public.shk_file_chunk_put(text, text, int, text), public.shk_file_chunk_get(text, text, int), public.shk_file_del(text, text), public.shk_usage(text) from public;
grant execute on function public.shk_public(), public.shk_login(text, text), public.shk_logout(text), public.shk_set_password(text, text, text, text), public.shk_pw_status(text), public.shk_pull(text, bigint), public.shk_push(text, jsonb), public.shk_file_put(text, text, jsonb, text), public.shk_file_get(text, text), public.shk_file_ids(text), public.shk_file_chunk_put(text, text, int, text), public.shk_file_chunk_get(text, text, int), public.shk_file_del(text, text), public.shk_usage(text) to anon, authenticated;

-- ===== روابط الاطلاع المؤقتة (تُشغَّل مرة واحدة في Supabase ← SQL Editor؛ آمنة للتكرار) =====
-- رابط بلا كلمة مرور لمدة محددة: يفتح جلسة «اطلاع» للقراءة فقط (لا رفع ولا تعديل ولا ملفات)،
-- ويُحفظ على الخادم بصمته فقط (لا يُخزَّن الرابط نفسه)، ويمكن إيقافه في أي وقت فتنتهي جلساته فورًا.
create table if not exists public.shk_shares (
  id         text primary key,
  token_hash text unique not null,
  label      text not null default '',
  sections   jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked    boolean not null default false,
  opens      int not null default 0,
  last_open  timestamptz
);
alter table public.shk_shares enable row level security;
revoke all on table public.shk_shares from public, anon, authenticated;

-- إنشاء رابط: إدارة الشراكات ومدير النظام فقط، وأقصى مدة 90 يومًا
drop function if exists public.shk_share_create(text, text, jsonb, timestamptz);
create or replace function public.shk_share_create(p_token text, p_label text, p_sections jsonb, p_expires_at text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare me record; tk text; sid text; p_expires timestamptz := p_expires_at::timestamptz;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_expires is null or p_expires <= now() or p_expires > now() + interval '90 days' then raise exception 'bad_expiry' using errcode = 'P0001'; end if;
  if jsonb_typeof(coalesce(p_sections, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_sections, '[]'::jsonb)) = 0 then raise exception 'bad_sections' using errcode = 'P0001'; end if;
  tk := encode(extensions.gen_random_bytes(24), 'hex');
  sid := encode(extensions.gen_random_bytes(6), 'hex');
  insert into shk_shares (id, token_hash, label, sections, created_by, expires_at)
    values (sid, shk_hash_token(tk), left(coalesce(p_label, ''), 120), p_sections, me.account_id, p_expires);
  return jsonb_build_object('id', sid, 'token', tk);
end $$;

create or replace function public.shk_share_list(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'label', label, 'sections', sections, 'by', created_by, 'at', created_at,
      'expires', expires_at, 'revoked', revoked, 'opens', opens, 'last', last_open) order by created_at desc) from shk_shares), '[]'::jsonb);
end $$;

-- إيقاف رابط: تنتهي كل جلساته فورًا
create or replace function public.shk_share_revoke(p_token text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update shk_shares set revoked = true where id = p_id;
  delete from shk_sessions where account_id = 'share:' || p_id;
end $$;

-- فتح الرابط (بلا تسجيل دخول): جلسة اطلاع تنتهي مع الرابط أو بعد 12 ساعة أيهما أقرب
create or replace function public.shk_share_open(p_share text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s record; tk text;
begin
  select * into s from shk_shares where token_hash = shk_hash_token(p_share);
  if s.id is null then return jsonb_build_object('error', 'invalid'); end if;
  if s.revoked then return jsonb_build_object('error', 'revoked'); end if;
  if s.expires_at <= now() then return jsonb_build_object('error', 'expired'); end if;
  delete from shk_sessions where expires_at < now();
  tk := encode(extensions.gen_random_bytes(32), 'hex');
  insert into shk_sessions (token_hash, account_id, grp, expires_at)
    values (shk_hash_token(tk), 'share:' || s.id, 'viewer', least(s.expires_at, now() + interval '12 hours'));
  update shk_shares set opens = opens + 1, last_open = now() where id = s.id;
  return jsonb_build_object('token', tk, 'grp', 'viewer', 'label', s.label, 'sections', s.sections, 'expires', s.expires_at);
end $$;

grant execute on function public.shk_share_create(text, text, jsonb, text), public.shk_share_list(text), public.shk_share_revoke(text, text), public.shk_share_open(text) to anon, authenticated;

-- ===== مقترحات الجهات الخارجية (تُشغَّل مرة واحدة في Supabase ← SQL Editor؛ آمنة للتكرار) =====
-- رابط دعوة بلا كلمة مرور تفتح به جهة خارجية نموذج «اقتراح شراكة»، فيصل المقترح إلى «المقترحات الواردة»،
-- وتحصل الجهة على رابط متابعة ترى منه الحالة والرد فقط. يُحفظ على الخادم بصمة الروابط لا الروابط نفسها.
create table if not exists public.shk_invites (
  id         text primary key,
  token_hash text unique not null,
  label      text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses   int not null default 1,
  uses       int not null default 0,
  revoked    boolean not null default false
);
create table if not exists public.shk_ext_tracks (
  track_hash  text primary key,
  proposal_id text not null,
  created_at  timestamptz not null default now()
);
alter table public.shk_invites enable row level security;
alter table public.shk_ext_tracks enable row level security;
revoke all on table public.shk_invites, public.shk_ext_tracks from public, anon, authenticated;

drop function if exists public.shk_invite_create(text, text, text, int);
create or replace function public.shk_invite_create(p_token text, p_label text, p_expires_at text, p_uses int) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare me record; tk text; iid text; ex timestamptz := p_expires_at::timestamptz;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if ex is null or ex <= now() or ex > now() + interval '180 days' then raise exception 'bad_expiry' using errcode = 'P0001'; end if;
  tk := encode(extensions.gen_random_bytes(24), 'hex');
  iid := encode(extensions.gen_random_bytes(6), 'hex');
  insert into shk_invites (id, token_hash, label, created_by, expires_at, max_uses)
    values (iid, shk_hash_token(tk), left(coalesce(p_label, ''), 120), me.account_id, ex, greatest(1, least(coalesce(p_uses, 1), 50)));
  return jsonb_build_object('id', iid, 'token', tk);
end $$;

create or replace function public.shk_invite_list(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'label', label, 'by', created_by, 'at', created_at, 'expires', expires_at,
      'max', max_uses, 'uses', uses, 'revoked', revoked) order by created_at desc) from shk_invites), '[]'::jsonb);
end $$;

create or replace function public.shk_invite_revoke(p_token text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update shk_invites set revoked = true where id = p_id;
end $$;

-- فتح رابط الدعوة (بلا تسجيل دخول): اسم المؤسسة واسم الدعوة فقط
create or replace function public.shk_invite_check(p_invite text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare i record; org jsonb;
begin
  select * into i from shk_invites where token_hash = shk_hash_token(p_invite);
  if i.id is null then return jsonb_build_object('error', 'invalid'); end if;
  if i.revoked then return jsonb_build_object('error', 'revoked'); end if;
  if i.expires_at <= now() then return jsonb_build_object('error', 'expired'); end if;
  if i.uses >= i.max_uses then return jsonb_build_object('error', 'used'); end if;
  select data->'org' into org from shk_records where col = 'settings' and id = 'main' and not deleted;
  return jsonb_build_object('label', i.label, 'org', jsonb_build_object('name', org->'name', 'dept', org->'dept'), 'sectors', (select data->'lists'->'formSectors' from shk_records where col = 'settings' and id = 'main'));
end $$;


-- إشعار لإدارة الشراكات في الإعدادات المشتركة (يظهر في الجرس)
create or replace function public.shk_ext_notify(p_t text, p_b text, p_href text, p_ic text, p_by text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare n jsonb; arr jsonb;
begin
  n := jsonb_build_object('id', 'ntf-' || encode(extensions.gen_random_bytes(6), 'hex'), 'at', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'to', jsonb_build_array(jsonb_build_object('grp', 'partnerships')), 't', p_t, 'b', p_b, 'href', p_href, 'ic', p_ic, 'by', p_by, 'read', '{}'::jsonb);
  select coalesce(data->'notifs', '[]'::jsonb) into arr from shk_records where col = 'settings' and id = 'main' for update;
  if not found then return; end if;
  arr := jsonb_build_array(n) || arr;
  if jsonb_array_length(arr) > 300 then arr := (select jsonb_agg(x order by o) from jsonb_array_elements(arr) with ordinality t(x, o) where o <= 300); end if;
  update shk_records set data = jsonb_set(data, '{notifs}', arr), rev = nextval('shk_rev_seq'), updated_at = now(), updated_by = 'external'
    where col = 'settings' and id = 'main';
end $$;
revoke all on function public.shk_ext_notify(text, text, text, text, text) from public, anon, authenticated;

-- رفع مرفق من الجهة الخارجية (برابط الدعوة قبل الإرسال، أو برابط المتابعة عند الرد): حتى 5 ميجابايت و10 ملفات
create or replace function public.shk_ext_file_put(p_key text, p_id text, p_meta jsonb, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare i record; pid text; own text;
begin
  select * into i from shk_invites where token_hash = shk_hash_token(p_key);
  if i.id is not null and not i.revoked and i.expires_at > now() and i.uses < i.max_uses then own := 'ext-inv:' || i.id;
  else
    select proposal_id into pid from shk_ext_tracks where track_hash = shk_hash_token(p_key);
    if pid is null then return jsonb_build_object('error', 'invalid'); end if;
    own := 'ext-trk:' || pid;
  end if;
  if coalesce(p_id, '') !~ '^f-ext-[a-z0-9]{6,40}$' or p_data is null or length(p_data) > 7000000 then return jsonb_build_object('error', 'bad_file'); end if;
  if (select count(*) from shk_files where created_by = own) >= 10 then return jsonb_build_object('error', 'too_many'); end if;
  insert into shk_files (id, meta, data, created_by) values (p_id,
    jsonb_build_object('name', left(coalesce(p_meta->>'name', 'ملف'), 160), 'type', left(coalesce(p_meta->>'type', 'application/octet-stream'), 100), 'size', coalesce((p_meta->>'size')::bigint, 0), 'at', now()),
    p_data, own) on conflict (id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- مرفقات الجهة المسموح بها فقط (ما رفعته هي بالمفتاح نفسه)
create or replace function public.shk_ext_atts(p_files jsonb, p_own text, p_t text) returns jsonb
language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', 'att-' || encode(extensions.gen_random_bytes(5), 'hex'), 'fileId', f.id, 'name', f.meta->>'name', 'type', f.meta->>'type',
    'size', (f.meta->>'size')::bigint, 'category', 'مرفقات الجهة الخارجية', 'addedAt', p_t, 'by', 'جهة خارجية')), '[]'::jsonb)
  from shk_files f where f.created_by = p_own and f.id in (select jsonb_array_elements_text(coalesce(p_files, '[]'::jsonb)));
$$;
revoke all on function public.shk_ext_atts(jsonb, text, text) from public, anon, authenticated;

-- إرسال المقترح الخارجي: يُنشأ سجل مقترح «مقدَّم» ويُعاد رقمه ورابط المتابعة
create or replace function public.shk_ext_submit(p_invite text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare i record; pid text; tk text; ref text; n int; rec jsonb; t text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  k text; f jsonb := '{}'::jsonb;
begin
  select * into i from shk_invites where token_hash = shk_hash_token(p_invite) for update;
  if i.id is null or i.revoked or i.expires_at <= now() or i.uses >= i.max_uses then return jsonb_build_object('error', 'invalid'); end if;
  if coalesce(trim(p_data->>'partnerName'), '') = '' or coalesce(trim(p_data->>'requesterName'), '') = '' or coalesce(trim(p_data->>'targets'), '') = '' then
    return jsonb_build_object('error', 'missing');
  end if;
  foreach k in array array['partnerName','partnerSector','about','requesterName','requesterTitle','requesterEmail','contactName','contactEmail','contactPhone','targets','addedValue','duration','notes'] loop
    if p_data ? k then f := f || jsonb_build_object(k, left(coalesce(p_data->>k, ''), 4000)); end if;
  end loop;
  pid := 'pr-ext-' || encode(extensions.gen_random_bytes(6), 'hex');
  tk := encode(extensions.gen_random_bytes(24), 'hex');
  select count(*) + 1 into n from shk_records where col = 'proposals' and data->>'external' = 'true';
  ref := 'EXT-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  rec := f || jsonb_build_object('id', pid, 'ref', ref, 'status', 'submitted', 'external', true, 'extInvite', i.id, 'extLabel', i.label,
    'department', 'جهة خارجية', 'createdAt', t, 'submittedAt', t, 'updatedAt', t, 'createdByRole', 'external', 'demo', false, 'partnershipId', null, 'attachments', shk_ext_atts(p_data->'files', 'ext-inv:' || i.id, t),
    'events', jsonb_build_array(jsonb_build_object('id', 'ev-' || encode(extensions.gen_random_bytes(4), 'hex'), 'at', t, 'by', coalesce(f->>'requesterName', 'جهة خارجية'), 'role', 'external', 'type', 'submitted', 'message', 'قُدّم المقترح عبر رابط الدعوة الخارجي')));
  insert into shk_records (col, id, data, deleted, rev, updated_at, updated_by) values ('proposals', pid, rec, false, nextval('shk_rev_seq'), now(), 'external:' || i.id);
  insert into shk_ext_tracks (track_hash, proposal_id) values (shk_hash_token(tk), pid);
  update shk_invites set uses = uses + 1 where id = i.id;
  perform shk_ext_notify('مقترح شراكة من جهة خارجية ' || ref, 'جهة خارجية — ' || (f->>'partnerName'), '#/proposals/' || pid, 'send', coalesce(f->>'requesterName', 'جهة خارجية'));
  return jsonb_build_object('ref', ref, 'track', tk);
end $$;

-- متابعة المقترح (بلا تسجيل دخول): الحالة والرسائل الموجهة للجهة فقط
create or replace function public.shk_ext_status(p_track text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pid text; d jsonb;
begin
  select proposal_id into pid from shk_ext_tracks where track_hash = shk_hash_token(p_track);
  if pid is null then return jsonb_build_object('error', 'invalid'); end if;
  select data into d from shk_records where col = 'proposals' and id = pid and not deleted;
  if d is null then return jsonb_build_object('error', 'invalid'); end if;
  return jsonb_build_object('ref', d->'ref', 'partnerName', d->'partnerName', 'status', d->'status', 'submittedAt', d->'submittedAt',
    'org', (select data->'org'->'name' from shk_records where col = 'settings' and id = 'main'),
    'events', coalesce((select jsonb_agg(jsonb_build_object('at', e->'at', 'type', e->'type', 'to', e->'to', 'message', e->'message'))
      from jsonb_array_elements(coalesce(d->'events', '[]'::jsonb)) e
      where (e->>'type' in ('status', 'submitted', 'resubmitted') and coalesce(e->>'vis', 'all') = 'all')), '[]'::jsonb),
    'canReply', d->>'status' = 'info',
    'files', coalesce((select jsonb_agg(jsonb_build_object('name', a->>'name', 'size', a->'size')) from jsonb_array_elements(coalesce(d->'attachments', '[]'::jsonb)) a where a->>'category' = 'مرفقات الجهة الخارجية'), '[]'::jsonb));
end $$;

-- رد الجهة على «طلب استكمال»: رسالة ومرفقات، ويعود المقترح «مقدَّمًا» لإدارة الشراكات
create or replace function public.shk_ext_reply(p_track text, p_message text, p_files jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare pid text; d jsonb; t text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'); att jsonb; msg text := left(trim(coalesce(p_message, '')), 4000);
begin
  select proposal_id into pid from shk_ext_tracks where track_hash = shk_hash_token(p_track);
  if pid is null then return jsonb_build_object('error', 'invalid'); end if;
  select data into d from shk_records where col = 'proposals' and id = pid and not deleted for update;
  if d is null then return jsonb_build_object('error', 'invalid'); end if;
  if d->>'status' <> 'info' then return jsonb_build_object('error', 'closed'); end if;
  att := shk_ext_atts(p_files, 'ext-trk:' || pid, t);
  if msg = '' and jsonb_array_length(att) = 0 then return jsonb_build_object('error', 'missing'); end if;
  d := d || jsonb_build_object('status', 'submitted', 'updatedAt', t,
    'attachments', coalesce(d->'attachments', '[]'::jsonb) || att,
    'events', coalesce(d->'events', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('id', 'ev-' || encode(extensions.gen_random_bytes(4), 'hex'), 'at', t,
      'by', coalesce(d->>'requesterName', 'جهة خارجية'), 'role', 'external', 'type', 'resubmitted', 'vis', 'all',
      'message', msg || case when jsonb_array_length(att) > 0 then E'\n— أُرفق ' || jsonb_array_length(att) || ' ملف' else '' end)));
  update shk_records set data = d, rev = nextval('shk_rev_seq'), updated_at = now(), updated_by = 'external:' || pid where col = 'proposals' and id = pid;
  perform shk_ext_notify('ردّت الجهة الخارجية على طلب الاستكمال: ' || (d->>'ref'), 'جهة خارجية — ' || (d->>'partnerName'), '#/proposals/' || pid, 'msg', coalesce(d->>'requesterName', 'جهة خارجية'));
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.shk_invite_create(text, text, text, int), public.shk_invite_list(text), public.shk_invite_revoke(text, text),
  public.shk_invite_check(text), public.shk_ext_submit(text, jsonb), public.shk_ext_status(text),
  public.shk_ext_file_put(text, text, jsonb, text), public.shk_ext_reply(text, text, jsonb) to anon, authenticated;

-- ===== بوابة الشريك (تُشغَّل مرة واحدة في Supabase ← SQL Editor؛ آمنة للتكرار) =====
-- رابط خاص لكل شراكة تفتحه الجهة الشريكة بلا حساب: ترى شراكتها ومخرجاتها ومواعيدها،
-- وترفع تقارير الإنجاز والصور والرسائل، فتصل لإدارة الشراكات بإشعار وتُضاف لملفات الشراكة.
-- يُحفظ على الخادم بصمة الرابط لا الرابط نفسه، ولا ترى الجهة أي بيانات داخلية (التقييم، الملاحظات، المالية…).
create table if not exists public.shk_portals (
  id             text primary key,
  token_hash     text unique not null,
  partnership_id text not null,
  label          text not null default '',
  created_by     text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  revoked        boolean not null default false,
  opens          int not null default 0,
  last_open      timestamptz
);
alter table public.shk_portals enable row level security;
revoke all on table public.shk_portals from public, anon, authenticated;

-- إشعار لإدارة الشراكات (نفس دالة مقترحات الجهات الخارجية؛ تُعاد هنا لتعمل البوابة وحدها)
create or replace function public.shk_ext_notify(p_t text, p_b text, p_href text, p_ic text, p_by text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare n jsonb; arr jsonb;
begin
  n := jsonb_build_object('id', 'ntf-' || encode(extensions.gen_random_bytes(6), 'hex'), 'at', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'to', jsonb_build_array(jsonb_build_object('grp', 'partnerships')), 't', p_t, 'b', p_b, 'href', p_href, 'ic', p_ic, 'by', p_by, 'read', '{}'::jsonb);
  select coalesce(data->'notifs', '[]'::jsonb) into arr from shk_records where col = 'settings' and id = 'main' for update;
  if not found then return; end if;
  arr := jsonb_build_array(n) || arr;
  if jsonb_array_length(arr) > 300 then arr := (select jsonb_agg(x order by o) from jsonb_array_elements(arr) with ordinality t(x, o) where o <= 300); end if;
  update shk_records set data = jsonb_set(data, '{notifs}', arr), rev = nextval('shk_rev_seq'), updated_at = now(), updated_by = 'external'
    where col = 'settings' and id = 'main';
end $$;
revoke all on function public.shk_ext_notify(text, text, text, text, text) from public, anon, authenticated;

-- إدارة الروابط (إدارة الشراكات وفريقها)
create or replace function public.shk_portal_create(p_token text, p_pid text, p_label text, p_expires_at text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare me record; tk text; iid text; ex timestamptz := p_expires_at::timestamptz;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin', 'team') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if not exists (select 1 from shk_records where col = 'partnerships' and id = p_pid and not deleted) then raise exception 'not_found' using errcode = 'P0001'; end if;
  if ex is null or ex <= now() or ex > now() + interval '400 days' then raise exception 'bad_expiry' using errcode = 'P0001'; end if;
  tk := encode(extensions.gen_random_bytes(24), 'hex');
  iid := encode(extensions.gen_random_bytes(6), 'hex');
  insert into shk_portals (id, token_hash, partnership_id, label, created_by, expires_at) values (iid, shk_hash_token(tk), p_pid, left(coalesce(p_label, ''), 120), me.account_id, ex);
  return jsonb_build_object('id', iid, 'token', tk);
end $$;

create or replace function public.shk_portal_list(p_token text, p_pid text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin', 'team') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'label', label, 'by', created_by, 'at', created_at, 'expires', expires_at, 'revoked', revoked, 'opens', opens, 'last', last_open) order by created_at desc)
    from shk_portals where partnership_id = p_pid), '[]'::jsonb);
end $$;

create or replace function public.shk_portal_revoke(p_token text, p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select * into me from shk_auth(p_token);
  if me.grp not in ('sys', 'admin', 'team') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update shk_portals set revoked = true where id = p_id;
end $$;

-- مفتاح البوابة الصالح ← سجلها
create or replace function public.shk_portal_key(p_key text) returns shk_portals
language sql security definer set search_path = public as $$
  select * from shk_portals where token_hash = shk_hash_token(p_key) and not revoked and expires_at > now();
$$;
revoke all on function public.shk_portal_key(text) from public, anon, authenticated;

-- ما تراه الجهة الشريكة: بيانات عامة عن شراكتها فقط
create or replace function public.shk_portal_view(p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g shk_portals; d jsonb; pr jsonb; org jsonb;
begin
  select * into g from shk_portals where token_hash = shk_hash_token(p_key);
  if g.id is null then return jsonb_build_object('error', 'invalid'); end if;
  if g.revoked then return jsonb_build_object('error', 'revoked'); end if;
  if g.expires_at <= now() then return jsonb_build_object('error', 'expired'); end if;
  select data into d from shk_records where col = 'partnerships' and id = g.partnership_id and not deleted;
  if d is null then return jsonb_build_object('error', 'invalid'); end if;
  select data into pr from shk_records where col = 'partners' and id = d->>'partnerId' and not deleted;
  select data->'org' into org from shk_records where col = 'settings' and id = 'main';
  update shk_portals set opens = opens + 1, last_open = now() where id = g.id;
  return jsonb_build_object(
    'org', jsonb_build_object('name', org->'name', 'dept', org->'dept'),
    'partner', jsonb_build_object('name', coalesce(pr->'name', d->'title'), 'logo', pr->'logoFileId'),
    'p', jsonb_build_object('code', d->'code', 'title', d->'title', 'stage', d->'stage', 'startDate', d->'startDate', 'endDate', d->'endDate',
      'cooperationAreas', d->'cooperationAreas', 'outputs', d->'outputs', 'expectedImpact', d->'expectedImpact', 'classification', d->'classification',
      'meetings', coalesce((select jsonb_agg(jsonb_build_object('date', m->'date', 'time', m->'time', 'title', m->'title', 'place', m->'place'))
        from jsonb_array_elements(coalesce(d->'meetings', '[]'::jsonb)) m where m->>'date' >= to_char(now(), 'YYYY-MM-DD')), '[]'::jsonb),
      'reports', coalesce((select jsonb_agg(jsonb_build_object('id', r->'id', 'at', r->'at', 'kind', r->'kind', 'text', r->'text', 'by', r->'by', 'files', r->'files', 'output', r->'output', 'seen', r->'seen', 'reply', r->'reply'))
        from jsonb_array_elements(coalesce(d->'partnerReports', '[]'::jsonb)) r where r->>'portal' = g.id), '[]'::jsonb)),
    'label', g.label, 'expires', g.expires_at);
end $$;

-- شعار الجهة فقط يمكن جلبه من البوابة
create or replace function public.shk_portal_file(p_key text, p_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g shk_portals; d jsonb; pr jsonb; f record;
begin
  select * into g from shk_portal_key(p_key); if g.id is null then return null; end if;
  select data into d from shk_records where col = 'partnerships' and id = g.partnership_id;
  select data into pr from shk_records where col = 'partners' and id = d->>'partnerId';
  if p_id is distinct from pr->>'logoFileId' then return null; end if;
  select * into f from shk_files where id = p_id; if f.id is null then return null; end if;
  return jsonb_build_object('meta', f.meta, 'data', f.data);
end $$;

-- رفع مرفق من البوابة: حتى 8 ميجابايت للملف و80 ملفًا للرابط
create or replace function public.shk_portal_file_put(p_key text, p_id text, p_meta jsonb, p_data text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g shk_portals; own text;
begin
  select * into g from shk_portal_key(p_key); if g.id is null then return jsonb_build_object('error', 'invalid'); end if;
  own := 'portal:' || g.id;
  if coalesce(p_id, '') !~ '^f-ptl-[a-z0-9]{6,40}$' or p_data is null or length(p_data) > 11200000 then return jsonb_build_object('error', 'bad_file'); end if;
  if (select count(*) from shk_files where created_by = own) >= 80 then return jsonb_build_object('error', 'too_many'); end if;
  insert into shk_files (id, meta, data, created_by) values (p_id,
    jsonb_build_object('name', left(coalesce(p_meta->>'name', 'ملف'), 160), 'type', left(coalesce(p_meta->>'type', 'application/octet-stream'), 100), 'size', coalesce((p_meta->>'size')::bigint, 0), 'at', now()),
    p_data, own) on conflict (id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- إرسال تقرير إنجاز أو صور أو رسالة: يُضاف لسجل الشراكة ومرفقاتها، ويصل إشعار لإدارة الشراكات
create or replace function public.shk_portal_submit(p_key text, p_kind text, p_text text, p_by text, p_output text, p_files jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare g shk_portals; d jsonb; t text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'); att jsonb; rid text; cat text; kind text := coalesce(p_kind, 'report');
begin
  select * into g from shk_portal_key(p_key); if g.id is null then return jsonb_build_object('error', 'invalid'); end if;
  if kind not in ('report', 'photos', 'message') then kind := 'report'; end if;
  select data into d from shk_records where col = 'partnerships' and id = g.partnership_id and not deleted for update;
  if d is null then return jsonb_build_object('error', 'invalid'); end if;
  cat := case kind when 'photos' then 'صور الشراكة' else 'تقارير الشريك' end;
  select coalesce(jsonb_agg(jsonb_build_object('id', 'att-' || encode(extensions.gen_random_bytes(5), 'hex'), 'fileId', f.id, 'name', f.meta->>'name', 'type', f.meta->>'type',
      'size', (f.meta->>'size')::bigint, 'category', cat, 'addedAt', t, 'by', 'الجهة الشريكة')), '[]'::jsonb) into att
    from shk_files f where f.created_by = 'portal:' || g.id and f.id in (select jsonb_array_elements_text(coalesce(p_files, '[]'::jsonb)))
      and not exists (select 1 from jsonb_array_elements(coalesce(d->'attachments', '[]'::jsonb)) a where a->>'fileId' = f.id);
  if coalesce(trim(p_text), '') = '' and jsonb_array_length(att) = 0 then return jsonb_build_object('error', 'missing'); end if;
  rid := 'rep-' || encode(extensions.gen_random_bytes(5), 'hex');
  d := d || jsonb_build_object('updatedAt', t,
    'attachments', coalesce(d->'attachments', '[]'::jsonb) || att,
    'partnerReports', coalesce(d->'partnerReports', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('id', rid, 'at', t, 'portal', g.id, 'kind', kind,
      'text', left(coalesce(trim(p_text), ''), 6000), 'by', left(coalesce(trim(p_by), ''), 120), 'output', left(coalesce(p_output, ''), 300),
      'files', (select coalesce(jsonb_agg(jsonb_build_object('fileId', a->'fileId', 'name', a->'name', 'type', a->'type', 'size', a->'size')), '[]'::jsonb) from jsonb_array_elements(att) a), 'seen', false)));
  update shk_records set data = d, rev = nextval('shk_rev_seq'), updated_at = now(), updated_by = 'portal:' || g.id where col = 'partnerships' and id = g.partnership_id;
  perform shk_ext_notify(case kind when 'photos' then 'صور جديدة من الشريك' when 'message' then 'رسالة من الشريك' else 'تقرير إنجاز من الشريك' end || ': ' || coalesce(d->>'code', ''),
    coalesce((select data->>'name' from shk_records where col = 'partners' and id = d->>'partnerId'), d->>'title', ''), '#/partnerships/' || g.partnership_id || '#portal', case kind when 'photos' then 'image' when 'message' then 'msg' else 'file' end, coalesce(nullif(trim(p_by), ''), 'الجهة الشريكة'));
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

grant execute on function public.shk_portal_create(text, text, text, text), public.shk_portal_list(text, text), public.shk_portal_revoke(text, text),
  public.shk_portal_view(text), public.shk_portal_file(text, text), public.shk_portal_file_put(text, text, jsonb, text),
  public.shk_portal_submit(text, text, text, text, text, jsonb) to anon, authenticated;

-- ===== مساعد الشراكات — الذكاء الاصطناعي (تُشغَّل مرة واحدة في Supabase ← SQL Editor؛ آمنة للتكرار) =====
-- تتحقق الدالة الطرفية supabase/functions/assistant من جلسة المستخدم بهذه الدالة قبل أي طلب لـ Claude،
-- وتحسب الطلبات اليومية لكل حساب (حد يومي يمنع الاستهلاك غير المقصود). مفتاح Claude لا يُحفظ هنا ولا في المتصفح.
create table if not exists public.shk_ai_usage (
  account_id text not null,
  day        date not null default current_date,
  n          int  not null default 0,
  primary key (account_id, day)
);
alter table public.shk_ai_usage enable row level security;
revoke all on table public.shk_ai_usage from public, anon, authenticated;

create or replace function public.shk_ai_check(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me record; lim int; used int;
begin
  begin select * into me from shk_auth(p_token); exception when others then return jsonb_build_object('ok', false, 'error', 'invalid_token'); end;
  lim := case when me.grp = 'viewer' then 40 else 300 end;
  insert into shk_ai_usage (account_id, day, n) values (me.account_id, current_date, 1)
    on conflict (account_id, day) do update set n = shk_ai_usage.n + 1 returning n into used;
  if used > lim then return jsonb_build_object('ok', false, 'error', 'limit', 'limit', lim); end if;
  return jsonb_build_object('ok', true, 'grp', me.grp, 'left', lim - used);
end $$;
grant execute on function public.shk_ai_check(text) to anon, authenticated;
