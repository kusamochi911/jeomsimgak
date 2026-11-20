const env = import.meta.env

/** 환경 변수 값의 앞뒤 공백·탭 제거 (Vercel 화면에 붙여넣을 때 섞여 들어가는 경우 대비) */
const read = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s || undefined
}

export const config = {
  /** 공유 링크에 쓰는 서비스 주소. 비우면 현재 주소 사용 */
  siteUrl: read(env.VITE_SITE_URL)?.replace(/\/$/, '') || location.origin,
  supabaseUrl: read(env.VITE_SUPABASE_URL),
  supabaseKey: read(env.VITE_SUPABASE_ANON_KEY),
  kakaoJsKey: read(env.VITE_KAKAO_JS_KEY),
  /** 'toss'로 빌드하면 토스 앱 안에서 쓰는 화면(자체 헤더 숨김) */
  inToss: read(env.VITE_TARGET) === 'toss',
}

export const absoluteUrl = (path: string): string => config.siteUrl + path
