import { createContext, useCallback, useContext, type ReactNode } from 'react'
import type { Category, Menu } from '../data/types'
import { todayKey } from '../lib/date'
import { priceMid } from '../lib/pick'
import { usePersistentState } from '../lib/storage'

export interface EatLog {
  n: string
  c: Category
  p: number
  e: string
  d: string
}
export interface PayLog {
  n: string
  g: string
  d: string
}
export interface RecentPick {
  n: string
  e: string
  d: string
}

interface Data {
  eats: EatLog[]
  pays: PayLog[]
  recent: RecentPick[]
  people: string[]
  draftCands: string[]
  myRooms: string[]
  nickname: string
  /** 기록 성공 시 true, 이미 있으면 false */
  logEat: (m: Menu, day?: string) => boolean
  removeEat: (index: number) => void
  addPayer: (name: string, game: string) => void
  addRecent: (m: Menu) => void
  setPeople: (p: string[]) => void
  setDraftCands: (c: string[] | ((prev: string[]) => string[])) => void
  rememberRoom: (id: string) => void
  setNickname: (n: string) => void
}

const DataCtx = createContext<Data | null>(null)

export function useData(): Data {
  const d = useContext(DataCtx)
  if (!d) throw new Error('useData must be used inside <DataProvider>')
  return d
}

const byDateDesc = (a: { d: string }, b: { d: string }) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)

export function DataProvider({ children }: { children: ReactNode }) {
  const [eats, setEats] = usePersistentState<EatLog[]>('eats', [])
  const [pays, setPays] = usePersistentState<PayLog[]>('pays', [])
  const [recent, setRecent] = usePersistentState<RecentPick[]>('recent', [])
  const [people, setPeople] = usePersistentState<string[]>('people', ['민수', '지영', '현우', '서연'])
  const [draftCands, setDraftCands] = usePersistentState<string[]>('draft', [])
  const [myRooms, setMyRooms] = usePersistentState<string[]>('myRooms', [])
  const [nickname, setNickname] = usePersistentState<string>('nick', '')

  const logEat = useCallback(
    (m: Menu, d = todayKey()) => {
      if (eats.some((e) => e.d === d && e.n === m.name)) return false
      setEats([{ n: m.name, c: m.cat, p: priceMid(m), e: m.emoji, d }, ...eats].sort(byDateDesc).slice(0, 300))
      return true
    },
    [eats, setEats],
  )
  const removeEat = useCallback((i: number) => setEats((prev) => prev.filter((_, k) => k !== i)), [setEats])
  const addPayer = useCallback(
    (n: string, g: string) => setPays((prev) => [{ n, g, d: todayKey() }, ...prev].slice(0, 300)),
    [setPays],
  )
  const addRecent = useCallback(
    (m: Menu) => setRecent((prev) => [{ n: m.name, e: m.emoji, d: todayKey() }, ...prev.filter((x) => x.n !== m.name)].slice(0, 10)),
    [setRecent],
  )
  const rememberRoom = useCallback(
    (id: string) => setMyRooms((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 30)),
    [setMyRooms],
  )

  return (
    <DataCtx.Provider
      value={{
        eats, pays, recent, people, draftCands, myRooms, nickname,
        logEat, removeEat, addPayer, addRecent, setPeople, setDraftCands, rememberRoom, setNickname,
      }}
    >
      {children}
    </DataCtx.Provider>
  )
}
