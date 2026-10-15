#!/usr/bin/env bash
# Ubuntu 서버에 가족캘린더를 설치한다.
# 코드는 /opt/family-calendar 에 이미 있어야 한다.
# Oracle은 ubuntu 계정, Vultr는 root 계정으로 접속한다.
set -euo pipefail

APP_DIR="/opt/family-calendar"
DOMAIN="${DOMAIN:?DOMAIN 이 필요합니다. 예: family.example.com}"
EMAIL="${EMAIL:?EMAIL 이 필요합니다. 인증서 만료 알림을 받을 주소}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo로 실행하세요."
  exit 1
fi

if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  RUN_USER="${SUDO_USER}"
else
  RUN_USER="root"
fi

if [[ ! "$DOMAIN" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]]; then
  echo "도메인 형식이 아닙니다: ${DOMAIN}"
  exit 1
fi

if [[ ! -d "${APP_DIR}/backend" || ! -d "${APP_DIR}/frontend" ]]; then
  echo "코드가 ${APP_DIR} 에 없습니다."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "iptables-persistent iptables-persistent/autosave_v4 boolean true" | debconf-set-selections
echo "iptables-persistent iptables-persistent/autosave_v6 boolean true" | debconf-set-selections

apt-get update
apt-get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https iptables-persistent

if ! command -v node >/dev/null 2>&1 || ! node -e "import('node:sqlite')" >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

node -e "import('node:sqlite').then(() => console.log('node:sqlite ok'))"

if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
if [[ "$mem_mb" -lt 1800 && ! -f /swapfile ]]; then
  fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}"
install -d -o "${RUN_USER}" -g "${RUN_USER}" "${APP_DIR}/backend/data"

if [[ ! -f "${APP_DIR}/backend/.env" ]]; then
  ADMIN_PASSWORD="$(printf '%s' "${ADMIN_PASSWORD}" | tr '[:upper:]' '[:lower:]')"
  if [[ ! "${ADMIN_PASSWORD}" =~ ^[a-z0-9]{1,6}$ || "${ADMIN_PASSWORD}" == "123456" ]]; then
    echo "관리자 비밀번호는 123456이 아닌 영문/숫자 1~6자여야 합니다."
    exit 1
  fi

  jwt="$(openssl rand -hex 32)"
  cat > "${APP_DIR}/backend/.env" <<EOF
PORT=4000
HOST=127.0.0.1
NODE_ENV=production
JWT_SECRET=${jwt}
ADMIN_LOGIN_ID=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=관리자
VAPID_SUBJECT=mailto:${EMAIL}
EOF
  chown "${RUN_USER}:${RUN_USER}" "${APP_DIR}/backend/.env"
  chmod 600 "${APP_DIR}/backend/.env"
else
  echo "기존 backend/.env 를 그대로 둡니다."
fi

grep -q '^NODE_ENV=' "${APP_DIR}/backend/.env" || echo 'NODE_ENV=production' >> "${APP_DIR}/backend/.env"
grep -q '^HOST=' "${APP_DIR}/backend/.env" || echo 'HOST=127.0.0.1' >> "${APP_DIR}/backend/.env"
grep -q '^VAPID_SUBJECT=' "${APP_DIR}/backend/.env" || echo "VAPID_SUBJECT=mailto:${EMAIL}" >> "${APP_DIR}/backend/.env"

sudo -u "${RUN_USER}" npm install --omit=dev --prefix "${APP_DIR}/backend"

if [[ ! -f "${APP_DIR}/frontend/dist/index.html" ]]; then
  echo "frontend/dist 가 없습니다. PC에서 빌드한 뒤 다시 올리세요."
  exit 1
fi

NODE_BIN="$(command -v node)"
cat > /etc/systemd/system/family-calendar.service <<EOF
[Unit]
Description=Family Calendar
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${NODE_BIN} src/index.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable family-calendar
systemctl restart family-calendar

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:4000/api/health >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:4000/api/health
echo

cat > /etc/caddy/Caddyfile <<EOF
{
	email ${EMAIL}
}

${DOMAIN} {
	encode gzip
	reverse_proxy 127.0.0.1:4000
}
EOF

systemctl enable caddy
systemctl restart caddy

open_port() {
  local port="$1"
  if iptables -C INPUT -p tcp --dport "${port}" -m state --state NEW -j ACCEPT 2>/dev/null; then
    return
  fi
  if ! iptables -I INPUT 6 -m state --state NEW -p tcp --dport "${port}" -j ACCEPT 2>/dev/null; then
    iptables -I INPUT -m state --state NEW -p tcp --dport "${port}" -j ACCEPT
  fi
}

open_port 80
open_port 443
netfilter-persistent save || true

echo
echo "서버 설치가 끝났습니다."
echo "브라우저에서 https://${DOMAIN} 를 여세요."
echo "관리자 아이디는 admin 이고, 비밀번호는 이 스크립트에 넣은 값입니다."
echo "서버를 다시 시작해도 그 비밀번호로 돌아갑니다. 바꾸려면 ${APP_DIR}/backend/.env 의 ADMIN_PASSWORD 를 고치고 sudo systemctl restart family-calendar 를 실행하세요."
