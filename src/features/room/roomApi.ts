import { ensureUser, getSupabase, supabaseConfigured } from '../../lib/supabase'

export interface Room {
  id: string
  title: string
  cands: string[]
  area: string | null
  owner: string
  due: string | null
  closed: boolean
  winner: number | null
  created_at: string
}

export interface Vote {
  room_id: string
  voter: string
  nickname: string
  choice: number
}

export const roomsEnabled = (): boolean => supabaseConfigured

const db = getSupabase

const ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const newId = (): string => Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('')

export const isClosed = (r: Pick<Room, 'closed' | 'due'>, now = Date.now()): boolean =>
  r.closed || (r.due != null && Date.parse(r.due) <= now)

export async function createRoom(input: { title: string; cands: string[]; area: string | null; due: Date | null }): Promise<string> {
  const owner = await ensureUser()
  if (!owner) throw new Error('익명 로그인에 실패했어요')
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newId()
    const { error } = await (await db())
      .from('rooms')
      .insert({ id, title: input.title, cands: input.cands, area: input.area, owner, due: input.due?.toISOString() ?? null })
    if (!error) return id
    if (error.code !== '23505') throw error // 23505 = id 충돌 → 다시 시도
  }
  throw new Error('팀방 주소를 만들지 못했어요')
}

export async function getRoom(id: string): Promise<Room | null> {
  const { data, error } = await (await db()).from('rooms').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Room | null
}

export async function getRooms(ids: string[]): Promise<Room[]> {
  if (!ids.length) return []
  const { data, error } = await (await db()).from('rooms').select('*').in('id', ids).order('created_at', { ascending: false })
  if (error) throw error
  return data as Room[]
}

export async function getVotes(roomId: string): Promise<Vote[]> {
  const { data, error } = await (await db()).from('votes').select('room_id,voter,nickname,choice').eq('room_id', roomId)
  if (error) throw error
  return data as Vote[]
}

export async function castVote(roomId: string, choice: number, nickname: string): Promise<void> {
  const voter = await ensureUser()
  const { error } = await (await db())
    .from('votes')
    .upsert({ room_id: roomId, voter, nickname, choice, updated_at: new Date().toISOString() }, { onConflict: 'room_id,voter' })
  if (error) throw error
}

export async function updateRoom(id: string, patch: Partial<Pick<Room, 'closed' | 'winner'>>): Promise<void> {
  const { error } = await (await db()).from('rooms').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await (await db()).from('rooms').delete().eq('id', id)
  if (error) throw error
}

/** 방 정보나 투표가 바뀌면 onChange 호출. 반환값으로 구독 해제 */
export function subscribeRoom(id: string, onChange: () => void): () => void {
  if (!supabaseConfigured) return () => {}
  let stopped = false
  let stop = () => {}
  void getSupabase().then((client) => {
    if (stopped) return
    const channel = client
      .channel(`room:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${id}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${id}` }, onChange)
      .subscribe()
    stop = () => void client.removeChannel(channel)
  })
  return () => {
    stopped = true
    stop()
  }
}

export function tally(room: Room, votes: Vote[]) {
  const counts = room.cands.map(() => 0)
  const names: string[][] = room.cands.map(() => [])
  for (const v of votes) {
    if (v.choice >= 0 && v.choice < counts.length) {
      counts[v.choice]++
      names[v.choice].push(v.nickname)
    }
  }
  return { counts, names, total: votes.length }
}
