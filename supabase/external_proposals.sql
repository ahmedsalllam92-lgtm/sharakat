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
