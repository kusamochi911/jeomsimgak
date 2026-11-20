import { useCallback, useRef, useState, type ReactNode } from 'react'
import { PLAYER_COLORS, cssVar, reduceMotion, sizeCanvas, useRedraw } from './canvas'

interface LadderData {
  n: number
  rows: number
  rungs: boolean[][]
  results: string[]
  names: string[]
}

export function makeLadder(names: string[], rand: () => number = Math.random): LadderData {
  const n = names.length
  const rows = Math.max(8, n + 4)
  const rungs = Array.from({ length: rows }, () => Array<boolean>(n - 1).fill(false))
  for (let r = 0; r < rows; r++)
    for (let j = 0; j < n - 1; j++) if (!(j > 0 && rungs[r][j - 1]) && rand() < 0.42) rungs[r][j] = true
  // 모든 칸 사이에 가로줄이 최소 하나는 있게
  for (let j = 0; j < n - 1; j++) {
    if (rungs.some((row) => row[j])) continue
    for (let k = 0; k < 50; k++) {
      const r = Math.floor(rand() * rows)
      if (!(j > 0 && rungs[r][j - 1]) && !(j < n - 2 && rungs[r][j + 1])) {
        rungs[r][j] = true
        break
      }
    }
  }
  const results = Array<string>(n).fill('통과')
  const order = [...Array(n).keys()].sort(() => rand() - 0.5)
  results[order[0]] = '점심 쏘기'
  if (n >= 4) results[order[1]] = '커피 쏘기'
  return { n, rows, rungs, results, names: [...names] }
}

/** 사다리를 따라 내려간 도착 칸 */
export function endColumn(l: LadderData, start: number): number {
  let c = start
  for (let r = 0; r < l.rows; r++) {
    if (c > 0 && l.rungs[r][c - 1]) c--
    else if (c < l.n - 1 && l.rungs[r][c]) c++
  }
  return c
}

export function Ladder({ people, onPayer, onToast, onSummary }: {
  people: string[]
  onPayer: (name: string) => void
  onToast: (msg: string) => void
  onSummary: (payer: string, list: ReactNode) => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  // 참가자가 바뀌면 부모가 key를 바꿔 새 사다리로 다시 만든다
  const [lad, setLad] = useState(() => makeLadder(people))
  const prog = useRef<Record<number, number>>({})

  const geo = useCallback(() => {
    const c = ref.current!
    const W = c.parentElement!.clientWidth - 36
    const H = Math.max(340, lad.rows * 30 + 110)
    const pad = Math.max(26, W / (lad.n * 2))
    const gap = (W - 2 * pad) / Math.max(1, lad.n - 1)
    const y0 = 50, y1 = H - 50
    return { c, W, H, y0, y1, gap, X: (i: number) => pad + i * gap, Y: (r: number) => y0 + ((r + 1) * (y1 - y0)) / (lad.rows + 1) }
  }, [lad])

  const path = useCallback((i: number) => {
    const g = geo()
    let c = i
    const pts: [number, number][] = [[g.X(c), g.y0]]
    for (let r = 0; r < lad.rows; r++) {
      const y = g.Y(r)
      if (c > 0 && lad.rungs[r][c - 1]) { pts.push([g.X(c), y], [g.X(c - 1), y]); c-- }
      else if (c < lad.n - 1 && lad.rungs[r][c]) { pts.push([g.X(c), y], [g.X(c + 1), y]); c++ }
    }
    pts.push([g.X(c), g.y1])
    return pts
  }, [geo, lad])

  const draw = useCallback(() => {
    if (!ref.current?.parentElement) return
    const g = geo()
    const ctx = sizeCanvas(g.c, g.W, g.H)
    const n = lad.n
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = cssVar('--line')
    ctx.lineWidth = 3
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(g.X(i), g.y0); ctx.lineTo(g.X(i), g.y1); ctx.stroke() }
    for (let r = 0; r < lad.rows; r++) for (let j = 0; j < n - 1; j++) if (lad.rungs[r][j]) {
      ctx.beginPath(); ctx.moveTo(g.X(j), g.Y(r)); ctx.lineTo(g.X(j + 1), g.Y(r)); ctx.stroke()
    }
    const ends: Record<number, number> = {}
    for (const [k, p] of Object.entries(prog.current)) {
      const i = +k
      const pts = path(i)
      const lens = pts.slice(1).map((pt, j) => Math.hypot(pt[0] - pts[j][0], pt[1] - pts[j][1]))
      let left = lens.reduce((a, b) => a + b, 0) * p
      ctx.strokeStyle = PLAYER_COLORS[i % PLAYER_COLORS.length]
      ctx.lineWidth = 4.5
      ctx.beginPath()
      ctx.moveTo(...pts[0])
      for (let j = 1; j < pts.length && left > 0; j++) {
        const t = Math.min(1, left / lens[j - 1])
        ctx.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t)
        left -= lens[j - 1]
      }
      ctx.stroke()
      if (p >= 1) ends[endColumn(lad, i)] = i
    }
    const w = Math.min(68, g.gap - 6), fs = w < 52 ? 11 : 13
    const pill = (x: number, y: number, fill: string, stroke: string | null, text: string, tc: string) => {
      ctx.beginPath()
      ctx.roundRect(x - w / 2, y - 15, w, 30, 15)
      ctx.fillStyle = fill
      ctx.fill()
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke() }
      ctx.fillStyle = tc
      ctx.font = `700 ${fs}px "Noto Sans KR",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, x, y + 1)
    }
    for (let i = 0; i < n; i++) {
      const col = PLAYER_COLORS[i % PLAYER_COLORS.length]
      const traced = i in prog.current
      pill(g.X(i), 24, traced ? col : cssVar('--surface'), col, lad.names[i], traced ? '#fff' : cssVar('--ink'))
      const shown = ends[i] !== undefined
      const r = lad.results[i]
      const hot = r !== '통과'
      pill(g.X(i), g.H - 24, shown && hot ? cssVar('--chili') : cssVar('--surface-2'), shown ? null : cssVar('--line'),
        shown ? (w < 52 ? r.replace(' 쏘기', '') : r) : '?', shown && hot ? '#fff' : cssVar('--muted'))
    }
  }, [geo, lad, path])
  useRedraw(draw)

  function trace(i: number, silent = false): Promise<void> {
    return new Promise((resolve) => {
      if (i in prog.current) return resolve()
      const t0 = performance.now(), dur = reduceMotion() ? 10 : 1300
      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        prog.current[i] = p
        draw()
        if (p < 1) return void requestAnimationFrame(frame)
        const r = lad.results[endColumn(lad, i)]
        if (!silent) {
          if (r === '점심 쏘기') onPayer(lad.names[i])
          else onToast(`${lad.names[i]}: ${r}`)
        }
        resolve()
      }
      requestAnimationFrame(frame)
    })
  }

  async function revealAll() {
    await Promise.all(lad.names.map((_, i) => trace(i, true)))
    const rows = lad.names
      .map((n, i) => ({ n, r: lad.results[endColumn(lad, i)] }))
      .sort((a, b) => Number(a.r === '통과') - Number(b.r === '통과'))
    const payer = rows.find((x) => x.r === '점심 쏘기')!
    onSummary(payer.n, (
      <ul className="res-list">
        {rows.map((x) => <li key={x.n} className={x.r !== '통과' ? 'hot' : ''}><span>{x.n}</span><span>{x.r}</span></li>)}
      </ul>
    ))
  }

  return (
    <div className="card game">
      <p className="hint">위쪽 이름을 누르면 길을 따라 내려갑니다. 점심 1명, 커피 1명(4명 이상).</p>
      <canvas
        ref={ref}
        id="ladder"
        aria-label="사다리. 위쪽 이름을 눌러 결과 확인"
        onClick={(e) => {
          const g = geo()
          const rect = g.c.getBoundingClientRect()
          const x = e.clientX - rect.left, y = e.clientY - rect.top
          if (y > g.y0 + 10) return
          let best = 0
          for (let i = 1; i < lad.n; i++) if (Math.abs(g.X(i) - x) < Math.abs(g.X(best) - x)) best = i
          void trace(best)
        }}
      />
      <div className="btnrow">
        <button type="button" className="btn-ghost" onClick={() => { prog.current = {}; setLad(makeLadder(people)) }}>새 사다리</button>
        <button type="button" className="btn-main sm" onClick={revealAll}>전체 결과 보기</button>
      </div>
    </div>
  )
}
