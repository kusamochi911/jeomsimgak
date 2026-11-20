import { absoluteUrl, config } from './config'

interface KakaoSDK {
  isInitialized(): boolean
  init(key: string): void
  Share: { sendDefault(options: Record<string, unknown>): void }
}
declare global {
  interface Window {
    Kakao?: KakaoSDK
  }
}

// 카카오 JavaScript SDK. 버전과 integrity 값은 카카오 개발자 문서의 최신 안내에 맞춰 갱신
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
let sdkPromise: Promise<KakaoSDK | null> | null = null

function loadKakao(): Promise<KakaoSDK | null> {
  if (!config.kakaoJsKey) return Promise.resolve(null)
  sdkPromise ??= new Promise((resolve) => {
    const done = () => {
      const k = window.Kakao
      if (!k) return resolve(null)
      if (!k.isInitialized()) k.init(config.kakaoJsKey!)
      resolve(k)
    }
    if (window.Kakao) return done()
    const s = document.createElement('script')
    s.src = KAKAO_SDK
    s.crossOrigin = 'anonymous'
    s.onload = done
    s.onerror = () => resolve(null)
    document.head.append(s)
  })
  return sdkPromise
}

/** 앱 시작 때 미리 불러 두면 공유 버튼 반응이 빨라짐 */
export const preloadKakao = (): void => void loadKakao()

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.append(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export interface SharePayload {
  title: string
  description: string
  /** 앱 안 경로 (예: /r/ab12cd) */
  path: string
  buttonTitle: string
  /** 카카오 공유를 못 쓸 때 복사할 문구 (링크는 자동으로 붙음) */
  fallbackText: string
}

export type ShareResult = 'kakao' | 'copied' | 'failed'

/** 카카오톡 공유 카드로 보내고, SDK를 못 쓰면 문구+링크를 복사 */
export async function shareToKakao(p: SharePayload): Promise<ShareResult> {
  const url = absoluteUrl(p.path)
  const kakao = await loadKakao()
  if (kakao) {
    try {
      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: p.title,
          description: p.description,
          imageUrl: absoluteUrl('/og.png'),
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: p.buttonTitle, link: { mobileWebUrl: url, webUrl: url } }],
      })
      return 'kakao'
    } catch {
      /* 아래 복사로 대체 */
    }
  }
  return (await copyText(`${p.fallbackText}\n${url}`)) ? 'copied' : 'failed'
}

export async function copyLink(path: string): Promise<boolean> {
  return copyText(absoluteUrl(path))
}

export function shareResultMessage(r: ShareResult): string {
  if (r === 'kakao') return '카카오톡 공유 창을 열었어요'
  if (r === 'copied') return '복사했어요. 카카오톡 채팅방에 붙여넣으세요'
  return '복사가 막혀 있어요. 화면을 캡처해 공유해 주세요'
}
