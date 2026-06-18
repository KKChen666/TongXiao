# TongXiao 项目开发规范

> 本文件面向使用 opencode 开发的所有团队成员，请严格遵循。

---

## 0. 开发前必读 — 技能（Skills）

**每次开始本项目开发时，必须加载以下 skill 后再写代码：**

### 0.1 动画相关 → 加载 GSAP 全套 skill

当涉及任何动画需求（翻牌、入场、过渡、滚动动画等），**必须先**加载 GSAP skill 目录：

```
skill 目录路径：skills/gsap-core, skills/gsap-react, skills/gsap-timeline, skills/gsap-plugins, skills/gsap-performance
```

**加载方式（opencode 中执行）：**

1. 先 clone GSAP skill 到本地（只需一次）：
```bash
git clone https://github.com/greensock/gsap-skills.git .opencode/gsap-skills
```

2. 每次开发涉及动画时，加载这些 skill：
```bash
# 逐个加载核心 skills
skill gsap-core
skill gsap-react
skill gsap-timeline
```

### 0.2 主题/UI 相关 → 参考 HeroUI 文档

本项目使用 **HeroUI v3**（基于 React Aria Components），注意 API 与 v2 不同：
- `CardBody` → `CardContent`；`Divider` → `Separator`；`Progress` → `ProgressBar`
- `Card` 不支持 `isPressable`/`onPress`，用 `onClick`
- 无需 `HeroUIProvider` wrapper
- 参考 doc：https://heroui.com

### 0.3 图标 → 必用 Heroicons

```
import { IconName } from '@heroicons/react/24/outline'
```

查阅：https://heroicons.com

---

## 1. 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.x |
| 构建 | Vite | 8.x |
| UI 库 | HeroUI (NextUI v3) | 3.x |
| CSS | Tailwind CSS | 4.x |
| 图标 | Heroicons | @heroicons/react/24/outline |
| 动画 | GSAP | 最新 |
| 图表 | recharts | 最新 |
| 后端 | FastAPI (Python) | — |

---

## 2. 项目结构

```
frontend/
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置（代理 /api → localhost:7896）
├── tailwind.config.js      # Tailwind + HeroUI 配置
├── postcss.config.js       # PostCSS
├── package.json
└── src/
    ├── main.jsx            # 应用入口（注册 GSAP、ThemeProvider）
    ├── App.jsx             # 路由 + 响应式布局
    ├── index.css           # Tailwind 入口 + 全局样式
    ├── api.js              # HTTP 请求封装
    ├── utils.jsx           # 工具函数（主题图标映射）
    ├── components/
    │   ├── BottomNav.jsx   # 移动端底部导航
    │   ├── Sidebar.jsx     # 桌面端侧边导航
    │   ├── FlashCard.jsx   # 翻牌卡片组件
    │   ├── ProgressBar.jsx # 进度条封装
    │   └── EbbinghausChart.jsx  # 艾宾浩斯曲线图
    ├── pages/
    │   ├── SubjectsPage.jsx  # 学习 - 科目列表
    │   ├── TopicsPage.jsx    # 学习 - 章节列表
    │   ├── CardsPage.jsx     # 学习 - 卡片复习
    │   ├── ReviewPage.jsx    # 复习 - 艾宾浩斯计划
    │   ├── ImportPage.jsx    # 导入
    │   └── ProfilePage.jsx   # 我的 - 统计 + 主题设置
    └── hooks/
        ├── useEbbinghaus.jsx   # 艾宾浩斯记忆调度
        ├── useTheme.jsx        # 主题管理
        └── useAnimations.jsx   # GSAP 动画 hooks
```

---

## 3. 组件规范

### 3.1 命名
- 组件文件：PascalCase，如 `FlashCard.jsx`
- 组件函数：PascalCase，如 `function FlashCard()`
- Hook 文件：camelCase，以 `use` 开头，如 `useEbbinghaus.jsx`
- 工具文件：camelCase，如 `utils.jsx`

### 3.2 导出
```jsx
// ✅ 正确：默认导出组件
export default function MyComponent() { ... }

// ✅ 正确：命名导出工具/常量
export const tabs = [...];
export function getSubjectIcon(subject) { ... }
```

### 3.3 组件模板
```jsx
import { useState, useRef } from 'react';
import { Button, Card } from '@heroui/react';        // HeroUI 组件
import { SomeIcon } from '@heroicons/react/24/outline'; // 图标
import gsap from 'gsap';                              // GSAP 动画
import { useGSAP } from '@gsap/react';
import api from '../api';                             // API 调用

function PageName({ prop1, prop2 }) {
  // state → effects → handlers → render
  const [data, setData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => { ... }, []);
  useGSAP(() => { ... }, { scope: containerRef, dependencies: [data] });

  const handleClick = () => { ... };

  return ( ... );
}

export default PageName;
```

**代码顺序**：imports → state → refs → effects → handlers → render

---

## 4. 样式规范

### 4.1 必须使用 HeroUI 组件
```jsx
// ✅ 用 HeroUI
<Button color="primary" variant="flat">按钮</Button>
<Card><CardContent>...</CardContent></Card>
<Chip color="success" variant="flat">标签</Chip>
<ProgressBar value={50} color="primary" size="sm" />
<Separator />
<Spinner size="lg" />

// ❌ 不要手写原生 HTML 样式组件
<div className="bg-blue-500 ...">按钮</div>
```

### 4.2 HeroUI v3 API 注意事项
- `CardBody` → **`CardContent`**
- `Divider` → **`Separator`**
- `Progress` → **`ProgressBar`**
- `Card` 不支持 `isPressable`/`onPress` → 用 **`onClick`**
- `Chip` 不支持 `startContent` → 图标作为 **children**
- 不需要 `HeroUIProvider` wrapper

### 4.3 Tailwind 类名
- 用 HeroUI 语义色：`text-primary`、`bg-success/10`、`text-default-400`
- 响应式前缀：`md:` ≥768px（桌面端）
- 深色模式：HeroUI 自动适配，不写 `dark:` 类
- 间距系统：`p-4`(16px)、`p-6`(24px)、`gap-3`(12px)、`gap-4`(16px)

### 4.4 不要使用 Emoji
所有图标使用 `@heroicons/react/24/outline`，科目图标通过 `utils.jsx` 的 `getSubjectIcon()` 映射。

---

## 5. HeroUI 主题色

主题色通过 CSS 变量 `--accent` 控制，**不要硬编码颜色值**：

```jsx
// ✅ 用 HeroUI 的 color prop
<Button color="primary">...</Button>
<Chip color="primary" variant="flat">...</Chip>
<ProgressBar color="primary" ... />

// ✅ 用 Tailwind 语义类
<div className="text-primary">...</div>
<div className="bg-primary/10">...</div>
```

主题设置入口：「我的」→「主题设置」，支持浅色/深色 + 5 种主题色。

---

## 6. 动画规范（GSAP）

### 6.1 必须遵循的规则
```jsx
// ✅ 用 useGSAP() 替代 useEffect 做动画
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const containerRef = useRef(null);

useGSAP(() => {
  gsap.from(containerRef.current, {
    opacity: 0, y: 30, duration: 0.5, ease: 'power3.out',
  });
}, { scope: containerRef }); // 必须传 scope 限定选择器范围

// ✅ 事件回调中的动画用 contextSafe 包裹
const { contextSafe } = useGSAP(() => {}, { scope: containerRef });

const handleClick = contextSafe(() => {
  gsap.to(target, { x: 100 });
});

// ❌ 不要用 useEffect + gsap.context()（除非无法用 useGSAP）
// ❌ 不要用字符串选择器不加 scope
```

### 6.2 常用动画预设
- 入场弹入：`opacity: 0, y: 30, ease: 'back.out(1.4)'`
- 列表 stagger：`opacity: 0, y: 24, stagger: 0.06, ease: 'power3.out'`
- 翻牌：`rotationX: 180, duration: 0.6, ease: 'power2.inOut'`

### 6.3 全局默认
`main.jsx` 已设置，所有 tween 默认 `duration: 0.5, ease: 'power2.out'`

---

## 7. 响应式布局

| 断点 | 布局 |
|------|------|
| < 768px | 底部 Tab 导航 + 全屏内容 |
| ≥ 768px | 左侧 240px Sidebar + 内容区 |

```jsx
// 底部导航：移动端可见，桌面端隐藏
<div className="md:hidden flex ...">

// 侧边栏：移动端隐藏，桌面端可见
<aside className="hidden md:flex md:w-60 ...">
```

页面内容 padding：`px-4 md:px-8`、`pb-4 md:pb-8`

---

## 8. API 调用

```jsx
import api from '../api';

// GET
const data = await api('/subjects');

// POST
const result = await api('/import', {
  method: 'POST',
  body: JSON.stringify({ subject, topic, cards }),
});

// 错误会 throw，需要 try/catch
try {
  const data = await api('/subjects');
} catch (err) {
  console.error(err);
}
```

API 代理：`/api/*` → `http://localhost:7896`

---

## 9. 艾宾浩斯记忆系统

```jsx
// 在 App.jsx 顶层初始化
const ebbinghaus = useEbbinghaus();

// 传给需要用的页面
<CardsPage ebbinghaus={ebbinghaus} ... />

// 答题时记录
ebbinghaus.recordReview(cardId, correct); // correct: 1=认识, 0=不认识

// 获取统计
ebbinghaus.getTotalReviewed();
ebbinghaus.getReentionStats(); // 用于图表
```

复习间隔：1天 → 2天 → 4天 → 7天 → 15天 → 30天。数据存储在 `localStorage`。

---

## 10. Git 提交规范

```
<type>: <简短描述>

类型：feat / fix / style / refactor / perf / docs / chore

示例：
feat: 添加艾宾浩斯复习曲线图表
fix: 修复 Card 组件点击无响应
style: 统一底部导航 icon 为 Heroicons
```

---

## 11. OpenCode 协作规则

### 11.1 每次开发前
- 阅读本文件了解规范
- 阅读相关页面代码了解现有模式
- 优先用 HeroUI 组件，不手写原生样式

### 11.2 开发后
- 运行 `npm run build` 确认零错误
- 不要引入新的 UI 库（已有 HeroUI + Heroicons）
- 不要引入新的动画库（GSAP 全覆盖）
- 不生成无用的 README 或文档文件

### 11.3 禁止事项
- ❌ `CardBody` / `Divider` / `Progress` — HeroUI v3 中不存在
- ❌ 硬编码颜色值 — 用 HeroUI `color="primary"` prop
- ❌ CSS 选择器做动画 — 全部用 GSAP
- ❌ Emoji — 全部用 Heroicons
- ❌ `isPressable` / `onPress` 用在 Card 上 — 用 `onClick`
- ❌ `startContent` 用在 Chip 上 — icon 作为 children
