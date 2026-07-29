-- Adds recency tracking for "drill recently learned words" (Custom Practice).
-- Safe to run against the existing production card_state table.
-- Paste this into the Supabase SQL Editor and run it once.

alter table card_state add column if not exists learned_at timestamptz;

-- Belt-and-suspenders: once learned_at is set, preserve it even if a future
-- code change accidentally sends a different value on a later update.
create or replace function card_state_preserve_learned_at()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' and OLD.learned_at is not null then
    NEW.learned_at := OLD.learned_at;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists card_state_preserve_learned_at_trigger on card_state;
create trigger card_state_preserve_learned_at_trigger
before update on card_state
for each row execute function card_state_preserve_learned_at();
