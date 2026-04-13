@echo off
echo Starting mock servers for Trail Safety Platform...
echo.
echo Mock Auth Server: http://localhost:3002
echo Mock Reports Server: http://localhost:3003
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.

:: Start mock auth server
start "Mock Auth Server" cmd /k "node test-mock-server.js"

:: Start mock reports server  
start "Mock Reports Server" cmd /k "node test-reports-mock.js"

:: Wait for user to stop
pause
