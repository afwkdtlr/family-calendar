# 행복한 창녕조씨 운영 메뉴얼

사이트 주소는 [https://pjs94dev.com](https://pjs94dev.com) 입니다.

서버는 Vultr 서울, IP `158.247.212.82` 입니다. 도메인은 Cloudflare에 있습니다.

## 로그인

| 구분 | 값 |
|---|---|
| 주소 | https://pjs94dev.com/login |
| 최종 관리자 아이디 | `admin` |
| 비밀번호 | 서버 파일의 `ADMIN_PASSWORD` |

비밀번호는 영문 소문자와 숫자 6자입니다. 서버를 다시 켜면 `.env`에 적힌 값으로 돌아갑니다.

가입은 이메일이 아닙니다. 아이디는 영문, 숫자, `_` 로 2~20자입니다. 가입 직후에는 승인 대기이고, 관리자가 가족을 정해 승인한 뒤에 달력이 보입니다.

## 관리자가 하는 일

로그인 후 아래 메뉴의 **관리**로 들어갑니다.

1. **가입 승인**: 대기 중인 사람을 가족에 넣고 승인합니다. 거절할 수도 있습니다.
2. **가족 만들기**: 가족이 여러 개면 일정은 서로 보이지 않습니다.
3. **구성원**: 누구를 어느 가족에 둘지, 가족 그룹장으로 둘지 정합니다.
4. **배경**: 가족 그룹장이 로그인 화면에 나올 사진을 올립니다. 세로 사진이 잘 맞습니다. 달력 배경으로는 쓰지 않습니다.

일정은 작성자, 최종 관리자, 같은 가족 그룹장만 고치거나 지울 수 있습니다.

## DB는 어디에 있나

실제 일정과 회원은 PC가 아니라 **서버 안의 파일 하나**입니다.

```text
/opt/family-calendar/backend/data/family-calendar.db
```

가족 사진은 같은 폴더의 `family-covers` 입니다. 가족당 한 장입니다.

PC의 `C:\family-calendar\backend\data\family-calendar.db` 는 개발용입니다. 사이트에 가입한 사람과 일정은 여기 없습니다.

화면에서 보려면 관리 메뉴와 달력이면 됩니다. 파일 내용이 필요하면 서버에 들어가 조회합니다.

PowerShell:

```powershell
ssh -i $env:USERPROFILE\.ssh\oracle.key root@158.247.212.82
```

서버에서 회원 목록:

```bash
cd /opt/family-calendar/backend
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('./data/family-calendar.db'); console.table(db.prepare('SELECT ID, EMAIL AS LOGIN_ID, NAME, ROLE, STATUS, FAMILY_ID FROM USERS').all());"
```

일정 목록:

```bash
node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync('./data/family-calendar.db'); console.table(db.prepare('SELECT ID, TITLE, EVENT_DATE, END_DATE, FAMILY_ID FROM EVENTS ORDER BY EVENT_DATE').all());"
```

`EMAIL` 칸이 로그인 아이디입니다. 비밀번호는 암호로 저장되어 있어 이 조회로는 보이지 않습니다.

파일을 지우거나 다른 파일로 바꾸려면 먼저 앱을 멈춥니다.

```bash
systemctl stop family-calendar
```

다 보면 다시 켭니다.

```bash
systemctl start family-calendar
```

## 백업

가끔 이 두 가지만 PC로 복사해 두면 됩니다.

```powershell
scp -i $env:USERPROFILE\.ssh\oracle.key root@158.247.212.82:/opt/family-calendar/backend/data/family-calendar.db $env:USERPROFILE\Desktop\
scp -i $env:USERPROFILE\.ssh\oracle.key -r root@158.247.212.82:/opt/family-calendar/backend/data/family-covers $env:USERPROFILE\Desktop\
```

바탕화면에 `family-calendar.db` 와 `family-covers` 폴더가 생깁니다.

## 서버가 이상할 때

앱과 인증서는 서비스 두 개입니다.

```bash
systemctl status family-calendar
systemctl status caddy
systemctl restart family-calendar
```

앱이 바로 죽으면 최근 로그를 봅니다.

```bash
journalctl -u family-calendar -n 50 --no-pager
```

사이트가 안 열리면 Cloudflare DNS의 A 레코드가 `158.247.212.82` 인지 확인합니다. 처음 연결은 회색 구름(DNS only)입니다.

## 코드를 다시 올릴 때

PC의 `C:\family-calendar` 에서 실행합니다. 서버의 DB, 사진, 비밀번호 파일은 유지됩니다.

```powershell
cd C:\family-calendar
powershell -ExecutionPolicy Bypass -File .\deploy\publish.ps1 -Ip 158.247.212.82 -Domain pjs94dev.com -Email admin@pjs94dev.com -User root -AdminPassword 현재비밀번호
```

## 요금

Vultr 서버는 월 5달러입니다. 도메인 `pjs94dev.com` 은 Cloudflare에서 1년마다 갱신됩니다. 자동 갱신이 켜져 있습니다.
