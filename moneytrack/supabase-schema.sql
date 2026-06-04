-- ============================================================
-- MoneyTrack — Supabase Schema
-- วิธีใช้: ไปที่ Supabase → SQL Editor → วาง SQL นี้แล้วกด Run
-- ============================================================

-- Subscriptions table
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'อื่นๆ',
  amount numeric(10,2) not null,
  billing_day integer not null check (billing_day between 1 and 31),
  color text default '#7f77dd',
  icon text default 'ti-star',
  image_url text,
  created_at timestamptz default now()
);

-- Transactions table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  name text not null,
  amount numeric(10,2) not null,
  category text not null default 'อื่นๆ',
  date date not null default current_date,
  image_url text,
  created_at timestamptz default now()
);

-- Row Level Security (ทำให้แต่ละคนเห็นเฉพาะข้อมูลของตัวเอง)
alter table subscriptions enable row level security;
alter table transactions enable row level security;

create policy "Users see own subscriptions"
  on subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users see own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket สำหรับรูปภาพ
insert into storage.buckets (id, name, public)
values ('moneytrack-images', 'moneytrack-images', true)
on conflict do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'moneytrack-images' and auth.role() = 'authenticated');

create policy "Images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'moneytrack-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'moneytrack-images' and auth.uid()::text = (storage.foldername(name))[1]);
