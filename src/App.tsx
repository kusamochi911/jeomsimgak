import { useEffect } from 'react'
import { UIProvider, useUI } from './components/ui'
import { menuByName } from './data/menus'
import { GamePage } from './features/game/GamePage'
import { PickPage } from './features/pick/PickPage'
import { RoomDetail } from './features/room/RoomDetail'
import { RoomPage } from './features/room/RoomPage'
import { StatsPage } from './features/stats/StatsPage'
import { config } from './lib/config'
import { daysAgoKey, shortDate, todayKey } from './lib/date'
import { navigate, usePath } from './lib/router'
import { preloadKakao } from './lib/share'
import { readStore, writeStore } from './lib/storage'
import { DataProvider, useData } from './state/data'

const TABS = [
  { path: '/', label: '추천', icon: <><circle className="fill" cx="12" cy="13" r="7" fill="none" /><path d="M3 13h2M19 13h2M12 3v3" /></> },
  { path: '/room', label: '팀방', icon: <><path className="fill" d="M4 5h16v11H9l-5 4z" fill="none" /><path d="M9 10.5l2 2 4-4" /></> },
  { path: '/game', label: '누가 쏠까', icon: <><rect className="fill" x="4" y="4" width="16" height="16" rx="4" fill="none" /><circle cx="9" cy="9" r="1.2" fill="currentColor" /><circle cx="15" cy="15" r="1.2" fill="currentColor" /><circle cx="15" cy="9" r="1.2" fill="currentColor" /><circle cx="9" cy="15" r="1.2" fill="currentColor" /></> },
  { path: '/stats', label: '기록', icon: <><rect className="fill" x="4" y="11" width="4" height="9" rx="1" fill="none" /><rect x="10" y="6" width="4" height="14" rx="1" /><rect x="16" y="13" width="4" height="7" rx="1" /></> },
]

/** 다음 날 처음 열면 "어제 뽑은 메뉴 드셨나요?"로 기록을 자동으로 쌓는다 */
function useYesterdayPrompt(enabled: boolean) {
  const { recent, eats, logEat } = useData()
  const { openSheet, closeSheet, toast } = useUI()
  useEffect(() => {
    if (!enabled) return
    const cand = recent.find((r) => r.d < todayKey() && r.d >= daysAgoKey(3))
    if (!cand || readStore('asked', '') === cand.d || eats.some((e) => e.d === cand.d)) return
    const m = menuByName(cand.n)
    if (!m) return
    writeStore('asked', cand.d)
    const when = cand.d === daysAgoKey(1) ? '어제' : `${shortDate(cand.d)}에`
    const t = setTimeout(() => openSheet({
      content: (
        <>
          <div className="res-kicker">LUNCH LOG</div>
          <div className="plate" style={{ margin: '0 auto' }} aria-hidden="true">{m.emoji}</div>
          <h2 className="res-title" style={{ fontSize: 26 }}>{when} 뽑은 <mark>{m.name}</mark><br />드셨나요?</h2>
          <p className="res-body">기록해두면 통계에 쌓이고, 비슷한 메뉴가 연달아 나오지 않게 도와줘요.</p>
        </>
      ),
      actions: [
        { label: '아니요', onClick: closeSheet },
        { label: '네, 기록할게요', kind: 'main', onClick: () => { closeSheet(); if (logEat(m, cand.d)) toast(`${m.name} 기록했어요`) } },
      ],
    }), 600)
    return () => clearTimeout(t)
    // 앱을 열 때 한 번만 확인
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}

function Shell() {
  const path = usePath()
  useEffect(preloadKakao, [])
  useYesterdayPrompt(path === '/')

  let page
  if (path.startsWith('/r/')) page = <RoomDetail key={path} id={path.slice(3)} />
  else if (path === '/room') page = <RoomPage />
  else if (path === '/game') page = <GamePage />
  else if (path === '/stats') page = <StatsPage />
  else page = <PickPage />
  const current = path.startsWith('/r/') ? '/room' : TABS.some((t) => t.path === path) ? path : '/'
  const d = new Date()

  return (
    <>
      <div className="app">
        {!config.inToss && (
          <header className="top">
            <div className="logo"><i aria-hidden="true" />점심각</div>
            <span className="date">{d.getMonth() + 1}월 {d.getDate()}일 ({'일월화수목금토'[d.getDay()]})</span>
          </header>
        )}
        <main>{page}</main>
      </div>
      <nav className="tabs" aria-label="하단 메뉴">
        <div className="tabs-in">
          {TABS.map((t) => (
            <button key={t.path} type="button" aria-current={current === t.path ? 'page' : undefined} onClick={() => navigate(t.path)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{t.icon}</svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

export default function App() {
  return (
    <UIProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </UIProvider>
  )
}
