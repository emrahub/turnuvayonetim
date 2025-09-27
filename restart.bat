@echo off
echo Stopping all services...

:: Kill processes on specific ports
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3005') do taskkill /PID %%p /F 2>nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4000') do taskkill /PID %%p /F 2>nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3003') do taskkill /PID %%p /F 2>nul

:: Wait a moment
timeout /t 2 /nobreak >nul

echo Starting Docker services...
docker-compose up -d

:: Wait for Docker to start
timeout /t 5 /nobreak >nul

echo Starting backend...
start /B cmd /c "cd apps\backend && set API_PORT=4000 && npm run dev"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

echo Starting WebSocket server...
start /B cmd /c "cd apps\ws && set WS_PORT=3003 && npm run dev"

:: Wait for WebSocket to start
timeout /t 3 /nobreak >nul

echo Starting frontend...
start /B cmd /c "cd apps\web && set NEXT_PUBLIC_APP_URL=http://localhost:3005 && set NEXT_PUBLIC_API_URL=http://localhost:4000 && set NEXT_PUBLIC_WS_URL=ws://localhost:3003 && npm run dev -- --port 3005"

echo.
echo All services are starting...
echo.
echo Services will be available at:
echo - Frontend: http://localhost:3005
echo - Backend API: http://localhost:4000
echo - WebSocket: ws://localhost:3003
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo.
echo Press any key to exit...
pause >nul