param(
  [Parameter(Mandatory = $true)][string]$Ip,
  [Parameter(Mandatory = $true)][string]$Domain,
  [Parameter(Mandatory = $true)][string]$Email,
  [string]$Key = "$env:USERPROFILE\.ssh\oracle.key",
  [string]$User = "ubuntu",
  [string]$AdminPassword
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Domain = $Domain.Trim().ToLower()
$Email = $Email.Trim()

if ($Domain -notmatch '^[a-z0-9.-]+\.[a-z]{2,}$') {
  throw "Domain must look like family.example.com"
}
if ($Email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
  throw "Email is for the HTTPS certificate notice. Example: you@example.com"
}
if (-not (Test-Path $Key)) {
  throw "SSH private key not found: $Key"
}

if (-not $AdminPassword) {
  $AdminPassword = Read-Host "Admin password (1-6 letters or digits, not 123456)"
}
$AdminPassword = $AdminPassword.Trim().ToLower()
if ($AdminPassword -notmatch '^[a-z0-9]{1,6}$' -or $AdminPassword -eq "123456") {
  throw "Password must be 1-6 letters/digits and must not be 123456."
}

Write-Host "Building the site..."
Push-Location $root
try {
  npm run build --prefix frontend
  if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed."
  }
}
finally {
  Pop-Location
}

if (-not (Test-Path (Join-Path $root "frontend\dist\index.html"))) {
  throw "frontend/dist/index.html was not created."
}

$tar = Join-Path $env:TEMP "family-calendar-deploy.tar"
if (Test-Path $tar) {
  Remove-Item $tar -Force
}

Write-Host "Packing the project..."
tar -cf $tar `
  --exclude=node_modules `
  --exclude=backend/data `
  --exclude=backend/.env `
  --exclude=.git `
  --exclude=.cursor `
  -C $root .

Write-Host "Uploading to ${User}@${Ip} ..."
scp -i $Key -o StrictHostKeyChecking=accept-new $tar "${User}@${Ip}:/tmp/family-calendar-deploy.tar"
if ($LASTEXITCODE -ne 0) {
  throw "Upload failed."
}

$remote = @"
set -euo pipefail
sudo mkdir -p /opt/family-calendar
sudo tar -xf /tmp/family-calendar-deploy.tar -C /opt/family-calendar
sudo chown -R ${User}:${User} /opt/family-calendar
sudo DOMAIN='${Domain}' EMAIL='${Email}' ADMIN_PASSWORD='${AdminPassword}' bash /opt/family-calendar/deploy/setup-server.sh
rm -f /tmp/family-calendar-deploy.tar
"@
$remote = $remote -replace "`r", ""

Write-Host "Installing Node, Caddy, and the app..."
$remote | ssh -i $Key -o StrictHostKeyChecking=accept-new "${User}@${Ip}" "bash -s"
if ($LASTEXITCODE -ne 0) {
  throw "Server install failed."
}

Write-Host ""
Write-Host "Done. Open https://${Domain}"
Write-Host "Login id: admin"
Write-Host "Password: the value you just entered. The server keeps that password in /opt/family-calendar/backend/.env"
