# 가족캘린더

가족이 가입을 신청하고, 관리자 승인을 받은 뒤 **같은 가족끼리만** 일정을 보는 모바일 웹 앱입니다.

프론트는 React + Vite, 백엔드는 Node.js + Express, 데이터는 SQLite 파일입니다. Java/JDK는 쓰지 않습니다.

자세한 구조와 유지보수 방법은 [docs/HANDBOOK.md](docs/HANDBOOK.md)를 봅니다.

## 실행

```bash
cd C:\family-calendar
npm install
npm run dev
```

또는 따로:

```bash
cd C:\family-calendar\backend
npm run dev

cd C:\family-calendar\frontend
npm run dev
```

- 화면: http://localhost:5173
- API: http://localhost:4000
- 같은 와이파이 핸드폰에서는 PC 주소로 접속합니다. 예: `http://192.168.0.10:5173`

백엔드 `.env`가 없으면 `backend/.env.example`을 복사해 만듭니다.

## 계정

서버를 처음 켜면 관리자가 만들어집니다.

| 구분 | 값 |
|---|---|
| 아이디 | `admin` |
| 비밀번호 | `123456` (소문자, 1~6자) |

일반 회원은 아이디(영문/숫자/`_`, 2~20자)로 가입합니다. 이메일이 아닙니다.  
가입하면 `PENDING`이고, 관리자가 가족을 정해 승인한 뒤에야 캘린더에 들어갑니다.

## 역할

- **최종 관리자** (`admin`): 모든 가입 승인, 가족 만들기, 구성원을 가족에 넣고 그룹장 권한 부여
- **가족 그룹장**: 자기 가족 가입 승인, 가족 사진 등록
- **구성원**: 자기 가족 일정 조회/작성, 게임

가족은 여러 개일 수 있습니다. A 가족은 A 일정만, B 가족은 B 일정만 봅니다.

## 지금 되는 기능

### 캘린더

- 월간만 봅니다. 상단 화살표와 좌우 슬라이드로 달을 바꿉니다.
- 설날, 추석, 연휴, 대체공휴일이 들어 있습니다. (음력은 2024~2032)
- 일정은 시작일~종료일, 기본 시간 09:00~18:00
- 날짜·시간은 앱 안의 달력/시계 창에서 고릅니다.
- 작성자와 관리자(최종/그룹장)만 수정·삭제합니다.
- 같은 가족이 새 일정을 올리면 알림이 옵니다. 브라우저 푸시도 켤 수 있습니다.

### 가족 사진

- 캘린더 배경으로 쓰지 않습니다.
- 그룹장이 **관리 → 배경**에서 올립니다. 핸드폰 **세로 사진**이 잘 맞습니다.
- 로그인할 때 그 사진이 한 번 크게 보입니다. 화면을 누르면 캘린더로 갑니다.
- 새 사진을 올리면 예전 파일은 서버에서 지웁니다. 가족당 한 장만 남습니다.

### 게임

- `/game` 목록
- **오목**: 15줄 기본 오목. 컴퓨터와 두거나, 같은 가족 두 명이 둡니다

### 화면

- 연한 크림/분홍, 과하게 예쁘장하지 않게
- 모바일 우선, 반응형
- 삭제 확인 등은 브라우저 기본 창이 아니라 앱 카드입니다.

## 화면 경로

| 경로 | 설명 |
|---|---|
| `/login`, `/register` | 로그인, 가입 |
| `/pending` | 승인 대기 |
| `/calendar` | 월간 캘린더 |
| `/game` | 게임 목록 |
| `/game/omok` | 오목 (`?mode=cpu` 또는 `?mode=pvp`) |
| `/admin` | 가입 승인, 가족, 배경, 구성원 |

아래 메뉴: 캘린더, 게임, (관리자만) 관리, 일정 추가

## 주요 API

로그인 필요 API는 `Authorization: Bearer <token>`을 붙입니다.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/admin/pending-users`, `PATCH /api/admin/users/:id/status`
- `GET /api/admin/families`, `POST /api/admin/families`
- `POST /api/admin/families/:id/background`
- `PATCH /api/admin/users/:id/family`
- `GET /api/events?from=&to=`, `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`
- `GET /api/omok`, `POST /api/omok/cpu/start`, `POST /api/omok/cpu/act`
- `POST /api/omok/join|leave|start|act`
- `GET /api/covers/:file` 가족 사진 파일
- `GET /api/health`

일정 본문: `{ title, description, eventDate, endDate, startTime, endTime, color, isFamilyEvent }`  
`isFamilyEvent`가 참이면 중요일정으로 강조된다. 올린 집은 서버가 등록자 소가족으로 정한다.  
날짜 `YYYY-MM-DD`, 시간 `HH:MM`

## 폴더

```
C:\family-calendar
├── README.md
├── AGENTS.md
├── docs/HANDBOOK.md
├── docs/DEPLOY.md       Oracle + Cloudflare 배포
├── deploy/              서버에 올리는 스크립트
├── backend/src          API, SQLite, 오목 방
├── backend/data         DB, 가족 사진, VAPID
└── frontend/src         화면, 스타일
```

데이터 파일은 `backend/data/family-calendar.db`입니다. 운영 중인 사이트의 DB와 관리 방법은 [docs/OPERATIONS.md](docs/OPERATIONS.md)에 있습니다. 초기화하려면 서버를 끄고 이 파일을 지운 뒤 다시 켭니다. 관리자만 다시 생깁니다.

## 인터넷에 올리기

Oracle 무료 VM과 Cloudflare 도메인으로 올리는 순서는 [docs/DEPLOY.md](docs/DEPLOY.md)에 있습니다. PC에서 `deploy/publish.ps1`을 실행하면 화면 빌드와 서버 설치까지 진행됩니다.

## 아직 없는 것

- 기록/일기
- 반복 일정
- 자동 테스트
