#!/bin/bash
# TongXiao Android APK 构建脚本
# 使用方法: 在 frontend 目录下运行此脚本

set -e

echo "=== TongXiao APK 构建脚本 ==="
echo "1. 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "2. 安装项目依赖..."
npm install

echo "3. 构建前端资源..."
npm run build

echo "4. 添加 Android 平台（如果尚未添加）..."
if [ ! -d "android" ]; then
    echo "添加 Android 平台..."
    npm install @capacitor/android @capacitor/cli
    npx cap add android
fi

echo "5. 同步 Capacitor 项目..."
npx cap sync android

echo "6. 进入 Android 目录构建 APK..."
cd android

echo "7. 检查 Java 环境..."
if ! command -v java &> /dev/null; then
    echo "错误: 未找到 Java，请先安装 JDK 17"
    exit 1
fi

echo "8. 使用 Gradle 构建 Debug APK..."
./gradlew assembleDebug

echo "9. 构建完成！"
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "APK 文件位置: $(pwd)/$APK_PATH"
    echo "文件大小: $(du -h "$APK_PATH" | cut -f1)"
    
    # 复制到项目根目录方便获取
    cp "$APK_PATH" ../TongXiao-debug.apk
    echo "已复制到: ../TongXiao-debug.apk"
else
    echo "错误: APK 文件未找到，请检查构建日志"
    exit 1
fi

echo ""
echo "=== 构建成功 ==="
echo "你可以将 TongXiao-debug.apk 传输到 Android 手机安装"
echo "安装前请确保手机允许安装未知来源应用"