# TongXiao 手机APP打包指南

## 概述
本指南将帮助您将TongXiao Web应用打包为原生手机APP（Android和iOS）。我们使用 **Capacitor** 技术，它可以将现有的React应用打包为真正的原生应用，支持上架应用商店。

## 技术方案
- **Capacitor**：Ionic团队开发的跨平台原生打包工具
- **保留现有代码**：所有React代码保持不变，Capacitor负责打包为原生应用
- **支持平台**：Android、iOS

## 前置条件

### 1. 开发环境要求
| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | >= 18（推荐 22） | 前端构建 |
| npm | >= 9 | 包管理 |
| Android Studio | 最新版（Android开发） | Android打包 |
| Xcode | 最新版（仅macOS） | iOS打包 |

### 2. 已完成配置
- ✅ Capacitor配置文件：`frontend/capacitor.config.ts`
- ✅ 依赖已添加到 `package.json`
- ✅ API代理已配置指向生产服务器：`https://good-luck-lct.icu`

## 打包步骤

### 第1步：安装依赖
```bash
cd frontend
npm install
```

### 第2步：构建Web应用
```bash
npm run build
```
这将生成 `dist/` 目录，包含生产环境的Web文件。

### 第3步：添加Android平台
```bash
npm run cap:add:android
```
这将创建 `android/` 目录，包含Android原生项目。

### 第4步：同步资源
```bash
npm run cap:sync
```
将Web资源同步到Android项目。

### 第5步：打开Android Studio
```bash
npm run cap:open:android
```
在Android Studio中打开项目。

### 第6步：构建APK
在Android Studio中：
1. 选择 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 或者使用命令行：
```bash
cd android
./gradlew assembleDebug
```
生成的APK文件位于：`android/app/build/outputs/apk/debug/app-debug.apk`

## iOS打包（仅macOS）

### 第1步：添加iOS平台
```bash
npm run cap:add:ios
```

### 第2步：同步资源
```bash
npm run cap:sync
```

### 第3步：打开Xcode
```bash
npm run cap:open:ios
```

### 第4步：配置签名
1. 在Xcode中选择项目
2. 选择 `Signing & Capabilities`
3. 配置Team和Bundle Identifier

### 第5步：构建IPA
1. 选择设备或模拟器
2. 点击 `Product` → `Archive`
3. 导出IPA文件

## APP配置

### 1. APP信息
- **应用名称**：TongXiao
- **包名**：`com.tongxiao.app`
- **版本**：1.0.0

### 2. 权限配置
Android `AndroidManifest.xml` 已包含：
- 网络访问权限
- 相机权限（可选，用于扫描）
- 存储权限（可选，用于数据导出）

### 3. 图标配置
需要为APP创建不同尺寸的图标：

#### Android图标尺寸
| 目录 | 尺寸 | 用途 |
|------|------|------|
| `mipmap-mdpi` | 48x48 | 低密度屏幕 |
| `mipmap-hdpi` | 72x72 | 高密度屏幕 |
| `mipmap-xhdpi` | 96x96 | 超高密度屏幕 |
| `mipmap-xxhdpi` | 144x144 | 超超高密度屏幕 |
| `mipmap-xxxhdpi` | 192x192 | 超超高密度屏幕 |

#### iOS图标尺寸
| 尺寸 | 用途 |
|------|------|
| 20x20 | 通知图标 |
| 29x29 | 设置图标 |
| 40x40 | Spotlight图标 |
| 60x60 | 应用图标 |
| 76x76 | iPad图标 |
| 83.5x83.5 | iPad Pro图标 |
| 1024x1024 | App Store图标 |

**推荐工具**：
1. 在线图标生成工具：[App Icon Generator](https://appicon.co/)
2. 本地SVG图标：`frontend/assets/icon.svg`（已提供）
3. 使用Python脚本生成：`python scripts/generate_icons.py`（需安装Pillow）

**快速生成**：
1. 访问 https://appicon.co/
2. 上传 `frontend/assets/icon.svg` 或任何1024x1024的PNG图片
3. 下载生成的图标包
4. 替换 `android/app/src/main/res/` 下的图标文件

## API配置说明

### 开发环境
在 `vite.config.js` 中配置代理：
```javascript
proxy: {
  '/api': 'http://localhost:7896'
}
```

### 生产环境（APP）
在 `capacitor.config.ts` 中配置：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://good-luck-lct.icu',
      changeOrigin: true,
      secure: false
    }
  }
}
```

## 常见问题

### 1. 网络请求失败
**问题**：APP中API请求返回错误
**解决方案**：
- 检查 `capacitor.config.ts` 中的代理配置
- 确保生产服务器 `https://good-luck-lct.icu` 可访问
- 检查Android的网络安全配置

### 2. Android构建失败
**问题**：Gradle构建错误
**解决方案**：
1. 确保Android Studio已安装最新SDK
2. 检查Java版本（推荐JDK 11+）
3. 清理项目：`cd android && ./gradlew clean`

### 3. iOS签名错误
**问题**：Xcode提示签名错误
**解决方案**：
1. 在Xcode中配置Apple Developer账号
2. 选择正确的Team
3. 配置正确的Bundle Identifier

### 4. APP启动白屏
**问题**：APP启动后显示白屏
**解决方案**：
- 检查 `dist/` 目录是否生成完整
- 确保所有资源路径正确
- 检查控制台错误日志

## 调试技巧

### 1. 使用Chrome调试Android
```bash
# 在Android设备上启用USB调试
# 连接设备后
chrome://inspect
```

### 2. 查看日志
```bash
# Android日志
adb logcat | grep -i tongxiao

# iOS日志
# 使用Xcode控制台
```

### 3. 热重载开发
```bash
# 启动Capacitor开发服务器
npx cap run android --livereload --external
```

## 发布到应用商店

### Android (Google Play)
1. 生成签名APK：`./gradlew assembleRelease`
2. 使用Android Studio的签名工具
3. 上传到Google Play Console

### iOS (App Store)
1. 在Xcode中Archive
2. 导出IPA文件
3. 通过Application Loader上传
4. 在App Store Connect提交审核

## 更新APP

### 代码更新后
1. 重新构建Web：`npm run build`
2. 同步资源：`npx cap sync`
3. 重新构建原生项目

### 版本更新
修改 `package.json` 中的版本号，然后重新打包。

## 技术支持
- **Capacitor文档**：https://capacitorjs.com/docs
- **Ionic文档**：https://ionicframework.com/docs
- **项目仓库**：查看项目README.md

---

*最后更新：2026年6月18日*