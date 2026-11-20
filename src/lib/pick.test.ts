import { describe, expect, it } from 'vitest'
import { MENUS } from '../data/menus'
import { PRICE_RANGES } from '../data/types'
import { decideWinner, filterMenus, placeQuery, priceOverlaps, type PickFilters } from './pick'

const any: PickFilters = { cats: [], price: PRICE_RANGES.any.range, mood: null, avoid: [] }

describe('filterMenus', () => {
  it('returns everything with no filters', () => {
    expect(filterMenus(MENUS, any, null)).toHaveLength(MENUS.length)
  })

  it('filters by category and mood', () => {
    const out = filterMenus(MENUS, { ...any, cats: ['중식'], mood: '해장' }, null)
    expect(out.length).toBeGreaterThan(0)
    expect(out.every((m) => m.cat === '중식' && m.tags.includes('해장'))).toBe(true)
  })

  it('removes menus with avoided ingredients', () => {
    const out = filterMenus(MENUS, { ...any, avoid: ['매운 것', '해산물'] }, null)
    expect(out.some((m) => m.name === '짬뽕')).toBe(false)
    expect(out.every((m) => !m.avoid.includes('매운 것') && !m.avoid.includes('해산물'))).toBe(true)
  })

  it('applies today-only skips by name and category', () => {
    const skip = { day: '2026-11-20', names: ['김치찌개'], cats: ['일식' as const] }
    const out = filterMenus(MENUS, any, skip)
    expect(out.some((m) => m.name === '김치찌개' || m.cat === '일식')).toBe(false)
  })

  it('drops recent menus but falls back when nothing else is left', () => {
    const onlyJjajang = { ...any, cats: ['중식' as const], mood: '혼밥' as const }
    const all = filterMenus(MENUS, onlyJjajang, null)
    const names = all.map((m) => m.name)
    expect(filterMenus(MENUS, onlyJjajang, null, names)).toEqual(all)
    expect(filterMenus(MENUS, onlyJjajang, null, [names[0]]).map((m) => m.name)).not.toContain(names[0])
  })

  it('every price bucket has candidates', () => {
    for (const { range } of Object.values(PRICE_RANGES)) {
      expect(MENUS.filter((m) => priceOverlaps(m, range)).length).toBeGreaterThan(5)
    }
  })
})

describe('decideWinner', () => {
  it('no winner while open', () => expect(decideWinner([2, 1], false, null).win).toBeNull())
  it('clear winner when closed', () => expect(decideWinner([1, 3, 0], true, null).win).toBe(1))
  it('tie needs a tie-break', () => {
    expect(decideWinner([2, 2, 0], true, null)).toEqual({ win: null, tied: [0, 1] })
    expect(decideWinner([2, 2, 0], true, 1).win).toBe(1)
  })
  it('no votes, no winner', () => expect(decideWinner([0, 0], true, null).win).toBeNull())
})

it('placeQuery', () => {
  expect(placeQuery(null, '김치찌개')).toBe('김치찌개')
  expect(placeQuery('여의도', '김치찌개')).toBe('여의도 김치찌개')
})
