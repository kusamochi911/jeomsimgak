import type { ReactNode } from 'react'
import { config } from '../../lib/config'
import { navigate } from '../../lib/router'

/** 정책 시행일. 내용을 바꾸면 날짜도 함께 바꾼다 */
const EFFECTIVE_DATE = '2026년 11월 21일'

function Contact() {
  return config.contactEmail ? (
    <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
  ) : (
    <span>문의 이메일 준비 중</span>
  )
}

function Link({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} onClick={(e) => { e.preventDefault(); navigate(to) }}>{children}</a>
  )
}

export function AboutPage() {
  return (
    <section className="view" aria-label="서비스 소개">
      <h1 className="headline">점심각<br /><em>서비스 소개</em></h1>
      <p className="sub">직장인의 매일 고민인 점심 메뉴와 계산할 사람을 30초 안에 정하는 무료 웹 서비스입니다.</p>
      <div className="doc">
        <h2>할 수 있는 일</h2>
        <ul>
          <li><b>메뉴 추천</b>: 종류·예산·상황·못 먹는 재료를 고르면 113가지 점심 메뉴 중에서 골라 드려요. 마음에 안 들면 '이거 말고'로 오늘 하루 빼고 다시 뽑을 수 있어요.</li>
          <li><b>근처 식당 찾기</b>: 뽑힌 메뉴를 파는 식당을 카카오맵·네이버지도로 바로 찾을 수 있어요.</li>
          <li><b>팀 투표</b>: 후보 메뉴를 올리고 링크를 팀 채팅에 보내면, 로그인 없이 닉네임만으로 실시간 투표해요.</li>
          <li><b>누가 쏠까</b>: 룰렛·사다리타기·폭탄 숫자 게임으로 점심값 낼 사람을 정해요. 재미로 정하는 도구이며 금전을 거는 기능은 없어요.</li>
          <li><b>점심 기록</b>: 먹은 메뉴와 예상 지출을 기기에 기록하고 통계로 보여드려요.</li>
        </ul>

        <h2>가격 정보 안내</h2>
        <p>메뉴별 예상 가격은 서울 직장가 점심 1인 기준의 추정치예요. 실제 가격은 가게마다 다를 수 있어요.</p>

        <h2>운영 및 문의</h2>
        <p>서비스 이용 중 불편한 점이나 제안, 개인정보 관련 문의는 아래 이메일로 보내 주세요.</p>
        <p>이메일: <Contact /></p>
        <p><Link to="/privacy">개인정보처리방침 보기</Link></p>
      </div>
    </section>
  )
}

export function PrivacyPage() {
  return (
    <section className="view" aria-label="개인정보처리방침">
      <h1 className="headline">개인정보<br /><em>처리방침</em></h1>
      <p className="sub">시행일: {EFFECTIVE_DATE}</p>
      <div className="doc">
        <p>점심각(이하 '서비스')은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 등 관련 법령을 지킵니다. 서비스는 회원가입 없이 이용할 수 있고, 꼭 필요한 정보만 최소한으로 처리합니다.</p>

        <h2>1. 처리하는 정보와 목적</h2>
        <ul>
          <li><b>팀방(투표) 이용 시</b>: 기기별로 자동 생성되는 익명 식별자, 이용자가 입력한 닉네임, 팀방 제목·후보 메뉴·마감 시간, 투표 선택. 팀 투표 기능 제공과 중복 투표 방지에만 씁니다.</li>
          <li><b>'내 위치로 찾기' 이용 시</b>: 이용자가 버튼을 누르고 브라우저에서 허용한 경우에만 현재 위치 좌표를 받아 근처 식당 검색에 한 번 사용합니다. 위치 좌표는 서비스 서버에 저장하지 않습니다.</li>
          <li><b>서비스 접속 시 자동 생성 정보</b>: 접속 IP 주소, 브라우저 종류, 접속 시간 등 기록이 호스팅·보안 업체의 서버 로그에 남을 수 있으며, 장애 대응과 부정 이용 방지에 씁니다.</li>
        </ul>

        <h2>2. 이용자 기기에만 저장되는 정보</h2>
        <p>메뉴 조건, 최근 뽑은 메뉴, 점심 기록, 게임 참가자 이름, 닉네임은 이용자 브라우저의 저장공간(localStorage)에만 저장되고 서비스 서버로 전송되지 않습니다. 브라우저의 사이트 데이터를 지우면 함께 삭제됩니다.</p>

        <h2>3. 보유 및 파기</h2>
        <ul>
          <li>팀방과 투표 정보는 방장이 팀방을 삭제하면 즉시 삭제됩니다. 운영 관리를 위해 만든 지 오래된 팀방은 운영자가 정리할 수 있습니다.</li>
          <li>이용자가 이메일로 삭제를 요청하면 지체 없이 삭제합니다.</li>
          <li>서버 로그는 각 업체의 보관 정책에 따라 일정 기간 후 삭제됩니다.</li>
        </ul>

        <h2>4. 처리 위탁 및 국외 이전</h2>
        <p>서비스 운영을 위해 아래 업체의 서비스를 이용합니다. 일부 업체의 서버는 해외에 있어 정보가 국외에서 처리될 수 있으며, 서비스 이용 시 네트워크를 통해 전송됩니다.</p>
        <div className="tbl plain"><table>
          <thead><tr><th>업체</th><th>업무</th><th>처리 정보</th></tr></thead>
          <tbody>
            <tr><td>Supabase Inc.</td><td>팀방·투표 데이터 저장</td><td>익명 식별자, 닉네임, 투표 정보</td></tr>
            <tr><td>Vercel Inc. (미국)</td><td>웹사이트 호스팅</td><td>접속 기록</td></tr>
            <tr><td>Cloudflare, Inc. (미국)</td><td>도메인·네트워크</td><td>접속 기록</td></tr>
            <tr><td>(주)카카오</td><td>근처 식당 검색, 카카오톡 공유</td><td>검색어, 위치 좌표(검색 시에만), 공유 내용</td></tr>
          </tbody>
        </table></div>

        <h2>5. 광고 및 쿠키</h2>
        <p>서비스는 앞으로 Google 애드센스, 카카오 애드핏 등 제3자 광고나 쿠팡 파트너스 같은 제휴 링크를 게재할 수 있습니다. 이 경우 광고 업체는 쿠키 등을 이용해 이용자의 이전 방문 기록을 바탕으로 광고를 보여줄 수 있습니다.</p>
        <ul>
          <li>Google의 맞춤 광고는 <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google 광고 설정</a>에서 끌 수 있습니다.</li>
          <li>브라우저 설정에서 쿠키 저장을 거부할 수 있으며, 이 경우에도 서비스의 주요 기능은 이용할 수 있습니다.</li>
          <li>제휴 링크를 게재하는 경우 해당 화면에 수수료 수령 사실을 표시합니다.</li>
        </ul>

        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 아래 이메일로 요청하면 지체 없이 처리합니다. 기기에 저장된 정보는 브라우저에서 사이트 데이터를 지워 직접 삭제할 수 있습니다.</p>

        <h2>7. 만 14세 미만 아동</h2>
        <p>서비스는 직장인을 위한 서비스로, 만 14세 미만 아동의 개인정보를 알면서 수집하지 않습니다.</p>

        <h2>8. 개인정보 보호책임자 및 문의</h2>
        <p>개인정보 보호책임자: 점심각 운영자<br />이메일: <Contact /></p>
        <p>개인정보 침해 신고나 상담이 필요하면 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr)에 문의할 수 있습니다.</p>

        <h2>9. 방침 변경</h2>
        <p>이 방침을 바꾸는 경우 시행 7일 전부터 이 페이지를 통해 알립니다.</p>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link to="/about">서비스 소개</Link>
      <span aria-hidden="true">·</span>
      <Link to="/privacy">개인정보처리방침</Link>
      <span aria-hidden="true">·</span>
      <Link to="/about">문의</Link>
      <p>© 2026 점심각</p>
    </footer>
  )
}
