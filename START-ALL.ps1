#!/usr/bin/env pwsh
$Host.UI.RawUI.WindowTitle = "TURNUVAYONETIM - TUM SERVISLERI BASLAT"
$Host.UI.RawUI.ForegroundColor = "Green"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       TURNUVAYONETIM - PROFESYONEL POKER" -ForegroundColor Yellow
Write-Host "       TURNUVA YONETIM SISTEMI" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Port Yapilandirmasi:" -ForegroundColor White
Write-Host "  - Frontend (Next.js)  : 3005" -ForegroundColor Green
Write-Host "  - Backend API         : 4000" -ForegroundColor Green
Write-Host "  - WebSocket Server    : 3003" -ForegroundColor Green
Write-Host "  - PostgreSQL          : 5432" -ForegroundColor Blue
Write-Host "  - Redis               : 6379" -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Tum portlari temizliyorum..." -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Port 3005'i temizle
$port3005 = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue
if ($port3005) {
    $port3005 | ForEach-Object {
        Write-Host "  Port 3005 temizleniyor (PID: $($_.OwningProcess))..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Port 4000'i temizle
$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port4000) {
    $port4000 | ForEach-Object {
        Write-Host "  Port 4000 temizleniyor (PID: $($_.OwningProcess))..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Port 3003'ü temizle
$port3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($port3003) {
    $port3003 | ForEach-Object {
        Write-Host "  Port 3003 temizleniyor (PID: $($_.OwningProcess))..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "  Portlar temizlendi!" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

Write-Host "[2/4] WebSocket Server baslatiliyor..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
$env:WS_PORT = "3003"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\ws'; `$env:WS_PORT='3003'; npm run dev" -WindowStyle Minimized
Write-Host "  WebSocket Server port 3003'te baslatildi" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3

Write-Host "[3/4] Backend API baslatiliyor..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
$env:API_PORT = "4000"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/tournament"
$env:JWT_SECRET = "your-jwt-secret-key"
$env:SESSION_SECRET = "your-session-secret"
$env:REDIS_URL = "redis://localhost:6379"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\backend'; `$env:API_PORT='4000'; `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/tournament'; `$env:JWT_SECRET='your-jwt-secret-key'; `$env:SESSION_SECRET='your-session-secret'; `$env:REDIS_URL='redis://localhost:6379'; npm run dev" -WindowStyle Minimized
Write-Host "  Backend API port 4000'de baslatildi" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3

Write-Host "[4/4] Frontend baslatiliyor..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
$env:PORT = "3005"
$env:NEXT_PUBLIC_APP_URL = "http://localhost:3005"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\web'; `$env:PORT='3005'; `$env:NEXT_PUBLIC_APP_URL='http://localhost:3005'; npm run dev" -WindowStyle Minimized
Write-Host "  Frontend port 3005'te baslatildi" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "TUM SERVISLER BASARIYLA BASLATILDI!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Erisim Adresleri:" -ForegroundColor White
Write-Host "  - Frontend    : http://localhost:3005" -ForegroundColor Green
Write-Host "  - Backend API : http://localhost:4000" -ForegroundColor Green
Write-Host "  - WebSocket   : ws://localhost:3003" -ForegroundColor Green
Write-Host ""
Write-Host "Tarayici 5 saniye icinde acilacak..." -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 5
Start-Process "http://localhost:3005"

Write-Host ""
Write-Host "Servisleri durdurmak icin bu pencereyi kapatin" -ForegroundColor Yellow
Write-Host "veya Ctrl+C'ye basin." -ForegroundColor Yellow
Write-Host ""
Read-Host "Devam etmek icin Enter'a basin"