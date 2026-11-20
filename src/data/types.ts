export const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '아시안'] as const
export const MOODS = ['혼밥', '여럿이', '해장', '가볍게', '든든하게', '비 오는 날'] as const
export const AVOIDS = ['매운 것', '해산물', '돼지고기', '소고기', '날것(회)', '밀가루'] as const
export const AREAS = ['강남역', '역삼', '여의도', '광화문', '판교', '성수', '을지로', '구로디지털단지'] as const

export type Category = (typeof CATEGORIES)[number]
export type Mood = (typeof MOODS)[number]
export type Avoid = (typeof AVOIDS)[number]

export interface Menu {
  name: string
  cat: Category
  /** 서울 1인 기준 [최저, 최고] 원 */
  price: [number, number]
  tags: Mood[]
  emoji: string
  desc: string
  /** 이 재료를 못 먹는 사람에게서 빼야 하는 메뉴 */
  avoid: Avoid[]
}

export const PRICE_RANGES = {
  any: { label: '상관없음', range: [0, Infinity] },
  u10: { label: '1만원 이내', range: [0, 10000] },
  '10s': { label: '1만원대', range: [10000, 19999] },
  '20s': { label: '2만원대', range: [20000, 29999] },
} as const satisfies Record<string, { label: string; range: readonly [number, number] }>

export type PriceKey = keyof typeof PRICE_RANGES
