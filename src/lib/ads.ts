/**
 * 광고 연동 지점.
 * TODO: 웹 버전은 애드센스 등, 앱인토스 버전은 플랫폼이 제공하는 인앱 광고 SDK로 교체.
 * 지금은 3초 뒤 시청 완료로 처리하는 자리표시자다. 실제 출시 전에 반드시 교체할 것.
 */
export const ADS_ARE_PLACEHOLDER = true

export async function showRewardedAd(onTick?: (secondsLeft: number) => void): Promise<boolean> {
  for (let s = 3; s > 0; s--) {
    onTick?.(s)
    await new Promise((r) => setTimeout(r, 800))
  }
  return true
}
