Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow

# Stop all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Waiting for processes to stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting Docker containers..." -ForegroundColor Green
docker-compose up -d

Write-Host "Waiting for Docker services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting Backend API on port 4000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\backend; `$env:API_PORT='4000'; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "Starting WebSocket Server on port 3003..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\ws; `$env:WS_PORT='3003'; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "Starting Frontend on port 3005..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\web; `$env:NEXT_PUBLIC_APP_URL='http://localhost:3005'; `$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; `$env:NEXT_PUBLIC_WS_URL='ws://localhost:3003'; npm run dev -- --port 3005" -WindowStyle Minimized

Write-Host ""
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3005" -ForegroundColor White
Write-Host "- Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "- WebSocket: ws://localhost:3003" -ForegroundColor White
Write-Host "- PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host ""

# Open the browser after a delay
Start-Sleep -Seconds 10
Start-Process "http://localhost:3005"