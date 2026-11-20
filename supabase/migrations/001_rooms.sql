-- 점심각 팀방: 방(rooms)과 투표(votes)
-- 로그인 화면 없이 Supabase 익명 로그인(auth.uid())으로 사람을 구분한다.

create table public.rooms (
  id          text primary key check (id ~ '^[a-z0-9]{6,12}$'),
  title       text not null check (char_length(title) between 1 and 40),
  cands       jsonb not null check (jsonb_typeof(cands) = 'array' and jsonb_array_length(cands) between 2 and 6),
  area        text check (area is null or char_length(area) <= 20),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  due         timestamptz,
  closed      boolean not null default false,
  winner      int check (winner is null or winner between 0 and 5),
  created_at  timestamptz not null default now()
);

create table public.votes (
  room_id     text not null references public.rooms (id) on delete cascade,
  voter       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 12),
  choice      int not null check (choice between 0 and 5),
  updated_at  timestamptz not null default now(),
  primary key (room_id, voter)
);

create index votes_room_idx on public.votes (room_id);

-- 투표 가능 여부: 방이 있고, 마감되지 않았고, 선택지 번호가 후보 안에 있을 때
create function public.can_vote(rid text, pick int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = rid
      and not r.closed
      and (r.due is null or r.due > now())
      and pick < jsonb_array_length(r.cands)
  )
$$;

alter table public.rooms enable row level security;
alter table public.votes enable row level security;

-- 방: 링크를 아는 사람은 누구나 읽기, 만들기는 본인 이름으로, 수정·삭제는 방장만
create policy rooms_select on public.rooms for select using (true);
create policy rooms_insert on public.rooms for insert to authenticated with check (owner = auth.uid());
create policy rooms_update on public.rooms for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy rooms_delete on public.rooms for delete to authenticated using (owner = auth.uid());

-- 투표: 모두 읽기, 자기 표만 넣고 바꾸기, 마감 후에는 불가
create policy votes_select on public.votes for select using (true);
create policy votes_insert on public.votes for insert to authenticated
  with check (voter = auth.uid() and public.can_vote(room_id, choice));
create policy votes_update on public.votes for update to authenticated
  using (voter = auth.uid())
  with check (voter = auth.uid() and public.can_vote(room_id, choice));

-- 테이블 접근 권한. 최근 Supabase 프로젝트는 SQL로 만든 테이블에 자동으로 권한을 주지 않으므로 명시한다.
-- (실제로 누가 무엇을 할 수 있는지는 위 정책(RLS)이 한 번 더 거른다)
grant usage on schema public to anon, authenticated;
grant select on public.rooms, public.votes to anon, authenticated;
grant insert, update, delete on public.rooms to authenticated;
grant insert, update on public.votes to authenticated;
grant execute on function public.can_vote(text, int) to authenticated;

-- 실시간 반영
alter publication supabase_realtime add table public.rooms, public.votes;
