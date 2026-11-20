import { useState, type FormEvent } from 'react'

const MAX = 50
const fresh = (n: number) => ({ lo: 1, hi: MAX, bomb: 1 + Math.floor(Math.random() * MAX), turn: Math.floor(Math.random() * n), over: false })

export function BombNumber({ people, onPayer }: { people: string[]; onPayer: (name: string, num: number) => void }) {
  const [g, setG] = useState(() => fresh(people.length))
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState<{ text: string; tone: '' | 'up' | 'down' }>({ text: '', tone: '' })
  const reset = () => { setG(fresh(people.length)); setMsg({ text: '', tone: '' }); setInput('') }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (g.over) return
    const v = parseInt(input, 10)
    if (Number.isNaN(v) || v < g.lo || v > g.hi) return setMsg({ text: `${g.lo}부터 ${g.hi} 사이 숫자를 넣어주세요`, tone: '' })
    setInput('')
    const who = people[g.turn]
    if (v === g.bomb) {
      setG({ ...g, over: true })
      setMsg({ text: `${v}! 폭탄이었어요`, tone: 'down' })
      return onPayer(who, v)
    }
    const next = v < g.bomb ? { ...g, lo: v + 1 } : { ...g, hi: v - 1 }
    setMsg({ text: `${who}: ${v} 통과. 폭탄은 더 ${v < g.bomb ? '위' : '아래'}에 있어요`, tone: v < g.bomb ? 'up' : 'down' })
    setG({ ...next, turn: (g.turn + 1) % people.length })
  }

  return (
    <div className="card game">
      <div className="bomb-turn">{g.over ? '게임 끝' : <><b>{people[g.turn]}</b> 님 차례</>}</div>
      <div className="bomb-range" aria-live="polite"><span>{g.lo}</span><span className="tilde">~</span><span>{g.hi}</span></div>
      <div className="bomb-bar"><span style={{ left: `${((g.lo - 1) / MAX) * 100}%`, width: `${((g.hi - g.lo + 1) / MAX) * 100}%` }} /></div>
      <p className="hint" style={{ textAlign: 'center' }}>이 범위 어딘가에 폭탄 숫자가 숨어 있어요. 밟은 사람이 쏩니다.</p>
      <form className="addrow" style={{ marginTop: 0 }} onSubmit={submit}>
        <input type="number" inputMode="numeric" placeholder="숫자 입력" aria-label="숫자 입력" min={g.lo} max={g.hi}
          value={input} onChange={(e) => setInput(e.target.value)} disabled={g.over} />
        <button type="submit" disabled={g.over}>찍기</button>
      </form>
      <p className={`b-msg ${msg.tone}`}>{msg.text}</p>
      <button type="button" className="btn-ghost" onClick={reset}>새 판 시작</button>
    </div>
  )
}
