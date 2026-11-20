import { useCallback, useEffect, useState } from 'react'
import { useUI } from '../../components/ui'
import { decideWinner } from '../../lib/pick'
import { navigate } from '../../lib/router'
import { copyLink } from '../../lib/share'
import { ensureUser } from '../../lib/supabase'
import { useData } from '../../state/data'
import { castVote, deleteRoom, getRoom, getVotes, isClosed, roomsEnabled, subscribeRoom, tally, updateRoom, type Room, type Vote } from './roomApi'
import { emojiOf } from './RoomPage'
import { shareRoom } from './shareRoom'

function leftText(due: string, now: number): string {
  const m = Math.max(1, Math.ceil((Date.parse(due) - now) / 60000))
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`
}

function NicknameForm({ initial, onSave }: { initial: string; onSave: (n: string) => void }) {
  const [v, setV] = useState(initial)
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onSave(v.trim().slice(0, 12)) }}>
      <div className="res-kicker">NICKNAME</div>
      <h2 className="res-title" style={{ fontSize: 26 }}>투표할 때 보일<br />이름을 정해주세요</h2>
      <input className="nick-input" autoFocus value={v} onChange={(e) => setV(e.target.value)} maxLength={12} placeholder="예: 민수" aria-label="닉네임" />
      <button type="submit" className="btn-main sm" disabled={!v.trim()}>이 이름으로 투표</button>
    </form>
  )
}

export function RoomDetail({ id }: { id: string }) {
  const { toast, openSheet, closeSheet } = useUI()
  const { nickname, setNickname, rememberRoom, setPeople } = useData()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [votes, setVotes] = useState<Vote[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [r, v] = await Promise.all([getRoom(id), getVotes(id)])
      setRoom(r)
      setVotes(v)
    } catch {
      setRoom(null)
    }
  }, [id])

  useEffect(() => {
    if (!roomsEnabled()) return
    void load()
    ensureUser().then(setMe, () => setMe(null))
    rememberRoom(id)
    const unsub = subscribeRoom(id, () => void load())
    const t = setInterval(() => setNow(Date.now()), 20000)
    return () => { unsub(); clearInterval(t) }
  }, [id, load, rememberRoom])

  if (room === undefined && roomsEnabled()) return <section className="view"><p className="hint">팀방을 불러오는 중이에요…</p></section>
  if (!room)
    return (
      <section className="view">
        <button className="backlink" type="button" onClick={() => navigate('/room')}>← 팀방 목록</button>
        <h2 className="ticket-name">팀방을 찾을 수 없어요</h2>
        <p className="hint">{roomsEnabled() ? '삭제됐거나 링크가 잘못됐을 수 있어요.' : '팀방 서버가 아직 연결되지 않았어요.'}</p>
      </section>
    )

  const { counts, names, total } = tally(room, votes)
  const closed = isClosed(room, now)
  const { win, tied } = decideWinner(counts, closed, room.winner)
  const mine = votes.find((v) => v.voter === me)?.choice ?? null
  const isOwner = me != null && room.owner === me

  async function vote(i: number, nick = nickname) {
    if (closed || busy || mine === i) return
    if (!nick) {
      return openSheet({
        content: <NicknameForm initial="" onSave={(n) => { setNickname(n); closeSheet(); void vote(i, n) }} />,
        actions: [{ label: '취소', onClick: closeSheet }],
      })
    }
    setBusy(true)
    try {
      await castVote(id, i, nick)
      await load()
    } catch {
      toast('투표하지 못했어요. 마감됐거나 연결이 불안정해요')
    } finally {
      setBusy(false)
    }
  }

  async function tieBreak() {
    const w = tied[Math.floor(Math.random() * tied.length)]
    try {
      await updateRoom(id, { winner: w })
      toast(`룰렛 결과: ${room!.cands[w]}로 결정!`)
    } catch {
      toast('결과를 저장하지 못했어요')
    }
  }

  return (
    <section className="view" aria-label="팀방">
      <button className="backlink" type="button" onClick={() => navigate('/room')}>← 팀방 목록</button>
      <div className="room-head">
        <span className="hint">
          {total}명 투표 · {closed ? '마감됨' : room.due ? `마감까지 ${leftText(room.due, now)}` : '투표 중'}
          {nickname && ` · 내 이름 ${nickname}`}
        </span>
        <h2>{room.title}</h2>
      </div>

      <div className="stack" aria-live="polite">
        {room.cands.map((c, i) => (
          <button key={c} type="button" disabled={closed || busy}
            className={`cand${mine === i ? ' mine' : ''}${win === i ? ' win' : ''}`}
            aria-label={`${c} ${counts[i]}표${mine === i ? ', 내가 고른 메뉴' : ''}`}
            onClick={() => void vote(i)}>
            <span className="fillbar" style={{ width: `${total ? (counts[i] / total) * 100 : 0}%` }} />
            <span className="em" aria-hidden="true">{emojiOf(c)}</span>
            <span style={{ minWidth: 0 }}>
              <span className="nm">
                {c}
                {mine === i && <span className="mytag">내 표</span>}
                {win === i && <span className="mytag" style={{ background: 'var(--chili)' }}>1등</span>}
              </span>
              {names[i].length > 0 && <span className="who-names">{names[i].slice(0, 5).join(', ')}{names[i].length > 5 ? ` 외 ${names[i].length - 5}명` : ''}</span>}
            </span>
            <span className="cnt">{counts[i]}표</span>
          </button>
        ))}
      </div>
      {!closed && <p className="hint">후보를 누르면 투표돼요. 다시 누르면 다른 메뉴로 바꿀 수 있어요.</p>}

      <div className="btnrow">
        <button className="btn-ghost btn-kakao" type="button" onClick={() => void shareRoom(room, toast)}>카카오톡으로 보내기</button>
        <button className="btn-ghost" type="button" onClick={async () => toast((await copyLink(`/r/${id}`)) ? '링크를 복사했어요' : '복사가 막혀 있어요')}>링크 복사</button>
      </div>

      {closed && win === null && tied.length > 1 && (
        <div className="tie">
          <span>{tied.map((i) => room.cands[i]).join(', ')} 동점이에요!</span>
          {isOwner ? <button className="btn-main sm" type="button" onClick={tieBreak}>룰렛으로 정하기</button>
            : <span className="hint">방장이 룰렛을 돌리면 결정돼요.</span>}
        </div>
      )}

      {win !== null && (
        <div className="btnrow">
          <a className="btn-ghost" target="_blank" rel="noopener" href={`https://map.kakao.com/?q=${encodeURIComponent(room.cands[win])}`}>{room.cands[win]} 식당 찾기</a>
          <button className="btn-main sm" type="button" onClick={() => {
            const ppl = [...new Set(votes.map((v) => v.nickname.slice(0, 6)))].slice(0, 10)
            if (ppl.length >= 2) { setPeople(ppl); toast(`투표한 ${ppl.length}명으로 참가자를 채웠어요`) }
            navigate('/game')
          }}>누가 쏠지 게임으로</button>
        </div>
      )}

      {isOwner && (
        <div className="btnrow">
          {!closed ? <button className="btn-ghost" type="button" onClick={() => updateRoom(id, { closed: true }).catch(() => toast('마감하지 못했어요'))}>지금 마감</button> : <span />}
          <button className="btn-ghost" type="button" onClick={() => openSheet({
            content: <><h2 className="res-title" style={{ fontSize: 26 }}>팀방을 삭제할까요?</h2><p className="res-body">투표 결과도 함께 사라지고 되돌릴 수 없어요.</p></>,
            actions: [
              { label: '취소', onClick: closeSheet },
              { label: '삭제', kind: 'main', onClick: async () => {
                closeSheet()
                try { await deleteRoom(id); navigate('/room'); toast('팀방을 삭제했어요') } catch { toast('삭제하지 못했어요') }
              } },
            ],
          })}>팀방 삭제</button>
        </div>
      )}
    </section>
  )
}
