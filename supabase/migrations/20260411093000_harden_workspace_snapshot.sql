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
  v_auth_email text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email
  into v_auth_email
  from auth.users
  where id = v_user_id;

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
    coalesce(v_auth_email, p_email, ''),
    coalesce(p_full_name, ''),
    coalesce(p_currency, 'USD'),
    coalesce(p_monthly_income, 0),
    coalesce(p_theme, 'light'),
    coalesce(p_started_at, v_now),
    coalesce(p_setup_complete, false)
  )
  on conflict (id) do update
  set
    email = coalesce(v_auth_email, excluded.email, ''),
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
    case
      when b.id is not null
        and not exists (
          select 1 from public.budgets existing where existing.id = b.id
        )
      then b.id
      else gen_random_uuid()
    end,
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
    case
      when t.id is not null
        and not exists (
          select 1 from public.transactions existing where existing.id = t.id
        )
      then t.id
      else gen_random_uuid()
    end,
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
    case
      when g.id is not null
        and not exists (
          select 1 from public.goals existing where existing.id = g.id
        )
      then g.id
      else gen_random_uuid()
    end,
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
    case
      when r.id is not null
        and not exists (
          select 1 from public.reminders existing where existing.id = r.id
        )
      then r.id
      else gen_random_uuid()
    end,
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
