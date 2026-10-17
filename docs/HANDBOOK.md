# 가족캘린더 총정리본

사람(특히 Java/JSP 개발자)과 다른 AI가 이어서 개발·유지보수하기 위한 기준 문서다.

- 프로젝트: `C:\family-calendar`
- 프론트: React + Vite (`http://localhost:5173`)
- 백엔드: Node.js + Express (`http://localhost:4000`)
- DB: SQLite `C:\family-calendar\backend\data\family-calendar.db`
- Java 환경은 사용하지 않는다. JDK, `JAVA_HOME`, 다른 Java 프로젝트 설정은 바꾸지 않는다.

다른 AI에게 맡길 때 같이 줄 것:

1. `README.md`
2. `docs/HANDBOOK.md`
3. `AGENTS.md`
4. 가능하면 저장소 전체 (`node_modules` 제외)

---

## 1. 한 줄 요약

가족이 가입 신청 → 관리자가 소가족을 정해 승인 → **우리가족 일정과 자기 소가족 일정**을 보고, 로그인 때 가족 사진을 보여 주는 모바일 웹 앱.

JSP로 치면 화면용 WAR + JSON API 서버가 나뉜 구조다. 브라우저는 React가 그리고, 데이터만 Express로 주고받는다.

---

## 2. Java/JSP 대응

| JSP/Servlet | 이 프로젝트 | 설명 |
|---|---|---|
| Tomcat | Node.js | `backend`의 `npm run dev` |
| `@WebServlet` | `backend/src/routes/*.js` | URL과 함수 연결 |
| Controller | `backend/src/controllers/*.js` | 검증, 권한, JSON |
| DAO | `backend/src/models/*.js` | SQL |
| Filter | `backend/src/middleware/*.js` | JWT, 관리자 |
| HttpSession | JWT + `localStorage` | `family-calendar-token` |
| JSP | `frontend/src/pages/*.jsx` | 화면 |
| include | `frontend/src/components/*.jsx` | 모달, 달력, 게임 |
| applicationContext | `AuthContext`, `AlertContext` | 전역 상태 |
| contextPath/api | Vite proxy `/api` → `4000` | |
| Oracle | SQLite 파일 + `.env` | |
| Lombok | 없음 | 함수형 모델 객체 |

```
브라우저(React)
  → fetch /api/events
  → Vite가 localhost:4000으로 전달
  → routes → middleware(JWT) → controller → model → SQLite
  → JSON
  → React가 화면만 다시 그림
```

---

## 3. 실행

```bash
cd C:\family-calendar
npm run dev
```

- 화면: http://localhost:5173
- API: http://localhost:4000/api/health
- 백엔드는 `--watch`, 프론트는 Vite HMR
- 초기 관리자: `admin` / `123456` (소문자, 1~6자)
- 아이디는 이메일 아님. `[a-z0-9_]` 2~20자

---

## 4. 폴더

```
C:\family-calendar
├── README.md
├── AGENTS.md
├── docs/HANDBOOK.md
├── docs/DEPLOY.md            Oracle + Cloudflare
├── deploy/                   publish.ps1, setup-server.sh
├── package.json              동시 실행
├── backend
│   ├── .env
│   ├── data/
│   │   ├── family-calendar.db
│   │   └── family-covers/    가족당 사진 1장
│   └── src
│       ├── index.js
│       ├── db/database.js
│       ├── lib/familyCover.js
│       ├── game/             오목
│       ├── models/
│       ├── controllers/
│       ├── routes/
│       └── middleware/
└── frontend
    ├── vite.config.js
    ├── public/sw.js
    └── src
        ├── App.jsx
        ├── index.css
        ├── constants.js
        ├── api/client.js
        ├── context/
        ├── pages/
        └── components/
```

SQL은 `models`에만 둔다.

---

## 5. 업무 규칙

1. 가입 기본값: `ROLE=MEMBER`, `STATUS=PENDING`
2. PENDING/REJECTED는 JWT를 주지 않는다
3. 캘린더·게임은 승인된 사용자만. 웹 푸시는 참석자에 넣었을 때만 울린다. 알림 이력은 없다
4. 최종 관리자 = `USERS.ROLE = ADMIN`
5. 가족 그룹장 = `MEMBER` + `IS_FAMILY_ADMIN` + 소가족 `FAMILY_ID`
6. 승인된 사람은 우리가족 일정을 모두 본다. `EVENTS.FAMILY_ID`는 올린 사람의 소가족(규진이네, 장식이네) 표시다
7. 수정/삭제: 작성자, 최종 관리자, 그 소가족 그룹장. 우리가족 일정은 그룹장이 고치지 못함
8. 가족 사진은 로그인 환영용. 캘린더 배경으로 쓰지 않음
9. 사진 교체·가족 삭제 시 커버 파일 삭제. 가족당 파일 하나
10. 할 일, 주간 캘린더는 제거됨. 다시 넣지 말 것. 웹 푸시는 참석자만, 이력 화면은 없음
11. 디자인: 연한 크림/분홍, 반응형. `alert`/`confirm` 대신 `AlertContext`
12. Java/JDK 설정 변경 금지

| 기능 | 비로그인 | PENDING | 구성원 | 그룹장 | 최종 admin |
|---|---|---|---|---|---|
| 가입/로그인 | O | O | O | O | O |
| 우리가족+소가족 캘린더 | X | X | O | O | 전체 또는 선택 |
| 남 일정 수정 | X | X | X | 같은 가족 | O |
| 가입 승인 | X | X | X | 자기 가족 | 전체 |
| 가족 사진 | X | X | X | 자기 가족 | O |

---

## 6. 화면

| 경로 | 파일 | 누가 |
|---|---|---|
| `/login` | `LoginPage.jsx` | 손님 |
| `/register` | `RegisterPage.jsx` | 손님 |
| `/pending` | `PendingPage.jsx` | 대기 |
| `/calendar` | `CalendarPage.jsx` | 승인 |
| `/game` | `GamePage.jsx` | 승인 |
| `/game/omok` | `OmokGamePage.jsx` | 승인 |
| `/admin` | `AdminPage.jsx` | 그룹장 또는 최종 admin |

로그인 직후 가족 사진이 있으면 `FamilyWelcome`이 먼저 뜬다. 화면을 누르면 캘린더.

가드: `GuestRoute`, `ProtectedRoute`, `requireAdmin`(그룹장 포함 `isManager`)

---

## 7. API

헤더 `Authorization: Bearer <token>`  
실패 `{ "message": "한국어" }`  
날짜 `YYYY-MM-DD`, 시간 `HH:MM`

### `/api/auth`

- `POST /register` `{ loginId, password, name }`
- `POST /login` `{ loginId, password }`
- `GET /me`

### `/api/admin`

- `GET /pending-users`, `GET /approved-users`
- `PATCH /users/:id/status` `{ status, familyId }`
- `GET /families`, `POST /families`, `PATCH /families/:id`, `DELETE /families/:id`
- `POST /families/:id/background` `{ image: dataUrl }`
- `PATCH /users/:id/family` `{ familyId, isFamilyAdmin }` 최종 admin만

### `/api/events`

- `GET /?from=&to=` 또는 `?familyId=` (최종 admin)
- `GET /people` 승인된 사람 `{ id, name }`
- `POST /` `{ title, description, eventDate, endDate, startTime, endTime, color, isFamilyEvent, hasAttendees, attendeeIds }`
- `familyId`는 `우리가족` 또는 자기 소가족. 최종 admin은 아무 가족
- `PATCH /:id`, `DELETE /:id`

기간 조회는 `EVENT_DATE <= to` 그리고 `END_DATE >= from`. 구성원은 우리가족 일정과 소가족 일정을 같이 받는다.

일정을 만들거나 고칠 때, 새로 참석자에 들어간 사람에게 웹 푸시를 보낸다. 알림을 누르면 그 날짜 일정이 보이고, 수정 창은 열지 않는다.

### `/api/push`

- `GET /vapid` `{ publicKey }`
- `POST /subscribe` 브라우저 구독
- `POST /unsubscribe` `{ endpoint }`

### `/api/omok`

- `GET /?mode=cpu|pvp`
- `POST /cpu/start`, `POST /cpu/act` `{ x, y }`
- `POST /join` `{ roomId }` 1·2·3번 방. 승인된 사람은 소가족과 상관없이 입장
- `POST /leave|start|act` 같이 하기. 한 명이 나가면 그 판은 끝나고 방은 다시 빈다

컴퓨터 판은 사용자별, 같이 하기는 1·2·3번 방이다. 두 명이 같은 방에 들어가면 바로 시작한다. 메모리라 서버 재시작 시 판은 리셋. 15줄, 흑 선, 다섯 알 이상이면 승리.

### 기타

- `GET /api/covers/:file`
- `GET /api/health`

---

## 8. DB

컬럼은 대문자 스네이크.

- `USERS`: `ID, EMAIL, PASSWORD, NAME, ROLE, STATUS, FAMILY_ID, IS_FAMILY_ADMIN, CREATED_AT`
- `FAMILIES`: `ID, NAME, COLOR, BACKGROUND, IS_CLAN, CREATED_AT`. `IS_CLAN=1`이 `우리가족`
- `EVENTS`: `ID, TITLE, DESCRIPTION, EVENT_DATE, END_DATE, START_TIME, END_TIME, COLOR, REMIND_MINUTES, VISIBILITY, CREATED_BY, FAMILY_ID, IS_FAMILY_EVENT, HAS_ATTENDEES, CREATED_AT, UPDATED_AT`. `IS_FAMILY_EVENT=1`이면 중요일정. `HAS_ATTENDEES=1`이면 `EVENT_ATTENDEES`에 참석자
- `EVENT_ATTENDEES`: `EVENT_ID, USER_ID`
- `PUSH_SUBSCRIPTIONS`: `USER_ID, ENDPOINT, P256DH, AUTH, CREATED_AT`. 웹 푸시 구독
- `NOTIFICATION_READS`, `GAME_SCORES` 테이블이 남아 있을 수 있으나 앱은 쓰지 않는다

레거시 `GROUPS`, `TODOS` 테이블이 DB에 남아 있을 수 있으나 앱은 쓰지 않는다.

스키마 변경: 새 테이블은 `CREATE TABLE IF NOT EXISTS`, 기존 컬럼은 `addColumnIfMissing`.

커버 파일: `backend/data/family-covers/{familyId}.jpg`  
올리면 그 가족 `id`로 시작하는 예전 파일을 지운다. 서버 시작 시 DB에 없는 파일도 지운다.

---

## 9. 프론트

- `AlertContext`: 확인 카드, 토스트
- `AuthContext`: 로그인, `welcome` 가족 사진
- `EventModal` + `DateTimePickers`: 커스텀 달력/시계. 기본 09:00~18:00
- `OmokGamePage`: 컴퓨터 또는 가족 두 명, 1.2초 폴링
- 스타일은 `index.css` 한 파일

공휴일: `constants.js`의 양력 + 음력 테이블(2024~2032).

---

## 10. 기능 추가 순서

1. `database.js` 테이블/컬럼
2. `models`
3. `controllers` + `routes`
4. `index.js`에 `app.use`
5. page/component, `App.jsx`, `index.css`

관리자 전용은 `requireSuperAdmin`, 그룹장 포함은 `requireAdmin`.

---

## 11. 자주 하는 점검

- 일정이 안 보임: 우리가족/`FAMILY_ID`, 승인 여부, `from`/`to`와 `END_DATE`
- 사진이 안 보임: `/api/covers/{BACKGROUND}`, 로그인 직후에만 환영 화면
- 오목: 승인된 사용자. 같이 하기는 1·2·3번 방, 소가족과 무관. 서버 재시작 시 방 리셋
- API 실패: 4000 서버, Vite 프록시, JWT 만료

DB 초기화: 서버 종료 → `family-calendar.db` 삭제 → 재시작. 관리자만 다시 생김. 커버 폴더는 따로 비울 것.

---

## 12. 코딩 약속

- 백엔드 ESM, 함수형 모델
- 프론트 함수 컴포넌트 + hooks
- UI 문구 한국어
- 비밀번호 `bcryptjs`
- 새 npm 패키지는 꼭 필요할 때만. 네이티브 빌드 모듈은 피한다

---

## 13. 구현됨 / 없음

구현됨:

- 아이디 가입, 승인, 다중 가족, 그룹장
- 월간 캘린더, 슬라이드, 음력 공휴일
- 기간 일정, 커스텀 날짜/시간 선택
- 로그인 가족 사진, 용량 절약 교체
- 오목 (컴퓨터 / 가족 두 명)
- 앱 확인창/토스트
- 운영 배포: `docs/DEPLOY.md`. 운영에서는 Express가 `frontend/dist`를 같이 연다

없음:

- 기록/일기
- 반복 일정
- 자동 테스트
- 알림 이력 화면, 네이티브 앱 푸시

---

## 14. 다른 AI 작업 템플릿

```
C:\family-calendar 가족캘린더다.
README.md, docs/HANDBOOK.md, AGENTS.md를 먼저 읽어라.
Java/JDK는 건드리지 마라.
Express+SQLite, React+Vite다.
가족 단위 격리와 승인 규칙을 깨지 마라.
할 일/주간 캘린더/아이들 그룹은 되살리지 마라.
가족 사진은 로그인 환영용이다.
연한 크림/분홍 반응형을 유지하라.
[이번에 할 일]
```
