@echo off
echo ===================================
echo TURNUVAYONETIM - Backend API Baslat
echo Port: 4000
echo ===================================
echo.

REM Port 4000'i kontrol et
netstat -an | findstr :4000 >nul
if %errorlevel% == 0 (
    echo [UYARI] Port 4000 kullanımda!
    echo.
    echo Port 4000'i kullanan prosesleri kapatiyorum...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
        echo Process PID %%a kapatiliyor...
        taskkill /f /pid %%a >nul 2>&1
    )
    echo Port temizlendi.
    echo.
)

echo Backend API baslatiliyor port 4000'de...
cd /d "%~dp0\..\apps\backend"

REM PORT değişkenini zorla 4000 olarak ayarla
set API_PORT=4000
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament
set JWT_SECRET=your-jwt-secret-key
set SESSION_SECRET=your-session-secret
set REDIS_URL=redis://localhost:6379

REM Backend'i başlat
npm run dev

pause