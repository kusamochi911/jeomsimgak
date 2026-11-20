import { useEffect, useState } from 'react'
import { Chip, useUI } from '../../components/ui'
import { MENUS, menuByName } from '../../data/menus'
import { pickRandom } from '../../lib/pick'
import { navigate } from '../../lib/router'
import { usePersistentState } from '../../lib/storage'
import { useData } from '../../state/data'
import { createRoom, getRooms, isClosed, roomsEnabled, type Room } from './roomApi'
import { shareRoom } from './shareRoom'

const DUES: [string, string | null][] = [['없음', null], ['30분 뒤', '+30'], ['11:30', '11:30'], ['11:50', '11:50'], ['12:00', '12:00']]

export function dueDate(v: string | null, now = new Date()): Date | null {
  if (!v) return null
  if (v.startsWith('+')) return new Date(now.getTime() + Number(v.slice(1)) * 60000)
  const [h, m] = v.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  return d
}

const defaultTitle = () => {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()} 점심 뭐 먹을까?`
}

export const emojiOf = (name: string): string => menuByName(name)?.emoji ?? '🍽️'

export function RoomPage() {
  const { toast } = useUI()
  const { draftCands, setDraftCands, myRooms, rememberRoom } = useData()
  const [title, setTitle] = useState('')
  const [add, setAdd] = useState('')
  const [due, setDue] = usePersistentState<string | null>('due', '+30')
  const [busy, setBusy] = useState(false)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const enabled = roomsEnabled()

  useEffect(() => {
    if (!enabled) return
    getRooms(myRooms).then(setRooms, () => setRooms([]))
  }, [enabled, myRooms])

  const addCand = (v: string) => {
    v = v.trim()
    if (!v) return
    if (draftCands.includes(v)) return toast('이미 있는 후보예요')
    if (draftCands.length >= 6) return toast('후보는 6개까지예요')
    setDraftCands([...draftCands, v])
    setAdd('')
  }

  const fillRandom = () => {
    const pool = [...MENUS]
    const out: string[] = []
    while (out.length < 4) {
      const m = pickRandom(pool)!
      pool.splice(pool.indexOf(m), 1)
      out.push(m.name)
    }
    setDraftCands(out)
  }

  async function create() {
    if (!enabled) return toast('팀방 서버가 아직 연결되지 않았어요')
    if (draftCands.length < 2) return toast('후보를 2개 이상 넣어주세요')
    const d = dueDate(due)
    if (d && d.getTime() <= Date.now()) return toast('이미 지난 마감 시간이에요. 다른 시간을 골라주세요')
    setBusy(true)
    try {
      const t = (title.trim() || defaultTitle()).slice(0, 24)
      const id = await createRoom({ title: t, cands: draftCands, area: null, due: d })
      rememberRoom(id)
      setDraftCands([])
      setTitle('')
      navigate(`/r/${id}`)
      void shareRoom({ id, title: t, cands: draftCands }, toast)
    } catch {
      toast('팀방을 만들지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="view" aria-label="팀방 투표">
      <h1 className="headline">링크 하나로<br /><em>같이 정하기</em></h1>
      <p className="sub">후보 메뉴를 올리고 링크를 팀 채팅에 보내면, 들어온 사람마다 한 표씩 실시간으로 투표합니다. 로그인은 필요 없어요.</p>
      {!enabled && <div className="notice">팀방 서버가 아직 연결되지 않았어요. 개발 중이라면 README의 Supabase 설정을 확인해 주세요.</div>}

      <form className="card stack" onSubmit={(e) => { e.preventDefault(); void create() }}>
        <div className="row-between" style={{ margin: 0 }}><h3 className="sec-title">새 팀방 만들기</h3><span className="hint">후보 2~6개</span></div>
        <input className="nick-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle()} maxLength={24} aria-label="팀방 이름" />
        <div className="chips">
          {draftCands.length ? draftCands.map((c) => (
            <Chip key={c} label={`${c} 후보 빼기`} onClick={() => setDraftCands(draftCands.filter((x) => x !== c))}>
              {emojiOf(c)} {c}<span className="x" aria-hidden="true">✕</span>
            </Chip>
          )) : <span className="hint">후보가 없어요. '추천 4개로 채우기'나 직접 추가를 눌러주세요.</span>}
        </div>
        <div className="addrow" style={{ marginTop: 0 }}>
          <input value={add} onChange={(e) => setAdd(e.target.value)} maxLength={14} placeholder="후보 직접 추가 (예: 회사 앞 국밥집)" aria-label="후보 추가"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCand(add) } }} />
          <button type="button" onClick={() => addCand(add)}>추가</button>
        </div>
        <div className="fgroup">
          <span className="flabel">마감</span>
          <div className="chips">
            {DUES.map(([l, v]) => {
              const past = v != null && !v.startsWith('+') && dueDate(v)!.getTime() <= Date.now()
              return <Chip key={l} pressed={due === v} disabled={past} title={past ? '오늘은 이미 지난 시간이에요' : undefined} onClick={() => setDue(v)}>{l}</Chip>
            })}
          </div>
        </div>
        <div className="btnrow">
          <button type="button" className="btn-ghost" onClick={fillRandom}>추천 4개로 채우기</button>
          <button type="submit" className="btn-main sm" disabled={busy}>만들고 링크 받기</button>
        </div>
      </form>

      <div>
        <div className="row-between"><h3 className="sec-title">내가 만들거나 들어간 팀방</h3><span className="hint">{rooms ? `${rooms.length}개` : enabled ? '불러오는 중' : ''}</span></div>
        <div className="stack">
          {rooms?.length === 0 && <p className="hint">아직 팀방이 없어요. 위에서 첫 팀방을 만들고 링크를 팀 채팅에 보내보세요.</p>}
          {rooms?.map((r) => (
            <button key={r.id} type="button" className="room-item" onClick={() => navigate(`/r/${r.id}`)}>
              <div style={{ minWidth: 0 }}><b>{r.title}</b><span>후보 {r.cands.length}개</span></div>
              <em className={`st${isClosed(r) ? ' closed' : ''}`}>{isClosed(r) ? '마감' : '투표 중'}</em>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
