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
