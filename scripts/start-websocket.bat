@echo off
echo ===================================
echo TURNUVAYONETIM - WebSocket Server Baslat
echo Port: 3003
echo ===================================
echo.

REM Port 3003'ü kontrol et
netstat -an | findstr :3003 >nul
if %errorlevel% == 0 (
    echo [UYARI] Port 3003 kullanımda!
    echo.
    echo Port 3003'ü kullanan prosesleri kapatiyorum...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
        echo Process PID %%a kapatiliyor...
        taskkill /f /pid %%a >nul 2>&1
    )
    echo Port temizlendi.
    echo.
)

echo WebSocket Server baslatiliyor port 3003'te...
cd /d "%~dp0\..\apps\ws"

REM PORT değişkenini zorla 3003 olarak ayarla
set WS_PORT=3003
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
set REDIS_URL=redis://localhost:6379

REM WebSocket sunucusunu başlat
npm run dev

pause