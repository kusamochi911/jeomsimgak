# 점심각

오늘 점심 메뉴 뽑기, 링크 하나로 하는 팀 투표, 누가 쏠지 정하는 게임, 점심 기록 통계를 한 앱에 담은 모바일 웹 서비스입니다.
웹으로 먼저 출시하고, 같은 코드를 토스 앱인토스 미니앱으로 올리는 것을 전제로 만들었습니다.

## 화면

| 탭 | 하는 일 |
|---|---|
| 추천 | 한 줄로 접힌 조건(종류·예산·상황·위치·못 먹는 것) → 메뉴 뽑기 → 주문서 카드. '이거 말고'로 오늘 하루 빼고 다시 뽑기. 카카오맵/네이버지도 링크와 근처 식당 목록(카카오 로컬 API). 뽑기 횟수 제한 없음 |
| 팀방 | 후보 메뉴로 방 만들기 → 마감 시간 → 카톡 공유 → 로그인 없이 닉네임으로 투표, 실시간 집계 → 동점이면 방장이 룰렛 → 1등 메뉴로 식당 찾기·게임 연결 |
| 누가 쏠까 | 룰렛 · 사다리 · 폭탄 숫자. 결과 카톡 공유, 쏜 사람은 기록에 저장 |
| 기록 | 다음 날 "어제 뽑은 메뉴 드셨나요?"로 자동 기록. 최근 30일 횟수·지출, 종류별 비율, 자주 먹은 메뉴, 누가 많이 쐈나 |

## 기술 구성

- **프론트**: Vite + React + TypeScript. 라우터·상태 관리 라이브러리 없이 작게 유지 (`src/lib/router.ts`, `src/state/data.tsx`)
- **팀방**: Supabase (Postgres + Realtime + 익명 로그인). SDK는 팀방을 열 때만 불러와 첫 화면을 가볍게 유지
- **근처 식당**: Vercel 서버 함수 `api/places.ts`가 카카오 로컬 API를 대신 호출 (REST 키를 브라우저에 노출하지 않음)
- **카카오톡 공유**: 카카오 JavaScript SDK의 공유 카드. 키가 없거나 실패하면 문구+링크 복사로 대체
- **개인 기록**: 브라우저 localStorage (기기별 저장)

```
src/
  data/        메뉴 113개(가격·상황·재료 태그), 타입
  lib/         뽑기 로직(pick.ts), 공유, Supabase, 라우터, 저장소
  features/    pick · room · game · stats 화면
  components/  토스트, 바텀시트, 칩
api/places.ts  카카오 로컬 검색 프록시 (Vercel 함수)
supabase/migrations/001_rooms.sql  팀방 테이블·보안 규칙·실시간 설정
```

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (없어도 추천·게임·기록은 동작)
npm run dev
```

- `npm test` 뽑기 로직·투표 집계·식당 검색 함수 테스트
- `npm run typecheck` 앱과 서버 함수 타입 검사
- `npm run build` 웹 배포용 빌드, `npm run build:toss` 토스 앱용 빌드(자체 헤더 숨김)
- 서버 함수(`/api/places`)까지 로컬에서 돌리려면 `npx vercel dev`

## 출시 준비 순서

### 1. Supabase (팀방)
1. supabase.com에서 프로젝트 생성 (리전: Seoul)
2. SQL Editor에 `supabase/migrations/001_rooms.sql` 내용을 붙여넣고 실행
3. Authentication > Sign In / Providers에서 **Anonymous sign-ins** 켜기
4. 익명 가입 남용을 막으려면 Authentication 설정에서 CAPTCHA(Turnstile 등) 켜기 권장
5. Project Settings > API의 URL과 anon(또는 publishable) 키를 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`에 넣기

### 2. 카카오 개발자 (공유 + 식당 검색)
1. developers.kakao.com에서 애플리케이션 생성
2. 플랫폼 > Web에 배포 도메인 등록 (예: `https://jeomsimgak.vercel.app`, 개발용 `http://localhost:5173`)
3. JavaScript 키 → `VITE_KAKAO_JS_KEY` (카카오톡 공유)
4. REST API 키 → `KAKAO_REST_API_KEY` (Vercel 환경 변수에만 등록, 근처 식당 검색)
5. `src/lib/share.ts`의 SDK 주소를 카카오 문서의 최신 버전과 integrity 값으로 맞추기
6. 공유 버튼 모양·문구는 카카오 디자인 가이드에 맞춰 최종 확인

### 3. Vercel 배포
1. 이 저장소를 GitHub에 올리고 Vercel에서 Import (Framework: Vite 자동 인식)
2. 위 환경 변수 등록, `VITE_SITE_URL`은 실제 배포 주소로
3. `vercel.json`이 `/r/:id` 같은 주소를 앱으로 넘겨줌

### 4. 광고 (보류)
지금 버전에는 광고가 없습니다. 나중에 붙일 때 참고:
- 웹: 카카오 애드핏 또는 구글 애드센스 배너. 애드핏은 광고 코드가 설치돼 광고 요청이 들어와야 매체 심사를 시작한다. 이전에 만든 애드핏 연동 코드는 git 기록(커밋 '웹 배너: 카카오 애드핏 연동')에 있음
- 토스 앱인토스: 미니앱 안에서는 앱인토스 광고(전면형·리워드·배너)만 허용, 외부 광고 네트워크 금지

### 5. 토스 앱인토스
- `npm run build:toss`로 자체 헤더를 숨긴 빌드 생성 (상단 바는 토스가 그림)
- 게임은 '내기'가 아니라 '정하기' 도구로 유지: 금액 입력, 판돈, 베팅 요소를 넣지 않기
- 토스 안에서는 카카오 공유 대신 플랫폼 공유 기능이 있는지 먼저 확인
- 세부 심사 기준과 SDK 사양은 앱인토스 개발자 문서의 최신 내용을 기준으로 맞추기

## 출시 전 체크리스트

- [ ] '점심각' 상표 출원 여부(키프리스)와 도메인 확인
- [ ] 메뉴 113개 가격을 실제 가게 기준으로 검증 (`src/data/menus.ts`, 지금은 서울 직장가 추정치)
- [ ] 카카오 공유 버튼 디자인 가이드 확인
- [ ] 개인정보처리방침 (위치 정보는 검색에만 쓰고 저장하지 않음, 팀방 닉네임 저장)
- [ ] 분석 도구 연결 후 두 지표 측정: 평일 11~13시 사용자 수, 팀방 하나당 새로 들어온 사용자 수
