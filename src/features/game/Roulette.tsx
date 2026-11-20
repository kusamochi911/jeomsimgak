import { useCallback, useRef, useState } from 'react'
import { cssVar, reduceMotion, sizeCanvas, useRedraw } from './canvas'

const TWO = Math.PI * 2

export function Roulette({ people, onResult }: { people: string[]; onResult: (name: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rot = useRef(0)
  const [spinning, setSpinning] = useState(false)

  const draw = useCallback(() => {
    const c = ref.current
    if (!c?.parentElement) return
    const S = Math.min(c.parentElement.clientWidth, 300)
    const ctx = sizeCanvas(c, S, S)
    const R = S / 2 - 4, cx = S / 2, n = people.length, seg = TWO / n
    const cols = [cssVar('--yolk'), cssVar('--surface-2'), cssVar('--yolk-soft')]
    for (let i = 0; i < n; i++) {
      // 첫 칸과 마지막 칸 색이 겹치지 않게
      const ci = n % 3 === 1 && i === n - 1 ? 1 : i % 3
      ctx.beginPath()
      ctx.moveTo(cx, cx)
      ctx.arc(cx, cx, R, rot.current + i * seg, rot.current + (i + 1) * seg)
      ctx.closePath()
      ctx.fillStyle = cols[ci]
      ctx.fill()
      ctx.strokeStyle = cssVar('--surface')
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.save()
      ctx.translate(cx, cx)
      ctx.rotate(rot.current + (i + 0.5) * seg)
      ctx.fillStyle = cssVar('--ink')
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${n > 7 ? 13 : 15}px "Noto Sans KR",sans-serif`
      ctx.fillText(people[i], R - 14, 0)
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(cx, cx, R, 0, TWO)
    ctx.strokeStyle = cssVar('--line')
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cx, 26, 0, TWO)
    ctx.fillStyle = cssVar('--surface')
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = cssVar('--ink')
    ctx.font = '18px "Black Han Sans",sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('쏠까', cx, cx + 1)
  }, [people])
  useRedraw(draw)

  function spin() {
    if (spinning) return
    setSpinning(true)
    const n = people.length, seg = TWO / n
    const win = Math.floor(Math.random() * n)
    // 바늘은 12시 방향(1.5π). 당첨 칸 안쪽 임의 지점이 바늘에 오도록 목표 각도 계산
    const a = (win + 0.15 + Math.random() * 0.7) * seg
    const target = (((1.5 * Math.PI - a) % TWO) + TWO) % TWO
    const cur = ((rot.current % TWO) + TWO) % TWO
    let delta = target - cur
    if (delta < 0) delta += TWO
    const from = rot.current
    const to = from + delta + TWO * (reduceMotion() ? 0 : 6)
    const dur = reduceMotion() ? 10 : 4200
    const t0 = performance.now()
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      rot.current = from + (to - from) * (1 - Math.pow(1 - p, 4))
      draw()
      if (p < 1) requestAnimationFrame(frame)
      else {
        rot.current = to % TWO
        setSpinning(false)
        setTimeout(() => onResult(people[win]), 250)
      }
    }
    requestAnimationFrame(frame)
  }

  return (
    <div className="card game">
      <p className="hint">바늘이 멈춘 칸의 사람이 점심을 삽니다.</p>
      <div className="wheelwrap">
        <div className="pointer" aria-hidden="true" />
        <canvas ref={ref} aria-label={`룰렛: ${people.join(', ')}`} />
      </div>
      <button type="button" className="btn-main" onClick={spin} disabled={spinning}>룰렛 돌리기</button>
    </div>
  )
}
