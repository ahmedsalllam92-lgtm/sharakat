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
