import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * GET /api/places?q=김치찌개&x=127.02&y=37.49&radius=700
 * 카카오 로컬 키워드 검색을 서버에서 대신 호출한다 (REST API 키를 브라우저에 노출하지 않기 위해).
 * 음식점 카테고리(FD6)만, 좌표가 있으면 거리순.
 */
const num = (v: unknown): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isFinite(n) ? n : null
}

interface KakaoDoc {
  id: string
  place_name: string
  category_name?: string
  distance?: string
  road_address_name?: string
  address_name?: string
  place_url: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = String(req.query.q ?? '').trim().slice(0, 40)
  if (!q) return res.status(400).json({ error: 'q is required' })
  const key = process.env.KAKAO_REST_API_KEY?.trim()
  if (!key) return res.status(503).json({ error: 'KAKAO_REST_API_KEY is not set' })

  const params = new URLSearchParams({ query: q, category_group_code: 'FD6', size: '10' })
  const x = num(req.query.x), y = num(req.query.y)
  if (x != null && y != null) {
    const radius = Math.min(2000, Math.max(100, num(req.query.radius) ?? 700))
    params.set('x', String(x))
    params.set('y', String(y))
    params.set('radius', String(radius))
    params.set('sort', 'distance')
  }

  try {
    const r = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    })
    if (!r.ok) return res.status(502).json({ error: `kakao ${r.status}` })
    const { documents = [] } = (await r.json()) as { documents?: KakaoDoc[] }
    const places = documents.map((d) => ({
      id: d.id,
      name: d.place_name,
      category: d.category_name?.split(' > ').pop() ?? null,
      distance: d.distance ? Number(d.distance) : null,
      address: d.road_address_name || d.address_name || '',
      url: d.place_url,
    }))
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json({ places })
  } catch {
    return res.status(502).json({ error: 'upstream failed' })
  }
}
