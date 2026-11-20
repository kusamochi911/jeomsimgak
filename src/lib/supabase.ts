import type { SupabaseClient } from '@supabase/supabase-js'
import { config } from './config'

/** 환경 변수가 없으면 팀방 화면이 '준비 중' 안내로 바뀐다 */
export const supabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey)

let clientPromise: Promise<SupabaseClient> | null = null

/** 첫 화면(메뉴 뽑기)을 가볍게 하려고 SDK는 팀방을 열 때 불러온다 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!supabaseConfigured) return Promise.reject(new Error('Supabase is not configured'))
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.supabaseUrl!, config.supabaseKey!),
  )
  return clientPromise
}

let userPromise: Promise<string | null> | null = null

/**
 * 로그인 화면 없이 쓰기 위해 Supabase 익명 로그인을 사용한다.
 * (Supabase 대시보드 > Authentication > Sign In / Providers 에서 Anonymous sign-ins 켜기)
 * 반환값은 이 기기 사용자의 id. 투표·방장 권한을 이 id로 구분한다.
 */
export function ensureUser(): Promise<string | null> {
  if (!supabaseConfigured) return Promise.resolve(null)
  userPromise ??= (async () => {
    const sb = await getSupabase()
    const { data } = await sb.auth.getSession()
    if (data.session) return data.session.user.id
    const { data: signed, error } = await sb.auth.signInAnonymously()
    if (error) {
      userPromise = null
      throw error
    }
    return signed.user?.id ?? null
  })()
  return userPromise
}
