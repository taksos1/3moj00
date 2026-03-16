@echo off
echo Starting 3moj00 Website Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Using Python server instead...
    echo.
    python -m http.server 8000
    goto :end
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the server
echo Starting Node.js server with environment configuration...
node server.js

:end
pause
