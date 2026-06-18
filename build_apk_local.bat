@echo off
cd /d d:\code\TongXiao\frontend

echo === Step 1: Build frontend ===
call npm run build
if errorlevel 1 (
    echo Frontend build FAILED!
    pause
    exit /b 1
)
echo Frontend build OK!

echo === Step 2: Remove old android platform ===
if exist android rmdir /s /q android

echo === Step 3: Add Android platform ===
call npx cap add android
if errorlevel 1 (
    echo Add Android FAILED!
    pause
    exit /b 1
)
echo Android platform added!

echo === Step 4: Sync web assets ===
call npx cap sync android
if errorlevel 1 (
    echo Sync FAILED!
    pause
    exit /b 1
)
echo Sync OK!

echo === Step 5: Build APK ===
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo APK build FAILED!
    pause
    exit /b 1
)
echo APK build OK!

echo === Done! APK is at: android\app\build\outputs\apk\debug\app-debug.apk ===
pause
