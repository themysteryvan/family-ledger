-- Run this in the Supabase SQL editor to set up the schema

-- Households
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Household',
  created_at timestamptz default now()
);
alter table households enable row level security;
create policy "Users can manage their own household"
  on households for all using (auth.uid() = user_id);

-- Incomes
create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  frequency text not null,
  category text not null,
  owner text not null,
  is_active boolean not null default true,
  start_date text,
  notes text,
  created_at timestamptz default now()
);
alter table incomes enable row level security;
create policy "Users can manage incomes in their household"
  on incomes for all using (
    household_id in (select id from households where user_id = auth.uid())
  );

-- Expenses
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  frequency text not null,
  category text not null,
  is_fixed boolean not null default false,
  is_essential boolean not null default false,
  notes text,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "Users can manage expenses in their household"
  on expenses for all using (
    household_id in (select id from households where user_id = auth.uid())
  );

-- Assets
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  value numeric not null,
  category text not null,
  appreciation_rate numeric,
  purchase_price numeric,
  purchase_date text,
  notes text,
  created_at timestamptz default now()
);
alter table assets enable row level security;
create policy "Users can manage assets in their household"
  on assets for all using (
    household_id in (select id from households where user_id = auth.uid())
  );

-- Debts
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  balance numeric not null,
  original_balance numeric not null,
  interest_rate numeric not null,
  minimum_payment numeric not null,
  category text not null,
  lender text,
  due_date text,
  notes text,
  created_at timestamptz default now()
);
alter table debts enable row level security;
create policy "Users can manage debts in their household"
  on debts for all using (
    household_id in (select id from households where user_id = auth.uid())
  );

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  description text,
  total_budget numeric not null default 0,
  amount_spent numeric not null default 0,
  category text not null,
  status text not null default 'planned',
  target_date text,
  notes text,
  created_at timestamptz default now()
);
alter table projects enable row level security;
create policy "Users can manage projects in their household"
  on projects for all using (
    household_id in (select id from households where user_id = auth.uid())
  );

-- Project Expenses
create table if not exists project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  is_paid boolean not null default false,
  due_date text,
  created_at timestamptz default now()
);
alter table project_expenses enable row level security;
create policy "Users can manage project expenses"
  on project_expenses for all using (
    project_id in (
      select p.id from projects p
      join households h on h.id = p.household_id
      where h.user_id = auth.uid()
    )
  );
