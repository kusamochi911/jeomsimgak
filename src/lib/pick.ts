import type { Avoid, Category, Menu, Mood } from '../data/types'
import { formatWon } from './date'

export interface PickFilters {
  cats: Category[]
  price: readonly [number, number]
  mood: Mood | null
  avoid: Avoid[]
}

/** 오늘 하루만 빼는 메뉴·종류 ('이거 말고') */
export interface Skip {
  day: string
  names: string[]
  cats: Category[]
}

/** 메뉴 가격대가 예산 구간과 조금이라도 겹치면 후보 */
export const priceOverlaps = (m: Menu, [min, max]: readonly [number, number]): boolean =>
  m.price[0] <= max && m.price[1] >= min

export function filterMenus(
  menus: Menu[],
  f: PickFilters,
  skip: Skip | null,
  recentNames: string[] = [],
): Menu[] {
  const base = menus.filter(
    (m) =>
      (f.cats.length === 0 || f.cats.includes(m.cat)) &&
      priceOverlaps(m, f.price) &&
      (!f.mood || m.tags.includes(f.mood)) &&
      !m.avoid.some((a) => f.avoid.includes(a)) &&
      !(skip?.names.includes(m.name) ?? false) &&
      !(skip?.cats.includes(m.cat) ?? false),
  )
  // 최근 메뉴 빼기는 '부드러운' 조건: 다 빠지면 무시
  if (recentNames.length) {
    const fresh = base.filter((m) => !recentNames.includes(m.name))
    if (fresh.length) return fresh
  }
  return base
}

export const pickRandom = <T,>(arr: readonly T[], rand: () => number = Math.random): T | undefined =>
  arr.length ? arr[Math.floor(rand() * arr.length)] : undefined

export const priceLabel = (m: Menu): string => `${formatWon(m.price[0])}~${formatWon(m.price[1])}원`

export const priceMid = (m: Menu): number => Math.round((m.price[0] + m.price[1]) / 2)

/** 지도 검색어: 동네가 있으면 '여의도 김치찌개' */
export const placeQuery = (area: string | null, name: string): string => (area ? `${area} ${name}` : name)

/** 투표 집계 결과에서 1등 결정. 동점이면 winner(룰렛 결과)가 있어야 확정 */
export function decideWinner(
  counts: number[],
  closed: boolean,
  winner: number | null | undefined,
): { win: number | null; tied: number[] } {
  const total = counts.reduce((a, b) => a + b, 0)
  if (!total) return { win: null, tied: [] }
  const top = Math.max(...counts)
  const tied = counts.flatMap((c, i) => (c === top ? [i] : []))
  if (!closed) return { win: null, tied }
  if (typeof winner === 'number') return { win: winner, tied }
  return { win: tied.length === 1 ? tied[0] : null, tied }
}
