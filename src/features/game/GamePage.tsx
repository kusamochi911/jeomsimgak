import { useState, type FormEvent, type ReactNode } from 'react'
import { Chip, useUI } from '../../components/ui'
import { shareResultMessage, shareToKakao } from '../../lib/share'
import { useData } from '../../state/data'
import { BombNumber } from './BombNumber'
import { Ladder } from './Ladder'
import { Roulette } from './Roulette'

type Game = 'roulette' | 'ladder' | 'bomb'
const GAMES: [Game, string][] = [['roulette', '룰렛'], ['ladder', '사다리'], ['bomb', '폭탄 숫자']]

export function GamePage() {
  const { people, setPeople, addPayer } = useData()
  const { toast, openSheet, closeSheet } = useUI()
  const [game, setGame] = useState<Game>('roulette')
  const [name, setName] = useState('')
  // 참가자가 바뀌면 사다리·폭탄 게임을 새 판으로
  const round = people.join('|')

  function add(e: FormEvent) {
    e.preventDefault()
    const v = name.trim()
    if (!v) return
    if (people.length >= 10) return toast('최대 10명까지 넣을 수 있어요')
    if (people.includes(v)) return toast('같은 이름이 이미 있어요')
    setPeople([...people, v])
    setName('')
  }

  function result(kicker: string, payer: string, body: string, extra?: ReactNode) {
    addPayer(payer, kicker)
    const text = `[점심각] 오늘 점심은 ${payer} 님이 쏩니다! 잘 먹겠습니다 🙏`
    openSheet({
      content: (
        <>
          <div className="res-kicker">{kicker}</div>
          <h2 className="res-title">오늘 점심은<br /><mark>{payer}</mark> 님이 쏩니다</h2>
          <p className="res-body">{body}</p>
          {extra}
        </>
      ),
      actions: [
        { label: '닫기', onClick: closeSheet },
        {
          label: '카카오톡으로 알리기', kind: 'kakao', onClick: async () => {
            const r = await shareToKakao({ title: `오늘 점심은 ${payer} 님이 쏩니다!`, description: '누가 쏠지 점심각에서 정했어요', path: '/game', buttonTitle: '우리도 게임하기', fallbackText: text })
            toast(shareResultMessage(r))
          },
        },
      ],
    })
  }

  return (
    <section className="view" aria-label="누가 쏠까 게임">
      <h1 className="headline">오늘은<br /><em>누가 쏠까?</em></h1>
      <p className="sub">참가자를 한 번만 적어두면 세 가지 게임에 다 씁니다.</p>

      <div className="card">
        <div className="row-between"><h3 className="sec-title">참가자 {people.length}명</h3><span className="hint">2~10명 · 눌러서 빼기</span></div>
        <div className="chips">
          {people.map((p) => (
            <Chip key={p} label={`${p} 빼기`} onClick={() => people.length <= 2 ? toast('최소 2명은 있어야 해요') : setPeople(people.filter((x) => x !== p))}>
              {p}<span className="x" aria-hidden="true">✕</span>
            </Chip>
          ))}
        </div>
        <form className="addrow" onSubmit={add}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={6} placeholder="이름 (최대 6자)" autoComplete="off" aria-label="참가자 이름" />
          <button type="submit">추가</button>
        </form>
      </div>

      <div className="seg" role="tablist" aria-label="게임 선택">
        {GAMES.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={game === k} onClick={() => setGame(k)}>{l}</button>
        ))}
      </div>

      {game === 'roulette' && <Roulette people={people} onResult={(p) => result('ROULETTE', p, `${people.length}명 중 룰렛이 고른 사람입니다.`)} />}
      {game === 'ladder' && (
        <Ladder key={round} people={people} onToast={toast}
          onPayer={(p) => result('LADDER', p, '사다리를 타고 내려가 보니 점심 당첨!')}
          onSummary={(p, list) => result('LADDER', p, '전체 결과입니다.', list)} />
      )}
      {game === 'bomb' && <BombNumber key={round} people={people} onPayer={(p, n) => result('BOMB NUMBER', p, `${p} 님이 폭탄 숫자 ${n}을(를) 밟았어요.`)} />}
    </section>
  )
}
