import { useState } from 'react'
import { Chip } from '../../components/ui'
import { AREAS, AVOIDS, CATEGORIES, MOODS, PRICE_RANGES, type Avoid, type Category, type Mood, type PriceKey } from '../../data/types'
import type { Skip } from '../../lib/pick'

export interface FilterState {
  cats: Category[]
  price: PriceKey
  mood: Mood | null
  avoid: Avoid[]
  area: string | null
  noRepeat: boolean
}

export const DEFAULT_FILTERS: FilterState = { cats: [], price: 'any', mood: null, avoid: [], area: null, noRepeat: true }

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function summarize(f: FilterState, skip: Skip): string {
  const parts = [f.cats.length ? f.cats.join('·') : '모든 종류', f.price === 'any' ? '예산 상관없음' : PRICE_RANGES[f.price].label]
  if (f.mood) parts.push(f.mood)
  if (f.area) parts.push(f.area)
  if (f.avoid.length) parts.push(`${f.avoid.join('·')} 빼고`)
  const skipped = skip.cats.length + skip.names.length
  if (skipped) parts.push(`오늘 ${skipped}개 뺌`)
  return parts.join(' · ')
}

export function Filters({ value, onChange, skip, onResetSkip }: {
  value: FilterState
  onChange: (f: FilterState) => void
  skip: Skip
  onResetSkip: () => void
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })
  const custom = value.area && !(AREAS as readonly string[]).includes(value.area) ? value.area : ''
  const [areaText, setAreaText] = useState(custom)
  const skipped = [...skip.cats.map((c) => `${c} 전부`), ...skip.names]

  return (
    <div className="filters" id="filters">
      <div className="fgroup">
        <span className="flabel">종류</span>
        <div className="chips">
          <Chip pressed={!value.cats.length} onClick={() => set({ cats: [] })}>전체</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} pressed={value.cats.includes(c)} onClick={() => {
              const next = toggle(value.cats, c)
              set({ cats: next.length === CATEGORIES.length ? [] : next })
            }}>{c}</Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <span className="flabel">예산</span>
        <div className="chips">
          {(Object.keys(PRICE_RANGES) as PriceKey[]).map((k) => (
            <Chip key={k} pressed={value.price === k} onClick={() => set({ price: k })}>{PRICE_RANGES[k].label}</Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <span className="flabel">상황</span>
        <div className="chips">
          <Chip pressed={!value.mood} onClick={() => set({ mood: null })}>아무거나</Chip>
          {MOODS.map((m) => (
            <Chip key={m} pressed={value.mood === m} onClick={() => set({ mood: value.mood === m ? null : m })}>{m}</Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <span className="flabel">위치<br /><small style={{ fontWeight: 500 }}>선택</small></span>
        <div className="chips">
          <Chip pressed={!value.area} onClick={() => { setAreaText(''); set({ area: null }) }}>선택 안 함</Chip>
          {AREAS.map((a) => (
            <Chip key={a} pressed={value.area === a} onClick={() => { setAreaText(''); set({ area: value.area === a ? null : a }) }}>{a}</Chip>
          ))}
          <input
            id="area-custom"
            className="loc-input"
            placeholder="다른 동네 입력"
            maxLength={12}
            aria-label="다른 동네 입력"
            value={areaText}
            style={custom ? { borderColor: 'var(--ink)' } : undefined}
            onChange={(e) => setAreaText(e.target.value)}
            onBlur={() => set({ area: areaText.trim() || (custom ? null : value.area) })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </div>
      </div>
      <div className="fgroup">
        <span className="flabel">못 먹는<br />것</span>
        <div className="chips">
          {AVOIDS.map((a) => (
            <Chip key={a} pressed={value.avoid.includes(a)} onClick={() => set({ avoid: toggle(value.avoid, a) })}>{a}</Chip>
          ))}
        </div>
      </div>
      <label className="toggle" htmlFor="f-norepeat">
        <input type="checkbox" id="f-norepeat" checked={value.noRepeat} onChange={(e) => set({ noRepeat: e.target.checked })} />
        최근 3번 뽑은 메뉴는 빼기
      </label>
      {skipped.length > 0 && (
        <div className="ftoday">
          오늘 뺀 것: {skipped.join(', ')}{' '}
          <button type="button" className="linkbtn" onClick={onResetSkip}>되돌리기</button>
        </div>
      )}
    </div>
  )
}
