# 가족캘린더 — AI 작업 지침

코드를 바꾸기 전에 `README.md`와 `docs/HANDBOOK.md`를 먼저 읽는다.

## 프로젝트

- 경로: `C:\family-calendar`
- 프론트: React + Vite, `http://localhost:5173`
- 백엔드: Node.js Express, `http://localhost:4000`
- DB: SQLite `backend/data/family-calendar.db`
- Java/JDK/`JAVA_HOME`/다른 Java 프로젝트 설정은 변경하지 않는다.

## 구조

- `backend/src/routes` URL 매핑
- `backend/src/controllers` 요청 처리
- `backend/src/models` SQL
- `backend/src/middleware` JWT, 관리자
- `backend/src/game` 오목 규칙·방
- `frontend/src/pages` 화면
- `frontend/src/components` 재사용 UI
- `frontend/src/context` 로그인/확인창
- `frontend/src/api/client.js` API 호출

기능 추가 순서: DB → model → controller → route → `index.js` 등록 → page/component → `App.jsx`

## 깨면 안 되는 규칙

- 가입 기본값 `MEMBER` + `PENDING`. 승인 전 캘린더 금지
- 일정은 가족 단위로 격리. 초가족 그룹(아이들 그룹) 개념은 없음
- 최종 관리자(`ROLE=ADMIN`)는 전체 승인·가족 배정. 가족 그룹장은 `IS_FAMILY_ADMIN`
- 수정/삭제는 작성자, 최종 관리자, 또는 같은 가족 그룹장
- 할 일/주간 캘린더는 제거된 상태. 다시 넣지 말 것
- 가족 사진은 로그인 환영 화면용. 캘린더 배경으로 쓰지 말 것
- 사진 교체/가족 삭제 시 예전 커버 파일은 서버에서 지울 것
- UI는 연한 크림/분홍, 반응형, 브라우저 `alert`/`confirm` 대신 `AlertContext`
- 테이블/컬럼은 대문자 스네이크, JS는 camelCase
- Lombok/JPA 사용 안 함. 이 저장소는 Node 프로젝트다

## 실행

```bash
cd C:\family-calendar
npm run dev
```

관리자 아이디: `admin` / 비밀번호: `123456` (소문자, 6자 안). 가입은 이메일이 아니라 간단한 아이디.
