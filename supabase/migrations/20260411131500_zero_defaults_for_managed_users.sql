alter table public.profiles
  alter column monthly_income set default 0;

update public.profiles
set
  monthly_income = 0,
  updated_at = timezone('utc', now())
where
  setup_complete = false
  and monthly_income = 4500;
