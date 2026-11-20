import { useEffect } from 'react'

export const cssVar = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export function sizeCanvas(c: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const r = devicePixelRatio || 1
  c.width = Math.round(w * r)
  c.height = Math.round(h * r)
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  const ctx = c.getContext('2d')!
  ctx.setTransform(r, 0, 0, r, 0, 0)
  return ctx
}

/** 화면 크기·테마·폰트 로딩이 바뀌면 다시 그리기 */
export function useRedraw(draw: () => void): void {
  useEffect(() => {
    draw()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    addEventListener('resize', draw)
    mq.addEventListener('change', draw)
    void document.fonts?.ready.then(draw)
    return () => {
      removeEventListener('resize', draw)
      mq.removeEventListener('change', draw)
    }
  }, [draw])
}

export const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 사다리 참가자 색. 밝은/어두운 배경 모두에서 읽히는 중간 톤 */
export const PLAYER_COLORS = ['#E0412A', '#1F8A5B', '#3767D8', '#D6861A', '#9050C8', '#1597A8', '#D04A87', '#6E7B2A', '#C2552B', '#4A5A9A']
