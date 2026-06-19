@echo off
chcp 65001 >nul
setlocal

set "PEM=%~dp0TencentSSHKey.pem"

if not exist "%PEM%" (
    echo [ERROR] PEM file not found: %PEM%
    pause
    exit /b 1
)

REM Find real ssh.exe to avoid calling ourselves
for /f "tokens=*" %%i in ('where ssh.exe') do (
    set "SSH_EXE=%%i"
    goto :found
)
echo [ERROR] ssh.exe not found
pause
exit /b 1

:found
echo Connecting to root@119.45.182.166...
echo.
"%SSH_EXE%" -o StrictHostKeyChecking=no -i "%PEM%" root@119.45.182.166 %*
echo.
echo SSH session ended.
pause
