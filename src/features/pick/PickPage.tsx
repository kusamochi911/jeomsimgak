import { useEffect, useMemo, useRef, useState } from 'react'
import { useUI } from '../../components/ui'
import { MENUS, menuByName } from '../../data/menus'
import { PRICE_RANGES, type Menu } from '../../data/types'
import { todayKey } from '../../lib/date'
import { filterMenus, pickRandom, placeQuery, priceLabel, type Skip } from '../../lib/pick'
import { navigate } from '../../lib/router'
import { shareResultMessage, shareToKakao } from '../../lib/share'
import { usePersistentState } from '../../lib/storage'
import { useData } from '../../state/data'
import { DEFAULT_FILTERS, Filters, summarize, type FilterState } from './Filters'
import { NearbyPlaces } from './NearbyPlaces'

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function useDaily<T extends { day: string }>(key: string, make: (day: string) => T) {
  const [raw, setRaw] = usePersistentState<T>(key, () => make(todayKey()))
  const today = todayKey()
  const value = raw.day === today ? raw : make(today)
  return [value, setRaw] as const
}

export function PickPage() {
  const { toast, openSheet, closeSheet } = useUI()
  const { recent, addRecent, logEat, setDraftCands } = useData()
  const [filters, setFilters] = usePersistentState<FilterState>('filters', DEFAULT_FILTERS)
  const [open, setOpen] = usePersistentState('filtersOpen', false)
  const [skip, setSkip] = useDaily<Skip>('skip', (day) => ({ day, names: [], cats: [] }))
  const [orderNo, setOrderNo] = usePersistentState('orderNo', 1)
  const [current, setCurrent] = useState<Menu>(() => menuByName(recent[0]?.n) ?? MENUS[0])
  const [shown, setShown] = useState<Menu>(current)
  const [rolling, setRolling] = useState(false)
  const [empty, setEmpty] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const pool = useMemo(
    () =>
      filterMenus(
        MENUS,
        { cats: filters.cats, price: PRICE_RANGES[filters.price].range, mood: filters.mood, avoid: filters.avoid },
        skip,
        filters.noRepeat ? recent.slice(0, 3).map((r) => r.n) : [],
      ),
    [filters, skip, recent],
  )

  function pick(from = pool) {
    if (rolling) return
    const choice = pickRandom(from)
    if (!choice) return setEmpty(true)
    setEmpty(false)
    setOrderNo(orderNo + 1)
    const finish = () => {
      setShown(choice)
      setCurrent(choice)
      setRolling(false)
      addRecent(choice)
    }
    if (reduceMotion()) return finish()
    setRolling(true)
    let i = 0
    const tick = () => {
      setShown(MENUS[Math.floor(Math.random() * MENUS.length)])
      i++
      if (i < 14) timer.current = window.setTimeout(tick, 30 + i * i * 0.9)
      else finish()
    }
    tick()
  }

  function notThis() {
    if (rolling) return
    const m = current
    const apply = (next: Skip) => {
      closeSheet()
      setSkip(next)
      const nextPool = filterMenus(
        MENUS,
        { cats: filters.cats, price: PRICE_RANGES[filters.price].range, mood: filters.mood, avoid: filters.avoid },
        next,
        filters.noRepeat ? recent.slice(0, 3).map((r) => r.n) : [],
      )
      pick(nextPool)
    }
    openSheet({
      content: (
        <>
          <div className="res-kicker">NOT THIS</div>
          <h2 className="res-title" style={{ fontSize: 26 }}>{m.name} 말고<br />뭐로 할까요?</h2>
          <p className="res-body">오늘 하루만 빼고 바로 다시 뽑아요. 내일이면 다시 나와요.</p>
        </>
      ),
      actions: [
        { label: `${m.name}만 빼기`, onClick: () => apply({ ...skip, names: [...new Set([...skip.names, m.name])] }) },
        { label: `${m.cat} 전부 빼기`, kind: 'main', onClick: () => apply({ ...skip, cats: [...new Set([...skip.cats, m.cat])] }) },
      ],
    })
  }

  async function share() {
    const r = await shareToKakao({
      title: `오늘 점심 ${current.name} 어때요? ${current.emoji}`,
      description: `${current.desc} · ${priceLabel(current)} (서울 기준)`,
      path: '/',
      buttonTitle: '나도 메뉴 뽑기',
      fallbackText: `[점심각] 오늘 점심 ${current.name} 어때요? ${current.emoji}\n${current.desc} · ${priceLabel(current)} (서울 기준)`,
    })
    toast(shareResultMessage(r))
  }

  const q = placeQuery(filters.area, shown.name)

  return (
    <section className="view" aria-label="메뉴 추천">
      <h1 className="headline">오늘 점심,<br /><em>뭐 먹지?</em></h1>

      <button type="button" className="fsum" aria-expanded={open} aria-controls="filters" onClick={() => setOpen(!open)}>
        <span>{summarize(filters, skip)}</span>
        <span className="fsum-cta">{open ? '접기 ▴' : '조건 바꾸기 ▾'}</span>
      </button>
      {open && <Filters value={filters} onChange={setFilters} skip={skip} onResetSkip={() => { setSkip({ day: todayKey(), names: [], cats: [] }); toast('오늘 뺀 메뉴를 되돌렸어요') }} />}

      <article className={`ticket${rolling ? ' rolling' : ''}`} aria-live="polite" aria-busy={rolling}>
        <div className="ticket-head"><span>LUNCH ORDER</span><span>No. {String(orderNo).padStart(4, '0')}</span></div>
        {empty ? (
          <p className="empty-note">이 조건에 맞는 메뉴가 없어요. 조건 바꾸기에서 하나를 풀거나, 오늘 뺀 메뉴를 되돌려 보세요.</p>
        ) : (
          <>
            <div className="ticket-body">
              <div className="plate" aria-hidden="true">{shown.emoji}</div>
              <div style={{ minWidth: 0 }}>
                <div className="ticket-cat">{shown.cat}</div>
                <h2 className="ticket-name">{shown.name}</h2>
                <p className="ticket-desc">{shown.desc}</p>
              </div>
            </div>
            <dl className="ticket-meta">
              <div><dt>예상 가격 · 서울 1인</dt><dd>{priceLabel(shown)}</dd></div>
              <div><dt>이럴 때</dt><dd>{shown.tags.slice(0, 2).join(' · ')}</dd></div>
            </dl>
          </>
        )}
        <div className="tear" aria-hidden="true" />
        {!empty && (
          <>
            <div className="ticket-loc">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
              <span>{filters.area ? <><b>{filters.area}</b> 근처에서 </> : '지도에서 '}<b>{shown.name}</b> 찾기</span>
            </div>
            <div className="ticket-actions four">
              <a className="btn-ghost" href={`https://map.kakao.com/?q=${encodeURIComponent(q)}`} target="_blank" rel="noopener">카카오맵</a>
              <a className="btn-ghost" href={`https://map.naver.com/p/search/${encodeURIComponent(q)}`} target="_blank" rel="noopener">네이버지도</a>
              <button type="button" className="btn-ghost" onClick={() => {
                setDraftCands((prev) => [current.name, ...prev.filter((x) => x !== current.name)].slice(0, 6))
                navigate('/room')
                toast(`${current.name}을(를) 투표 후보에 올렸어요`)
              }}>팀 투표에 올리기</button>
              <button type="button" className="btn-ghost" onClick={share}>공유하기</button>
            </div>
          </>
        )}
      </article>

      <div className="pickrow">
        <button type="button" className="btn-ghost" onClick={notThis} disabled={empty}>이거 말고</button>
        <button type="button" className="btn-main" onClick={() => pick()}>
          메뉴 뽑기
        </button>
      </div>
      {!empty && (
        <button type="button" className="btn-ghost btn-wide" onClick={() =>
          toast(logEat(current) ? `${current.name} 기록했어요. 기록 탭에서 볼 수 있어요` : '오늘 이미 기록한 메뉴예요')
        }>오늘 이걸로 먹었어요 · 기록하기</button>
      )}

      {!empty && <NearbyPlaces key={`${current.name}|${filters.area ?? ''}`} menu={current} area={filters.area} />}

      <div>
        <div className="row-between"><h3 className="sec-title">최근 뽑은 메뉴</h3><span className="hint">이 기기에만 저장</span></div>
        <div className="chips">
          {recent.length ? recent.slice(0, 6).map((r) => <span key={r.n} className="chip static">{r.e} {r.n}</span>)
            : <span className="hint">아직 뽑은 메뉴가 없어요. 위에서 첫 메뉴를 뽑아보세요.</span>}
        </div>
      </div>
    </section>
  )
}
