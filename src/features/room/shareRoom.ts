import { shareResultMessage, shareToKakao } from '../../lib/share'

export async function shareRoom(r: { id: string; title: string; cands: string[] }, toast: (m: string) => void) {
  const res = await shareToKakao({
    title: r.title,
    description: `후보: ${r.cands.join(', ')}`,
    path: `/r/${r.id}`,
    buttonTitle: '투표하러 가기',
    fallbackText: `[점심각] ${r.title}\n후보: ${r.cands.join(', ')}\n한 표씩 눌러주세요 👇`,
  })
  toast(shareResultMessage(res))
}
