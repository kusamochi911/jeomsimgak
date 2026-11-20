import { useMemo } from 'react'
import { MENUS } from '../../data/menus'
import { daysAgoKey, formatWon, shortDate, todayKey, weekdaysBack } from '../../lib/date'
import { priceMid } from '../../lib/pick'
import { useData, type EatLog, type PayLog } from '../../state/data'

/** 기록이 하나도 없을 때 보여줄 예시. 화면에 '예시'로 표시 */
function sample(): { eats: EatLog[]; pays: PayLog[] } {
  const days = weekdaysBack(15).slice(0, 14)
  const names = ['김치찌개', '돈카츠', '쌀국수', null, '제육볶음', '김치찌개', '샐러드볼', '짬뽕', '순대국밥', null, '카레라이스', '돈카츠', '비빔밥', '마라탕']
  const eats: EatLog[] = []
  days.forEach((d, i) => {
    const m = MENUS.find((x) => x.name === names[i])
    if (m) eats.unshift({ n: m.name, c: m.cat, p: priceMid(m), e: m.emoji, d })
  })
  const pays = ['민수', '지영', '민수', '현우', '서연', '민수', '지영'].map((n, i) => ({ n, g: 'ROULETTE', d: days[i * 2] }))
  return { eats, pays }
}

const countBy = <T,>(list: T[], key: (x: T) => string) =>
  Object.entries(list.reduce<Record<string, number>>((acc, x) => ({ ...acc, [key(x)]: (acc[key(x)] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])

export function StatsPage() {
  const { eats, pays, removeEat } = useData()
  const isExample = !eats.length && !pays.length
  const ex = useMemo(() => sample(), [])
  const E = isExample ? ex.eats : eats
  const P = isExample ? ex.pays : pays

  const cut = daysAgoKey(30)
  const recent30 = E.filter((e) => e.d >= cut)
  const total = recent30.reduce((a, e) => a + e.p, 0)
  const cats = countBy(recent30, (e) => e.c)
  const maxCat = Math.max(1, ...cats.map((c) => c[1]))
  const top = countBy(E, (e) => e.n).slice(0, 5)
  const payers = countBy(P, (p) => p.n).slice(0, 5)
  const today = todayKey()

  return (
    <section className="view" aria-label="점심 기록">
      <h1 className="headline">나의<br /><em>점심 기록</em></h1>
      <p className="sub">먹은 메뉴와 게임 결과가 이 기기에 쌓입니다.</p>
      {isExample && (
        <div className="notice"><span className="example-badge">예시</span> 아직 기록이 없어 예시 데이터를 보여드려요. 첫 기록을 남기면 내 기록으로 바뀝니다.</div>
      )}

      <dl className="kpis">
        {[['최근 30일', `${recent30.length}회`], ['예상 지출', `${formatWon(total)}원`], ['1끼 평균', recent30.length ? `${formatWon(Math.round(total / recent30.length / 100) * 100)}원` : '-']].map(([k, v]) => (
          <div className="kpi" key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="card stack">
        <div className="row-between" style={{ margin: 0 }}><h3 className="sec-title">최근 2주 평일</h3><span className="hint">월~금</span></div>
        <div className="days">
          {weekdaysBack(10).map((d) => {
            const hit = E.find((e) => e.d === d)
            return (
              <div key={d} className={`day${d === today ? ' today' : ''}`} title={hit ? `${d} ${hit.n}` : d}>
                {hit?.e}
                <small>{shortDate(d)}</small>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card stack">
        <h3 className="sec-title">종류별</h3>
        <div className="bars">
          {cats.length ? cats.map(([c, n]) => (
            <div className="bar" key={c}>
              <span>{c}</span>
              <span className="track"><i style={{ width: `${(n / maxCat) * 100}%` }} /></span>
              <span className="v">{n}회 · {Math.round((n / recent30.length) * 100)}%</span>
            </div>
          )) : <p className="hint">최근 30일 기록이 없어요.</p>}
        </div>
      </div>

      <div className="card stack">
        <h3 className="sec-title">자주 먹은 메뉴</h3>
        <ol className="rank" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {top.length ? top.map(([n, c]) => (
            <li key={n}><span>{E.find((e) => e.n === n)?.e} {n}</span><b>{c}회</b></li>
          )) : <li><span className="hint">아직 기록이 없어요</span></li>}
        </ol>
      </div>

      <div className="card stack">
        <div className="row-between" style={{ margin: 0 }}><h3 className="sec-title">누가 많이 쐈나</h3><span className="hint">게임 결과 기준</span></div>
        <ol className="rank" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {payers.length ? payers.map(([n, c], i) => <li key={n}><span>{i + 1}. {n}</span><b>{c}번</b></li>)
            : <li><span className="hint">게임 결과가 아직 없어요. 누가 쏠까 탭에서 한 판 해보세요</span></li>}
        </ol>
      </div>

      <div className="card stack">
        <div className="row-between" style={{ margin: 0 }}><h3 className="sec-title">기록 목록</h3><span className="hint">이 기기에만 저장</span></div>
        <ol className="rank loglist" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {E.length ? E.slice(0, 10).map((e, i) => (
            <li key={`${e.d}-${e.n}`}>
              <span>{shortDate(e.d)}  {e.e} {e.n}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <b>{formatWon(e.p)}원</b>
                {!isExample && <button type="button" className="x" aria-label={`${e.n} 기록 삭제`} onClick={() => removeEat(i)}>✕</button>}
              </span>
            </li>
          )) : <li><span className="hint">추천 탭에서 '오늘 이걸로 먹었어요'를 누르면 쌓여요</span></li>}
        </ol>
      </div>
    </section>
  )
}
