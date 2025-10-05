#!/usr/bin/env pwsh
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "TURNUVAYONETIM - Frontend Baslat" -ForegroundColor Cyan
Write-Host "Port: 3005" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Port 3005 kontrolü
$port3005 = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue

if ($port3005) {
    Write-Host "[UYARI] Port 3005 kullanimda!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Port 3005'i kullanan prosesleri kapatiyorum..." -ForegroundColor Yellow

    $port3005 | ForEach-Object {
        $pid = $_.OwningProcess
        Write-Host "Process PID $pid kapatiliyor..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Port temizlendi." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Frontend baslatiliyor port 3005'te..." -ForegroundColor Green

# Proje dizinine git
Set-Location "$PSScriptRoot\..\apps\web"

# Ortam değişkenlerini ayarla
$env:PORT = "3005"
$env:NEXT_PUBLIC_APP_URL = "http://localhost:3005"

# Next.js'i başlat
npm run dev