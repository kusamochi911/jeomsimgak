/** 로컬 시간 기준 YYYY-MM-DD */
export const dkey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayKey = (): string => dkey(new Date())

export const daysAgoKey = (n: number, from = new Date()): string => {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return dkey(d)
}

/** 오늘(평일이면 포함)부터 거슬러 올라간 평일 n개, 오래된 순 */
export function weekdaysBack(n: number, from = new Date()): string[] {
  const out: string[] = []
  const d = new Date(from)
  while (out.length < n) {
    const g = d.getDay()
    if (g > 0 && g < 6) out.unshift(dkey(d))
    d.setDate(d.getDate() - 1)
  }
  return out
}

/** "11/20" */
export const shortDate = (key: string): string => `${+key.slice(5, 7)}/${+key.slice(8)}`

export const formatWon = (n: number): string => n.toLocaleString('ko-KR')
