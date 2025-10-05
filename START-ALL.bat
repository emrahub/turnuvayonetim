@echo off
title TURNUVAYONETIM - TUM SERVISLERI BASLAT
color 0A

echo =====================================================
echo        TURNUVAYONETIM - PROFESYONEL POKER
echo        TURNUVA YONETIM SISTEMI
echo =====================================================
echo.
echo Port Yapılandırması:
echo   - Frontend (Next.js)  : 3005
echo   - Backend API         : 4000
echo   - WebSocket Server    : 3003
echo   - PostgreSQL          : 5432
echo   - Redis               : 6379
echo =====================================================
echo.

echo [1/4] Tum portlari temizliyorum...
echo ----------------------------------------

REM Port 3005'i temizle
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005') do (
    echo   Port 3005 temizleniyor (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

REM Port 4000'i temizle
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo   Port 4000 temizleniyor (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

REM Port 3003'ü temizle
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    echo   Port 3003 temizleniyor (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

echo   Portlar temizlendi!
echo.
timeout /t 2 >nul

echo [2/4] WebSocket Server baslatiliyor...
echo ----------------------------------------
start "TURNUVA - WebSocket (3003)" cmd /k "cd /d %~dp0apps\ws && set WS_PORT=3003 && npm run dev"
echo   WebSocket Server port 3003'te baslatildi
echo.
timeout /t 3 >nul

echo [3/4] Backend API baslatiliyor...
echo ----------------------------------------
start "TURNUVA - Backend API (4000)" cmd /k "cd /d %~dp0apps\backend && set API_PORT=4000 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament && set JWT_SECRET=your-jwt-secret-key && set SESSION_SECRET=your-session-secret && set REDIS_URL=redis://localhost:6379 && npm run dev"
echo   Backend API port 4000'de baslatildi
echo.
timeout /t 3 >nul

echo [4/4] Frontend baslatiliyor...
echo ----------------------------------------
start "TURNUVA - Frontend (3005)" cmd /k "cd /d %~dp0apps\web && set PORT=3005 && set NEXT_PUBLIC_APP_URL=http://localhost:3005 && npm run dev"
echo   Frontend port 3005'te baslatildi
echo.
timeout /t 3 >nul

echo =====================================================
echo TUM SERVISLER BASARIYLA BASLATILDI!
echo =====================================================
echo.
echo Erisim Adresleri:
echo   - Frontend    : http://localhost:3005
echo   - Backend API : http://localhost:4000
echo   - WebSocket   : ws://localhost:3003
echo.
echo Tarayici 5 saniye icinde acilacak...
echo.
timeout /t 5 >nul
start http://localhost:3005

echo.
echo Servisleri durdurmak icin bu pencereyi kapatin
echo veya Ctrl+C'ye basin.
echo.
pause