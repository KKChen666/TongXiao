@echo off
chcp 65001 >nul
REM ============================================================
REM TongXiao Backend Release Script (Windows)
REM Location: deploy/release/release-backend.bat
REM
REM Features:
REM   1. Upload backend code and configuration to server via SSH
REM   2. Restart backend Docker container
REM   3. Verify backend service status
REM
REM Usage:
REM   release-backend.bat              # Full release (upload + restart)
REM   release-backend.bat upload       # Upload only, no restart
REM   release-backend.bat restart      # Restart only, no upload
REM ============================================================

setlocal enabledelayedexpansion

REM Server configuration
set "SERVER_IP=119.45.182.166"
set "SERVER_USER=root"
set "SERVER_PATH=/root/tongxiao"
set "PEM_FILE=%~dp0TencentSSHKey.pem"
set "SSH_OPTS=-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes"

REM Resolve real ssh.exe and scp.exe paths (avoid finding ssh.bat in same dir)
for /f "tokens=*" %%i in ('where ssh.exe') do (
    set "SSH_EXE=%%i"
    goto :ssh_found
)
:ssh_found
for /f "tokens=*" %%i in ('where scp.exe') do (
    set "SCP_EXE=%%i"
    goto :scp_found
)
:scp_found

REM Local paths
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "DEPLOY_DIR=%PROJECT_ROOT%\deploy"

echo ============================================
echo  TongXiao Backend Release Script
echo ============================================
echo.

REM Check PEM file
echo [CHECK] Checking SSH key file...
if not exist "%PEM_FILE%" (
    echo [ERROR] SSH key file not found: %PEM_FILE%
    echo         Please place the server key file in this directory as TencentSSHKey.pem
    goto :error
)
echo [OK] SSH key file found

REM Check SSH client
echo [CHECK] Checking SSH client...
where ssh >nul 2>&1
if errorlevel 1 (
    echo [ERROR] SSH client not found, please install OpenSSH or Git for Windows
    goto :error
)
echo [OK] SSH client found

REM Check SCP client
echo [CHECK] Checking SCP client...
where scp >nul 2>&1
if errorlevel 1 (
    echo [ERROR] SCP client not found, please install OpenSSH or Git for Windows
    goto :error
)
echo [OK] SCP client found
echo.

REM Handle parameters
if "%1"=="upload" goto :upload_only
if "%1"=="restart" goto :restart_only

REM Full release flow
echo [Mode] Full backend release (upload + restart)
echo.
goto :upload

:upload_only
echo [Mode] Upload only, no restart
echo.
goto :upload

:restart_only
echo [Mode] Restart only, no upload
echo.
goto :restart

:upload
REM Step 1: Check backend code
echo [1/4] Checking backend code...
if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory not found: %BACKEND_DIR%
    goto :error
)

REM Check if main.py exists
if not exist "%BACKEND_DIR%\main.py" (
    echo [ERROR] Backend code incomplete, missing main.py
    goto :error
)
echo [OK] Backend code check passed
echo.

REM Step 2: Upload backend code
echo [2/4] Uploading backend code to server...
echo [==] Server: %SERVER_USER%@%SERVER_IP%
echo [==] Target path: %SERVER_PATH%/backend/
echo.

REM Upload backend directory
"%SCP_EXE%" %SSH_OPTS% -i "%PEM_FILE%" -r "%BACKEND_DIR%\*" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/backend/
if errorlevel 1 (
    echo [ERROR] Upload failed, please check network connection and server configuration
    goto :error
)
echo [OK] Backend code upload completed
echo.

REM Step 3: Upload docker configuration
echo [3/4] Uploading docker configuration...
REM Upload docker-compose.yml (if exists)
if exist "%DEPLOY_DIR%\docker-compose.yml" (
    echo [==] Uploading docker-compose.yml...
    "%SCP_EXE%" %SSH_OPTS% -i "%PEM_FILE%" "%DEPLOY_DIR%\docker-compose.yml" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/docker-compose.yml
    if errorlevel 1 (
        echo [WARNING] docker-compose.yml upload failed, but continue
    ) else (
        echo [OK] docker-compose.yml upload completed
    )
    echo.
)

REM Upload Dockerfile (if exists)
if exist "%DEPLOY_DIR%\Dockerfile" (
    echo [==] Uploading Dockerfile...
    "%SCP_EXE%" %SSH_OPTS% -i "%PEM_FILE%" "%DEPLOY_DIR%\Dockerfile" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/Dockerfile
    if errorlevel 1 (
        echo [WARNING] Dockerfile upload failed, but continue
    ) else (
        echo [OK] Dockerfile upload completed
    )
    echo.
)

REM Upload requirements.txt (if exists)
if exist "%BACKEND_DIR%\requirements.txt" (
    echo [==] Uploading requirements.txt...
    "%SCP_EXE%" %SSH_OPTS% -i "%PEM_FILE%" "%BACKEND_DIR%\requirements.txt" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/backend/requirements.txt
    if errorlevel 1 (
        echo [WARNING] requirements.txt upload failed, but continue
    ) else (
        echo [OK] requirements.txt upload completed
    )
    echo.
)

if "%1"=="upload" goto :success

:restart
REM Step 4: Restart backend Docker container
echo [4/4] Restarting backend Docker container...
echo [==] Connecting to server...

REM Restart backend container
echo [==] Restarting backend container...
"%SSH_EXE%" %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && docker-compose restart tongxiao-backend && exit"
if errorlevel 1 (
    echo [ERROR] Backend container restart failed
    goto :error
)
echo [OK] Backend container restart completed
echo.

REM Verify backend service status
echo [==] Verifying backend service status...
"%SSH_EXE%" %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "docker ps --filter \"name=tongxiao-backend\" --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\" && exit"
echo.

REM Test backend access
echo [==] Testing backend access...
"%SSH_EXE%" %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "curl -s -o /dev/null -w 'HTTP %%{http_code}' http://localhost:7896/api/health && exit"
echo.

REM Show backend logs
echo [==] Recent backend logs:
"%SSH_EXE%" %SSH_OPTS% -i "%PEM_FILE%" %SERVER_USER%@%SERVER_IP% "docker logs tongxiao-backend --tail 10 && exit"
echo.

:success
echo.
echo ============================================
echo  Backend release completed!
echo ============================================
echo.
echo  Backend API: http://good-luck-lct.icu/api/ or http://%SERVER_IP%:7896/api/
echo.
echo  Management commands:
echo    View logs: ssh -i TencentSSHKey.pem %SERVER_USER%@%SERVER_IP% "docker logs tongxiao-backend"
echo    View status: ssh -i TencentSSHKey.pem %SERVER_USER%@%SERVER_IP% "docker ps --filter \"name=tongxiao-backend\""
echo ============================================

goto :end

:error
echo.
echo ============================================
echo  Backend release failed! Please check error messages
echo ============================================
pause
exit /b 1

:end
cd /d "%SCRIPT_DIR%"
endlocal
pause
exit /b 0