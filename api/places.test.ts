import type { VercelRequest, VercelResponse } from '@vercel/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './places'

function call(query: Record<string, string>) {
  const out: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} }
  const res = {
    status(c: number) { out.status = c; return this },
    json(b: unknown) { out.body = b; return this },
    setHeader(k: string, v: string) { out.headers[k] = v; return this },
  } as unknown as VercelResponse
  return handler({ query } as unknown as VercelRequest, res).then(() => out)
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('/api/places', () => {
  it('400 without q', async () => expect((await call({})).status).toBe(400))

  it('503 when key missing', async () => {
    vi.stubEnv('KAKAO_REST_API_KEY', '')
    expect((await call({ q: '김치찌개' })).status).toBe(503)
  })

  it('calls Kakao with distance sort and maps documents', async () => {
    vi.stubEnv('KAKAO_REST_API_KEY', 'test-key')
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ documents: [
      { id: '1', place_name: '테스트식당', category_name: '음식점 > 한식 > 찌개,전골', distance: '120', road_address_name: '서울 어딘가 1', place_url: 'http://place.map.kakao.com/1' },
    ] })))
    vi.stubGlobal('fetch', fetchMock)
    const out = await call({ q: '김치찌개', x: '127.0', y: '37.5', radius: '99999' })
    expect(out.status).toBe(200)
    expect(out.body).toEqual({ places: [{ id: '1', name: '테스트식당', category: '찌개,전골', distance: 120, address: '서울 어딘가 1', url: 'http://place.map.kakao.com/1' }] })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const params = new URL(url).searchParams
    expect(params.get('category_group_code')).toBe('FD6')
    expect(params.get('sort')).toBe('distance')
    expect(params.get('radius')).toBe('2000')
    expect((init.headers as Record<string, string>).Authorization).toBe('KakaoAK test-key')
  })
})
