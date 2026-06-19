@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
REM ============================================================
REM TongXiao Android APK Build Script
REM Location: frontend/build-android.bat
REM
REM Features:
REM   1. Auto-detect JDK and Android SDK
REM   2. Auto-install missing SDK components
REM   3. Build frontend + Capacitor sync + Gradle assembleDebug
REM
REM Usage:
REM   build-android.bat              # Build debug APK
REM   build-android.bat release      # Build release APK (unsigned)
REM ============================================================

echo ============================================
echo  TongXiao Android APK Build Script
echo ============================================
echo.

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%"

REM === Step 1: Check Java ===
echo [1/6] Checking Java environment...
where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found. Please install JDK 17+ and add to PATH.
    echo         Download: https://adoptium.net/
    goto :error
)
for /f "tokens=*" %%i in ('java -version 2^>^&1') do (
    echo [OK] %%i
    goto :java_done
)
:java_done

REM Resolve JAVA_HOME if not set
if "%JAVA_HOME%"=="" (
    for /f "tokens=*" %%i in ('where java') do (
        set "JAVA_BIN=%%i"
    )
    REM Try to derive JAVA_HOME from java path
    for %%j in ("!JAVA_BIN!\..\..") do set "JAVA_HOME=%%~fj"
    echo [INFO] JAVA_HOME not set, derived: !JAVA_HOME!
)
echo.

REM === Step 2: Check Android SDK ===
echo [2/6] Checking Android SDK...
if "%ANDROID_HOME%"=="" (
    REM Try common locations
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) else if exist "D:\env\Android\Sdk" (
        set "ANDROID_HOME=D:\env\Android\Sdk"
    ) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk"
    ) else (
        echo [ERROR] Android SDK not found.
        echo         Please install Android Studio or set ANDROID_HOME.
        echo         Download: https://developer.android.com/studio
        goto :error
    )
    echo [INFO] ANDROID_HOME not set, using: !ANDROID_HOME!
)
echo [OK] Android SDK: %ANDROID_HOME%

REM Check required SDK components
set "SDKMANAGER=%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"
if exist "%SDKMANAGER%" (
    REM Auto-install missing SDK components
    echo [==] Checking SDK components...
    echo y | "%SDKMANAGER%" --sdk_root="%ANDROID_HOME%" "platforms;android-35" "build-tools;35.0.0" "platform-tools" >nul 2>&1
) else (
    REM cmdline-tools not installed, try to install them
    echo [WARN] SDK cmdline-tools not found, attempting to install...
    set "CMDLINE_ZIP=%ANDROID_HOME%\cmdline-tools.zip"
    powershell -Command "Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%CMDLINE_ZIP%' -UseBasicParsing"
    if errorlevel 1 (
        echo [ERROR] Failed to download SDK cmdline-tools.
        echo         Please install manually or install Android Studio.
        goto :error
    )
    powershell -Command "Expand-Archive -Path '%CMDLINE_ZIP%' -DestinationPath '%ANDROID_HOME%\cmdline-tools\latest' -Force"
    del "%CMDLINE_ZIP%"
    
    REM Accept licenses and install components
    set "SDKMANAGER=%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"
    echo y | "%SDKMANAGER%" --sdk_root="%ANDROID_HOME%" --licenses >nul 2>&1
    echo y | "%SDKMANAGER%" --sdk_root="%ANDROID_HOME%" "platforms;android-35" "build-tools;35.0.0" "platform-tools" >nul 2>&1
    echo [OK] SDK cmdline-tools installed
)
echo [OK] SDK components ready
echo.

REM Generate local.properties for Gradle
set "LOCAL_PROPS=%FRONTEND_DIR%android\local.properties"
<nul set /p ="sdk.dir=%ANDROID_HOME:\=/%" > "%LOCAL_PROPS%"
echo [OK] Generated local.properties
echo.

REM === Step 3: Install npm dependencies ===
echo [3/6] Installing npm dependencies...
cd /d "%FRONTEND_DIR%"
call npm install --silent
if errorlevel 1 (
    echo [ERROR] npm install failed
    goto :error
)
echo [OK] Dependencies installed
echo.

REM === Step 4: Build frontend ===
echo [4/6] Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    goto :error
)
echo [OK] Frontend build completed
echo.

REM === Step 5: Sync Capacitor ===
echo [5/6] Syncing Capacitor Android project...
call npx cap sync android
if errorlevel 1 (
    echo [ERROR] Capacitor sync failed
    goto :error
)
echo [OK] Capacitor synced
echo.

REM === Step 6: Build APK ===
echo [6/6] Building Android APK...
cd /d "%FRONTEND_DIR%android"

if "%1"=="release" (
    echo [Mode] Building release APK...
    call gradlew.bat assembleRelease
    set "APK_PATH=app\build\outputs\apk\release\app-release-unsigned.apk"
) else (
    echo [Mode] Building debug APK...
    call gradlew.bat assembleDebug
    set "APK_PATH=app\build\outputs\apk\debug\app-debug.apk"
)

if errorlevel 1 (
    echo [ERROR] Gradle build failed
    goto :error
)

REM Copy APK to release directory
if not exist "%SCRIPT_DIR%..\deploy\release" mkdir "%SCRIPT_DIR%..\deploy\release"
copy /y "%APK_PATH%" "%SCRIPT_DIR%..\deploy\release\" >nul 2>&1

echo.
echo ============================================
echo  APK Build Completed!
echo ============================================
echo.
echo  APK location: %FRONTEND_DIR%android\%APK_PATH%
if exist "%SCRIPT_DIR%..\deploy\release\app-debug.apk" (
    echo  Copied to:   %SCRIPT_DIR%..\deploy\release\app-debug.apk
)
if exist "%SCRIPT_DIR%..\deploy\release\app-release-unsigned.apk" (
    echo  Copied to:   %SCRIPT_DIR%..\deploy\release\app-release-unsigned.apk
)
echo.
echo  To install on device:
echo    adb install "%APK_PATH%"
echo ============================================
goto :end

:error
echo.
echo ============================================
echo  BUILD FAILED
echo ============================================
pause
exit /b 1

:end
pause
exit /b 0
