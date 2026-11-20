import { useEffect, useState } from 'react'

/** 의존성 없는 작은 라우터. 경로: / · /room · /r/:id · /game · /stats */
export function usePath(): string {
  const [path, setPath] = useState(() => location.pathname)
  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  return path
}

export function navigate(to: string): void {
  if (to === location.pathname) return
  history.pushState(null, '', to)
  dispatchEvent(new PopStateEvent('popstate'))
  scrollTo(0, 0)
}
