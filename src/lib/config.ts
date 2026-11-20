const env = import.meta.env

export const config = {
  /** 공유 링크에 쓰는 서비스 주소. 비우면 현재 주소 사용 */
  siteUrl: (env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || location.origin,
  supabaseUrl: env.VITE_SUPABASE_URL as string | undefined,
  supabaseKey: env.VITE_SUPABASE_ANON_KEY as string | undefined,
  kakaoJsKey: env.VITE_KAKAO_JS_KEY as string | undefined,
  /** 'toss'로 빌드하면 토스 앱 안에서 쓰는 화면(자체 헤더 숨김) */
  inToss: env.VITE_TARGET === 'toss',
  freePicksPerDay: 10,
}

export const absoluteUrl = (path: string): string => config.siteUrl + path
