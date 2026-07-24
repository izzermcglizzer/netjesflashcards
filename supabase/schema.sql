-- Netjes Nederlands: user-specific state.
-- Static word/deck content stays in src/data/*.json, not in Postgres.
-- Run this once in the Supabase SQL editor for a fresh project.

create table if not exists profile (
  user_id uuid primary key references auth.users on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  longest_streak int not null default 0,
  last_study_date date,
  daily_goal int not null default 20,
  new_cards_per_day int not null default 10,
  sound_enabled boolean not null default true
);

create table if not exists card_state (
  user_id uuid not null references auth.users on delete cascade,
  word_id text not null,
  deck_id text not null,
  ease_factor real not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  due_date date not null,
  last_reviewed_at timestamptz,
  primary key (user_id, word_id)
);

create table if not exists review_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  word_id text not null,
  deck_id text not null,
  mode text not null,
  grade int not null,
  correct boolean not null,
  reviewed_at timestamptz not null default now()
);

create table if not exists achievement (
  user_id uuid not null references auth.users on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

alter table profile enable row level security;
alter table card_state enable row level security;
alter table review_log enable row level security;
alter table achievement enable row level security;

create policy "profile: owner only" on profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "card_state: owner only" on card_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "review_log: owner only" on review_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "achievement: owner only" on achievement
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists card_state_due_idx on card_state (user_id, deck_id, due_date);
create index if not exists review_log_user_idx on review_log (user_id, reviewed_at desc);
