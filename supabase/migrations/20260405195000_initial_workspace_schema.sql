create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'ZAR')),
  monthly_income numeric(12, 2) not null default 4500 check (monthly_income >= 0),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  started_at timestamptz not null default timezone('utc', now()),
  setup_complete boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null check (category_id in ('housing', 'food', 'transport', 'utilities', 'healthcare', 'debt', 'entertainment', 'savings', 'education', 'other')),
  limit_amount numeric(12, 2) not null check (limit_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, category_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category_id text not null check (category_id in ('housing', 'food', 'transport', 'utilities', 'healthcare', 'debt', 'entertainment', 'savings', 'education', 'other')),
  occurred_on timestamptz not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category_id text not null check (category_id in ('housing', 'food', 'transport', 'utilities', 'healthcare', 'debt', 'entertainment', 'savings', 'education', 'other')),
  target_amount numeric(12, 2) not null check (target_amount >= 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('bill', 'budget', 'goal')),
  category_id text check (category_id in ('housing', 'food', 'transport', 'utilities', 'healthcare', 'debt', 'entertainment', 'savings', 'education', 'other')),
  due_date timestamptz,
  threshold numeric(5, 2),
  amount numeric(12, 2),
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_occurred_on_idx on public.transactions (occurred_on desc);
create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists reminders_user_id_idx on public.reminders (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row
execute function public.set_updated_at();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
before update on public.reminders
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
on public.budgets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
on public.budgets
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
on public.budgets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
on public.budgets
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own"
on public.goals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
on public.goals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own"
on public.goals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own"
on public.goals
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
on public.reminders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
on public.reminders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
on public.reminders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own"
on public.reminders
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.replace_workspace_snapshot(
  p_setup_complete boolean,
  p_full_name text,
  p_email text,
  p_currency text,
  p_monthly_income numeric,
  p_theme text,
  p_started_at timestamptz,
  p_budgets jsonb,
  p_transactions jsonb,
  p_goals jsonb,
  p_reminders jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    currency,
    monthly_income,
    theme,
    started_at,
    setup_complete
  )
  values (
    v_user_id,
    coalesce(p_email, ''),
    coalesce(p_full_name, ''),
    coalesce(p_currency, 'USD'),
    coalesce(p_monthly_income, 0),
    coalesce(p_theme, 'light'),
    coalesce(p_started_at, v_now),
    coalesce(p_setup_complete, false)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    currency = excluded.currency,
    monthly_income = excluded.monthly_income,
    theme = excluded.theme,
    started_at = excluded.started_at,
    setup_complete = excluded.setup_complete,
    updated_at = v_now;

  delete from public.budgets where user_id = v_user_id;
  insert into public.budgets (id, user_id, category_id, limit_amount, created_at, updated_at)
  select
    coalesce(b.id, gen_random_uuid()),
    v_user_id,
    b.category_id,
    coalesce(b.limit_amount, 0),
    coalesce(b.created_at, v_now),
    coalesce(b.updated_at, v_now)
  from jsonb_to_recordset(coalesce(p_budgets, '[]'::jsonb)) as b(
    id uuid,
    category_id text,
    limit_amount numeric,
    created_at timestamptz,
    updated_at timestamptz
  );

  delete from public.transactions where user_id = v_user_id;
  insert into public.transactions (id, user_id, description, amount, category_id, occurred_on, notes, created_at)
  select
    coalesce(t.id, gen_random_uuid()),
    v_user_id,
    coalesce(t.description, 'Untitled transaction'),
    coalesce(t.amount, 0),
    coalesce(t.category_id, 'other'),
    coalesce(t.occurred_on, v_now),
    coalesce(t.notes, ''),
    coalesce(t.created_at, v_now)
  from jsonb_to_recordset(coalesce(p_transactions, '[]'::jsonb)) as t(
    id uuid,
    description text,
    amount numeric,
    category_id text,
    occurred_on timestamptz,
    notes text,
    created_at timestamptz
  );

  delete from public.goals where user_id = v_user_id;
  insert into public.goals (
    id,
    user_id,
    name,
    category_id,
    target_amount,
    current_amount,
    target_date,
    notes,
    created_at,
    updated_at
  )
  select
    coalesce(g.id, gen_random_uuid()),
    v_user_id,
    coalesce(g.name, 'Untitled goal'),
    coalesce(g.category_id, 'other'),
    coalesce(g.target_amount, 0),
    coalesce(g.current_amount, 0),
    g.target_date,
    coalesce(g.notes, ''),
    coalesce(g.created_at, v_now),
    coalesce(g.updated_at, v_now)
  from jsonb_to_recordset(coalesce(p_goals, '[]'::jsonb)) as g(
    id uuid,
    name text,
    category_id text,
    target_amount numeric,
    current_amount numeric,
    target_date timestamptz,
    notes text,
    created_at timestamptz,
    updated_at timestamptz
  );

  delete from public.reminders where user_id = v_user_id;
  insert into public.reminders (
    id,
    user_id,
    title,
    kind,
    category_id,
    due_date,
    threshold,
    amount,
    note,
    active,
    created_at,
    updated_at
  )
  select
    coalesce(r.id, gen_random_uuid()),
    v_user_id,
    coalesce(r.title, 'Untitled reminder'),
    coalesce(r.kind, 'bill'),
    r.category_id,
    r.due_date,
    r.threshold,
    r.amount,
    coalesce(r.note, ''),
    coalesce(r.active, true),
    coalesce(r.created_at, v_now),
    coalesce(r.updated_at, v_now)
  from jsonb_to_recordset(coalesce(p_reminders, '[]'::jsonb)) as r(
    id uuid,
    title text,
    kind text,
    category_id text,
    due_date timestamptz,
    threshold numeric,
    amount numeric,
    note text,
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
  );
end;
$$;

grant execute on function public.replace_workspace_snapshot(
  boolean,
  text,
  text,
  text,
  numeric,
  text,
  timestamptz,
  jsonb,
  jsonb,
  jsonb,
  jsonb
) to authenticated;
