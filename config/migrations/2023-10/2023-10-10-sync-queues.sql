create type sync_status as enum ('running', 'errored', 'canceled', 'complete');

-- Sync queues
create table public.sync_queues (
  id         uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at   timestamp with time zone,
  source_id  uuid references public.sources on delete cascade not null,
  status     sync_status not null,
  logs       jsonb[] not null default array[]::jsonb[]
);
comment on table public.sync_queues is 'Sync queues.';

create or replace function append_log_to_sync_queue(
  id uuid,
  entry jsonb
)
returns void
language plpgsql
as $$
begin
  update sync_queues
    set logs = logs || append_log_to_sync_queue.entry
    where sync_queues.id = append_log_to_sync_queue.id;
end;
$$;

alter table sync_queues
  enable row level security;

create or replace function get_latest_sync_queues(
  project_id uuid
)
returns table (
  id uuid,
  source_id uuid,
  status sync_status,
  created_at timestamp with time zone,
  ended_at timestamp with time zone
)
language plpgsql
as $$
begin
  return query
  with rankedsyncqueues as (
    select
        sq.id as id, sq.source_id as source_id, sq.status as status, sq.created_at as created_at, sq.ended_at as ended_at,
        -- sq.id, sq.created_at, sq.ended_at, sq.source_id, sq.status,
        row_number() over(partition by sq.source_id order by sq.created_at desc) as rn
    from
        sync_queues sq
    join
        sources s on sq.source_id = s.id
    where
        s.project_id = get_latest_sync_queues.project_id
  )
  select
    rankedsyncqueues.id, rankedsyncqueues.source_id, rankedsyncqueues.status, rankedsyncqueues.created_at, rankedsyncqueues.ended_at
  from
    rankedsyncqueues
  where
    rankedsyncqueues.rn = 1;
end;
$$;