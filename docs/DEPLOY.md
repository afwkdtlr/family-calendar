# 서버에 올리기

지금 쓰는 방법은 Vultr 서울 서버(월 5달러)와 Cloudflare 도메인이다. Oracle 절차는 아래쪽에 남겨 둔다.

## Vultr 5달러 서버 만들기

가입과 서버 생성: [vultr.com](https://www.vultr.com/)

로그인 뒤 서버 만들기: [my.vultr.com/deploy](https://my.vultr.com/deploy/)

요금표에서 5달러 칸을 확인한다: [vultr.com/pricing](https://www.vultr.com/pricing/)

1. 가입하고 카드를 등록한다. 월 5달러 상품만 만들면 그 금액대로 청구된다.
2. Deploy에서 상품 종류는 Cloud Compute, Regular Performance를 고른다. Optimized, High Performance, High Frequency, GPU, Bare Metal은 더 비싸다.
3. 위치는 Seoul.
4. 운영체제는 Ubuntu 24.04 LTS x64.
5. 크기는 1 vCPU, 1 GB RAM, 25 GB, 월 5달러. 월 2.50달러는 외부 IP가 없고, 월 3.50달러는 메모리가 512MB다.
6. Automatic Backups와 유료 추가 옵션은 끈다.
7. SSH Keys에 공개키 한 줄을 붙인다. PC에 키가 없으면 PowerShell에서 만든다.

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\oracle.key -N '""'
Get-Content $env:USERPROFILE\.ssh\oracle.key.pub
```

8. Deploy Now를 누르고 상태가 Running이 되면 IP Address를 적는다.
9. 접속 계정은 `root`다.

도메인은 [dash.cloudflare.com](https://dash.cloudflare.com)에서 사고, DNS의 A 레코드를 이 IP로 둔다. 처음에는 회색 구름(DNS only)으로 둔다. `nslookup 도메인`이 Vultr IP와 같아지면 PC에서 올린다.

```powershell
cd C:\family-calendar
powershell -ExecutionPolicy Bypass -File .\deploy\publish.ps1 -Ip 공인IP -Domain 구입한도메인 -Email 본인이메일 -User root
```

# Oracle Cloud + Cloudflare에 올리기

가족캘린더는 Node 서버 하나가 화면과 API, SQLite, 가족 사진을 같이 담당합니다. 서버는 Oracle 평생 무료 VM, 도메인과 HTTPS는 Cloudflare를 씁니다.

도메인 값만 1년에 약 1만 원대입니다. VM 요금이 0원이려면 아래 한도를 넘기면 안 됩니다.

- 인스턴스 1대
- 모양이 Always Free인 것만 (Ampere 1 OCPU / 2GB, 또는 AMD Micro 1GB)
- 부팅 디스크 50GB 이하
- 공인 IP 1개

가입 후 30일이 지나면 체험 계정은 서버가 꺼집니다. 결제 수단을 등록하고 Pay As You Go로 올린 뒤, Always Free 모양만 쓰면 청구액은 0원입니다.

개발 PC의 `npm run dev`는 그대로입니다. 아래는 서버에 올릴 때만 합니다.

## 1. SSH 키

PowerShell:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\oracle.key -N '""'
Get-Content $env:USERPROFILE\.ssh\oracle.key.pub
```

나온 한 줄을 Oracle 인스턴스를 만들 때 붙여 넣습니다. `oracle.key`는 비밀키라 어디에도 올리지 않습니다.

## 2. Oracle VM

1. [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)에서 가입합니다. 카드는 본인 확인용입니다.
2. 청구를 Pay As You Go로 올립니다. Always Free 한도 안이면 요금은 나가지 않습니다.
3. 리전은 서울 또는 춘천을 고릅니다.
4. Compute, Instances, Create instance.
5. 이미지는 Canonical Ubuntu 24.04.
6. 모양은 Always Free가 보이는 것만 고릅니다. Ampere가 용량 없음이면 가용 도메인을 바꾸거나 AMD Micro로 갑니다.
7. 네트워킹에서 공인 IPv4를 켭니다.
8. SSH 키에 1번에서 복사한 공개키를 붙입니다.
9. 만든 뒤 공인 IP를 적어둡니다.

포트는 보안 목록과 서버 방화벽 둘 다 열려야 합니다. 서버 쪽은 설치 스크립트가 80, 443을 엽니다. Oracle 콘솔은 직접 엽니다.

인스턴스 상세에서 서브넷의 Security List, 인스턴스에 NSG가 있으면 거기에도 수신 규칙을 추가합니다.

| 소스 | 프로토콜 | 포트 |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 443 |

22번(SSH)은 보통 이미 열려 있습니다. 4000번은 열지 않습니다. 앱은 서버 안에서만 듣고, 밖에서는 Caddy가 80/443으로 받습니다.

## 3. Cloudflare 도메인

1. [dash.cloudflare.com](https://dash.cloudflare.com)에서 도메인을 삽니다. 갱신 가격이 안정적인 `.com`이 오래 쓰기 좋습니다.
2. DNS에서 A 레코드를 추가합니다.
   - 이름: `@`
   - 값: Oracle 공인 IP
   - 프록시: DNS only (회색 구름)
3. 주황 구름은 사이트가 `https://도메인`으로 열린 다음에 켭니다. 먼저 켜면 인증서 발급이 실패할 수 있습니다.

몇 분 뒤 PC에서 확인합니다.

```powershell
nslookup 구입한도메인
```

주소가 Oracle IP와 같아야 합니다.

## 4. PC에서 서버로 올리기

저장소 루트에서:

```powershell
cd C:\family-calendar
powershell -ExecutionPolicy Bypass -File .\deploy\publish.ps1 -Ip 공인IP -Domain 구입한도메인 -Email 본인이메일
```

예:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\publish.ps1 -Ip 1.2.3.4 -Domain kim-family.com -Email you@example.com
```

비밀번호를 물어봅니다. 로그인 칸이 6자라서, `123456`이 아닌 영문/숫자 1~6자로 정합니다. 스크립트는 소문자로 저장합니다.

이 명령이 하는 일:

1. 화면을 빌드합니다.
2. 코드만 서버로 보냅니다. PC의 DB, 가족 사진, `.env`는 올리지 않습니다. 서버는 새 가족캘린더로 시작합니다.
3. Node 22, Caddy, systemd 서비스를 설치합니다.
4. `https://도메인` 인증서를 받습니다.

끝난 뒤 브라우저에서 `https://도메인`을 열고 `admin`과 방금 정한 비밀번호로 로그인합니다.

인증서가 바로 안 나오면 DNS가 아직입니다. 10분 정도 뒤에 서버에서 다음만 다시 실행합니다.

```bash
sudo systemctl restart caddy
```

## 5. Cloudflare 프록시 켜기

사이트가 HTTPS로 열린 뒤:

1. DNS의 A 레코드를 주황 구름(Proxied)으로 바꿉니다.
2. SSL/TLS 암호화 모드는 Full (strict).
3. Always Use HTTPS를 켭니다.

일정 알림과 웹 푸시는 쓰지 않습니다.

## 다시 올릴 때

코드를 고친 뒤 같은 `publish.ps1`을 다시 실행합니다. 서버의 DB와 가족 사진, 이미 만든 `.env`는 유지됩니다.

관리자 비밀번호는 서버가 켜질 때마다 `.env`의 `ADMIN_PASSWORD`로 맞춰집니다. 바꾸려면 서버에 SSH로 들어가 `/opt/family-calendar/backend/.env`를 고치고 재시작합니다.

```bash
ssh -i $env:USERPROFILE\.ssh\oracle.key ubuntu@공인IP
sudo systemctl restart family-calendar
```

## 백업

가끔 이 두 개만 복사해 두면 됩니다.

- `/opt/family-calendar/backend/data/family-calendar.db`
- `/opt/family-calendar/backend/data/family-covers/`

## 막힐 때

| 증상 | 확인할 곳 |
|---|---|
| SSH가 안 됨 | 보안 목록 22번, `ubuntu` 계정, `oracle.key` 경로 |
| 사이트 연결 안 됨 | 보안 목록 80/443, `nslookup`이 Oracle IP인지 |
| 인증서 오류 | A 레코드가 회색 구름인지, `sudo systemctl restart caddy` |
| 화면은 안 뜨고 API만 됨 | `frontend/dist` 없이 올라간 것. `publish.ps1`을 다시 실행 |
| 앱이 바로 죽음 | `sudo journalctl -u family-calendar -n 50 --no-pager` |
