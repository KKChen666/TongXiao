@echo off
chcp 65001 >nul
REM ============================================================
REM TongXiao Frontend Deploy Script (Windows)
REM Location: deploy/release/deploy-frontend.bat
REM
REM Features:
REM   1. Build frontend project
REM   2. Upload build artifacts to server
REM   3. Restart frontend Docker container
REM   4. Verify service status
REM
REM Usage:
REM   deploy-frontend.bat              # Full deploy (build + upload + restart)
REM   deploy-frontend.bat build        # Build only
REM   deploy-frontend.bat upload       # Upload + restart, skip build
REM   deploy-frontend.bat restart      # Restart only
REM   deploy-frontend.bat clean        # Clean build artifacts
REM ============================================================

setlocal enabledelayedexpansion

REM Server configuration
set "SERVER_IP=119.45.182.166"
set "SERVER_USER=root"
set "SERVER_PATH=/root/tongxiao"
set "PEM_FILE=%~dp0TencentSSHKey.pem"
set "SSH_OPTS=-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes"

REM Local paths
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "DIST_DIR=%FRONTEND_DIR%\dist"
set "DEPLOY_DIR=%PROJECT_ROOT%\deploy"

echo ============================================
echo  TongXiao Frontend Deploy Script
echo ============================================
echo.

REM Handle parameters
if "%1"=="clean" goto :clean
if "%1"=="build" goto :build_only
if "%1"=="upload" goto :check_env
if "%1"=="restart" goto :check_env
if "%1"=="" goto :check_env

echo [ERROR] Unknown parameter: %1
echo Usage: deploy-frontend.bat [build^|upload^|restart^|clean]
goto :error

:clean
echo [==] Cleaning build artifacts...
if exist "%DIST_DIR%" (
    rmdir /s /q "%DIST_DIR%"
    echo [OK] Cleaned %DIST_DIR%
)
if exist "%SCRIPT_DIR%dist" (
    rmdir /s /q "%SCRIPT_DIR%dist"
    echo [OK] Cleaned %SCRIPT_DIR%dist
)
echo [OK] Clean completed
goto :end

:build_only
echo [Mode] Build only
echo.
goto :build

:check_env
REM Check PEM file
echo [CHECK] Checking SSH key file...
if not exist "%PEM_FILE%" (
    echo [ERROR] SSH key file not found: %PEM_FILE%
    echo         Please place the server key file in this directory as TencentSSHKey.pem
    goto :error
)
echo [OK] SSH key file found

REM Check SSH/SCP client
echo [CHECK] Checking SSH/SCP client...
where ssh >nul 2>&1
if errorlevel 1 (
    echo [ERROR] SSH client not found, please install OpenSSH or Git for Windows
    goto :error
)
where scp >nul 2>&1
if errorlevel 1 (
    echo [ERROR] SCP client not found, please install OpenSSH or Git for Windows
    goto :error
)
echo [OK] SSH/SCP client found
echo.

if "%1"=="restart" goto :restart
REM Default or "upload" -> build + upload + restart
echo [Mode] Full deploy (build + upload + restart)
echo.

:build
REM === BUILD ===
echo [1/3] Building frontend project...
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH
    goto :error
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    goto :error
)
echo [OK] npm found

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory not found: %FRONTEND_DIR%
    goto :error
)
cd /d "%FRONTEND_DIR%"

echo [==] Running npm install...
call npm install --silent
if errorlevel 1 (
    echo [ERROR] npm install failed
    goto :error
)
echo [OK] Dependencies installed

echo [==] Running npm run build...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    goto :error
)
echo [OK] Build completed
echo.

REM Copy to release dir
if not exist "%DIST_DIR%" (
    echo [ERROR] Build directory not found: %DIST_DIR%
    goto :error
)
if exist "%SCRIPT_DIR%dist" (
    rmdir /s /q "%SCRIPT_DIR%dist"
)
xcopy "%DIST_DIR%\*" "%SCRIPT_DIR%dist\" /e /i /y >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy build artifacts
    goto :error
)
echo [OK] Build artifacts ready
echo.

if "%1"=="build" goto :end

:upload
REM === UPLOAD ===
echo [2/3] Uploading to server...
echo [==] Server: %SERVER_USER%@%SERVER_IP%
echo [==] Target: %SERVER_PATH%/frontend/dist/
echo.

scp %SSH_OPTS% -i "%PEM_FILE%" -r "%SCRIPT_DIR%dist\*" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/frontend/dist/
if errorlevel 1 (
    echo [ERROR] Upload failed
    goto :error
)
echo [OK] Frontend files uploaded

REM Upload docker-compose.yml (needed for container config)
if exist "%DEPLOY_DIR%\docker-compose.yml" (
    echo [==] Uploading docker-compose.yml...
    scp %SSH_OPTS% -i "%PEM_FILE%" "%DEPLOY_DIR%\docker-compose.yml" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/docker-compose.yml
    if not errorlevel 1 echo [OK] docker-compose.yml uploaded
)

REM Upload nginx.conf
if exist "%DEPLOY_DIR%\nginx.conf" (
    echo [==] Uploading nginx.conf...
    scp %SSH_OPTS% -i "%PEM_FILE%" "%DEPLOY_DIR%\nginx.conf" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/nginx.conf
    if not errorlevel 1 echo [OK] nginx.conf uploaded
)
echo.

if "%1"=="upload" goto :success

:restart
REM === RESTART ===
echo [3/3] Restarting frontend container...
ssh %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "docker restart tongxiao-frontend && exit"
if errorlevel 1 (
    echo [ERROR] Container restart failed
    goto :error
)
echo [OK] Container restarted

echo [==] Checking service status...
ssh %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "docker ps --filter \"name=tongxiao-frontend\" --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\" && exit"
echo.

echo [==] Testing frontend...
ssh %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "curl -s -o /dev/null -w 'HTTP %%{http_code}' http://localhost:5465 && exit"
echo.
goto :success

:success
echo.
echo ============================================
echo  Deploy completed!
echo ============================================
echo.
echo  Frontend URL: http://good-luck-lct.icu or http://%SERVER_IP%:5465
echo ============================================
goto :end

:error
echo.
echo ============================================
echo  DEPLOY FAILED
echo ============================================
pause
exit /b 1

:end
echo.
pause
exit /b 0
