-- ============================================================
-- Family Sales Management — Full Schema (replaces stub)
-- Apply via: supabase db push  or  psql -f this file
-- ============================================================

create extension if not exists pgcrypto;

-- Profiles (linked 1:1 to auth.users)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Products
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  sku            text unique,
  name           text not null,
  category       text,
  brand          text,
  base_unit      text not null,
  retail_unit    text not null,
  units_per_base numeric(12,4) not null check (units_per_base > 0),
  is_active      boolean not null default true,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Price versions (effective pricing by date)
create table if not exists price_versions (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  wholesale_price bigint not null default 0 check (wholesale_price >= 0),
  retail_price    bigint not null default 0 check (retail_price >= 0),
  effective_from  date not null default current_date,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

-- Inventory transaction ledger (append-only)
create table if not exists inventory_transactions (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id),
  movement_type   text not null check (movement_type in ('receive','sell_base','sell_retail','adjust')),
  whole_quantity  numeric(12,4) not null default 0,
  retail_quantity numeric(12,4) not null default 0,
  reference_type  text,
  reference_id    uuid,
  idempotency_key text unique,
  actor_id        uuid references auth.users(id),
  note            text,
  created_at      timestamptz not null default now()
);

-- Current stock view
create or replace view product_stock as
  select
    product_id,
    sum(whole_quantity)  as whole_stock,
    sum(retail_quantity) as leftover_stock
  from inventory_transactions
  group by product_id;

-- Orders
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  status         text not null default 'draft' check (status in ('draft','confirmed','cancelled')),
  customer_name  text,
  customer_phone text,
  note           text,
  created_by     uuid references auth.users(id),
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Order lines
create table if not exists order_lines (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  unit_type   text not null check (unit_type in ('base','retail')),
  quantity    numeric(12,4) not null check (quantity > 0),
  unit_price  bigint not null check (unit_price >= 0),
  total       bigint not null check (total >= 0),
  created_at  timestamptz not null default now()
);

-- Invoices
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references orders(id),
  customer_name  text not null default '',
  customer_phone text,
  subtotal       bigint not null default 0 check (subtotal >= 0),
  discount       bigint not null default 0 check (discount >= 0),
  total          bigint not null default 0 check (total >= 0),
  outstanding    bigint not null default 0 check (outstanding >= 0),
  status         text not null default 'unpaid' check (status in ('unpaid','partial','paid')),
  invoice_date   date not null default current_date,
  due_date       date,
  issued_at      timestamptz not null default now(),
  actor_id       uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Payments
create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id),
  amount      bigint not null check (amount > 0),
  method      text not null default 'cash',
  note        text,
  actor_id    uuid references auth.users(id),
  paid_at     timestamptz not null default now()
);

-- Debt allocations (oldest-first settlement tracking)
create table if not exists debt_allocations (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references payments(id),
  invoice_id  uuid not null references invoices(id),
  allocated   bigint not null check (allocated > 0),
  created_at  timestamptz not null default now()
);

-- Market price checks (reference only)
create table if not exists market_price_checks (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references products(id),
  query_text   text not null,
  price_low    bigint,
  price_high   bigint,
  currency     text not null default 'VND',
  source_url   text,
  retrieved_at timestamptz not null default now(),
  actor_id     uuid references auth.users(id)
);

-- AI suggestions (require human confirmation)
create table if not exists ai_suggestions (
  id              uuid primary key default gen_random_uuid(),
  suggestion_type text not null check (suggestion_type in ('product_from_image','price_reference')),
  input_summary   text,
  suggestion_json jsonb,
  confirmed       boolean not null default false,
  confirmed_by    uuid references auth.users(id),
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- Indexes
create index if not exists inventory_product_created_idx on inventory_transactions(product_id, created_at);
create index if not exists invoices_customer_date_idx    on invoices(customer_name, invoice_date);
create index if not exists price_versions_product_idx    on price_versions(product_id, effective_from desc);
create index if not exists debt_alloc_payment_idx        on debt_allocations(payment_id);
create index if not exists debt_alloc_invoice_idx        on debt_allocations(invoice_id);

-- Row Level Security — equal access for all authenticated users
alter table profiles               enable row level security;
alter table products               enable row level security;
alter table price_versions         enable row level security;
alter table inventory_transactions enable row level security;
alter table orders                 enable row level security;
alter table order_lines            enable row level security;
alter table invoices               enable row level security;
alter table payments               enable row level security;
alter table debt_allocations       enable row level security;
alter table market_price_checks    enable row level security;
alter table ai_suggestions         enable row level security;

create policy "auth_full" on profiles               for all to authenticated using (true) with check (true);
create policy "auth_full" on products               for all to authenticated using (true) with check (true);
create policy "auth_full" on price_versions         for all to authenticated using (true) with check (true);
create policy "auth_full" on inventory_transactions for all to authenticated using (true) with check (true);
create policy "auth_full" on orders                 for all to authenticated using (true) with check (true);
create policy "auth_full" on order_lines            for all to authenticated using (true) with check (true);
create policy "auth_full" on invoices               for all to authenticated using (true) with check (true);
create policy "auth_full" on payments               for all to authenticated using (true) with check (true);
create policy "auth_full" on debt_allocations       for all to authenticated using (true) with check (true);
create policy "auth_full" on market_price_checks    for all to authenticated using (true) with check (true);
create policy "auth_full" on ai_suggestions         for all to authenticated using (true) with check (true);
