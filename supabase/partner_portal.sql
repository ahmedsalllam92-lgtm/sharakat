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
