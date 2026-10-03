alter table public.profiles
  add column if not exists credits_remaining integer,
  add column if not exists images_processed integer,
  add column if not exists plan text;

update public.profiles
set credits_remaining = coalesce(credits_remaining, 0),
  images_processed = coalesce(images_processed, 0),
  plan = coalesce(plan, 'Free')
where credits_remaining is null or images_processed is null or plan is null;

alter table public.profiles
  alter column credits_remaining set default 0,
  alter column credits_remaining set not null,
  alter column images_processed set default 0,
  alter column images_processed set not null,
  alter column plan set default 'Free',
  alter column plan set not null;

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create table if not exists public.credit_purchases (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10, 2) not null,
  credits integer not null check (credits > 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FAILED')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists credit_purchases_user_id_idx on public.credit_purchases(user_id);

alter table public.credit_purchases enable row level security;

drop policy if exists "Users can view their own purchases" on public.credit_purchases;
create policy "Users can view their own purchases"
  on public.credit_purchases for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, credits_remaining, images_processed, plan)
  values (new.id, 5, 0, 'Free')
  on conflict (id) do update
    set credits_remaining = coalesce(profiles.credits_remaining, 5),
        images_processed = coalesce(profiles.images_processed, 0),
        plan = coalesce(profiles.plan, 'Free');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;
create trigger on_auth_user_created_credits
after insert on auth.users
for each row execute procedure public.handle_new_user_credits();

create or replace function public.consume_image_credit(p_user_id uuid)
returns table (credits_remaining integer, images_processed integer)
language sql
security definer set search_path = public
as $$
  update public.profiles
  set credits_remaining = credits_remaining - 1,
      images_processed = images_processed + 1
  where id = p_user_id
    and credits_remaining > 0
  returning public.profiles.credits_remaining, public.profiles.images_processed;
$$;

create or replace function public.complete_credit_purchase(
  p_order_id text,
  p_user_id uuid
)
returns table (credits_added integer, credits_remaining integer, images_processed integer)
language plpgsql
security definer set search_path = public
as $$
declare
  purchase_credits integer;
  current_credits integer;
  current_images integer;
begin
  update public.credit_purchases
  set status = 'PAID', paid_at = now()
  where order_id = p_order_id
    and user_id = p_user_id
    and status = 'PENDING'
  returning credits into purchase_credits;

  if purchase_credits is null then
    select p.credits_remaining, p.images_processed
      into current_credits, current_images
    from public.profiles p
    where p.id = p_user_id;

    if exists (
      select 1 from public.credit_purchases
      where order_id = p_order_id and user_id = p_user_id and status = 'PAID'
    ) then
      return query select 0, current_credits, current_images;
      return;
    end if;

    raise exception 'Purchase order is not pending';
  end if;

  update public.profiles
  set credits_remaining = credits_remaining + purchase_credits
      , plan = 'Credits'
  where id = p_user_id
  returning profiles.credits_remaining, profiles.images_processed
    into current_credits, current_images;

  if current_credits is null then
    raise exception 'Profile not found';
  end if;

  return query select purchase_credits, current_credits, current_images;
end;
$$;

grant execute on function public.consume_image_credit(uuid) to service_role;
grant execute on function public.complete_credit_purchase(text, uuid) to service_role;
