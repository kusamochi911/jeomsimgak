import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'jsg_'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* 사생활 보호 모드 등에서 저장이 막혀도 앱은 계속 동작 */
  }
}

/** localStorage에 저장되는 useState. 저장이 막혀 있어도 메모리 상태로 동작 */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() =>
    readStore(key, typeof initial === 'function' ? (initial as () => T)() : initial),
  )
  useEffect(() => writeStore(key, value), [key, value])
  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), [])
  return [value, set] as const
}
