@echo off
echo Starting Finance App Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
