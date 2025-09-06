@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    WhoisHuman Game Launcher
echo ========================================
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check environment variable
if defined DEEPSEEK_API_KEY (
    echo [OK] DEEPSEEK_API_KEY environment variable detected
) else (
    echo [Warning] DEEPSEEK_API_KEY not found
    echo Game can still run via config file
)

echo.
echo Starting development server...
echo Access URL: http://localhost:3001
echo Press Ctrl+C to stop server
echo.

REM Start server
call npm start

pause