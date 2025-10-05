@echo off
echo ===================================
echo TURNUVAYONETIM - Frontend Baslat
echo Port: 3005
echo ===================================
echo.

REM Port 3005'i kontrol et
netstat -an | findstr :3005 >nul
if %errorlevel% == 0 (
    echo [UYARI] Port 3005 kullanımda!
    echo.
    echo Port 3005'i kullanan prosesleri kapatiyorum...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005') do (
        echo Process PID %%a kapatiliyor...
        taskkill /f /pid %%a >nul 2>&1
    )
    echo Port temizlendi.
    echo.
)

echo Frontend baslatiliyor port 3005'te...
cd /d "%~dp0\..\apps\web"

REM PORT değişkenini zorla 3005 olarak ayarla
set PORT=3005
set NEXT_PUBLIC_APP_URL=http://localhost:3005

REM Next.js'i sabit portta başlat (otomatik port değişimini engelle)
npm run dev

pause