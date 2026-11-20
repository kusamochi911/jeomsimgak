import { useState } from 'react'
import { useUI } from '../../components/ui'
import type { Menu } from '../../data/types'
import { placeQuery } from '../../lib/pick'

interface Place {
  id: string
  name: string
  category: string | null
  distance: number | null
  address: string
  url: string
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; places: Place[]; where: string }
  | { status: 'error'; message: string }

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 })
      : reject(new Error('no geolocation')),
  )

/** 카카오 로컬 API(/api/places 서버 함수 경유)로 실제 식당을 찾는다. 메뉴가 바뀌면 부모가 key로 초기화 */
export function NearbyPlaces({ menu, area }: { menu: Menu; area: string | null }) {
  const { toast } = useUI()
  const [state, setState] = useState<State>({ status: 'idle' })

  async function search(useLocation: boolean) {
    setState({ status: 'loading' })
    const params = new URLSearchParams()
    let where = area ? `${area} 근처` : '전국'
    if (useLocation) {
      try {
        const { coords } = await getPosition()
        params.set('q', menu.name)
        params.set('x', String(coords.longitude))
        params.set('y', String(coords.latitude))
        params.set('radius', '700')
        where = '내 위치 700m 안'
      } catch {
        toast('위치 권한이 없어 동네 이름으로 검색해요')
        params.set('q', placeQuery(area, menu.name))
      }
    } else {
      params.set('q', placeQuery(area, menu.name))
    }
    try {
      const res = await fetch(`/api/places?${params}`)
      if (res.status === 503 || res.status === 404) return setState({ status: 'error', message: '식당 검색 서버가 아직 설정되지 않았어요. 위 지도 버튼을 이용해 주세요.' })
      if (!res.ok) throw new Error(String(res.status))
      const { places } = (await res.json()) as { places: Place[] }
      setState({ status: 'done', places: places.slice(0, 5), where })
    } catch {
      setState({ status: 'error', message: '식당을 불러오지 못했어요. 잠시 후 다시 시도하거나 지도 버튼을 이용해 주세요.' })
    }
  }

  return (
    <div className="card stack">
      <div className="row-between" style={{ margin: 0 }}>
        <h3 className="sec-title">{menu.name} 파는 곳</h3>
        {state.status === 'done' && <span className="hint">{state.where}</span>}
      </div>
      {state.status === 'idle' && <p className="hint">가까운 식당을 거리순으로 찾아드려요.</p>}
      {state.status === 'loading' && <p className="hint">찾는 중…</p>}
      {state.status === 'error' && <p className="hint">{state.message}</p>}
      {state.status === 'done' &&
        (state.places.length ? (
          <ul className="places">
            {state.places.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noopener">
                  <b>{p.name}</b>
                  <span className="dist">{p.distance != null ? `${p.distance}m` : ''}</span>
                  <small>{[p.category, p.address].filter(Boolean).join(' · ')}</small>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">근처에서 찾지 못했어요. 범위를 넓히려면 동네를 바꿔 보세요.</p>
        ))}
      <div className="btnrow">
        <button type="button" className="btn-ghost" onClick={() => search(true)} disabled={state.status === 'loading'}>
          내 위치로 찾기
        </button>
        <button type="button" className="btn-ghost" onClick={() => search(false)} disabled={state.status === 'loading'}>
          {area ? `${area}에서 찾기` : '이름으로 찾기'}
        </button>
      </div>
    </div>
  )
}
