---
name: heroui-v2
description: "HeroUI v2 React component library (Tailwind CSS + Framer Motion). Use when building UIs with HeroUI v2 — creating Buttons, Modals, Forms, Cards; installing @heroui/react; configuring HeroUIProvider, dark/light themes; or fetching v2 component docs. Keywords: HeroUI v2, NextUI, heroui v2, @heroui/react, @heroui/system, @heroui/theme, HeroUIProvider."
metadata:
  author: heroui
  version: "2.8.0"
---

# HeroUI v2 React Development Guide

HeroUI v2 is a component library built on **Tailwind CSS** (v3 or v4) and **Framer Motion**, providing accessible, customizable UI components for React applications via **React Aria**.

> **This guide is for HeroUI v2 ONLY.** If you need HeroUI v3, use the `heroui-react` skill instead. v3 removes the Provider, switches to compound components, and drops framer-motion.

---

## CRITICAL: v2 Only - Do NOT Mix with v3

| Feature       | v2 (USE THIS)                             | v3 (DO NOT USE)                       |
| ------------- | ----------------------------------------- | ------------------------------------- |
| Provider      | `<HeroUIProvider>` **required**           | No Provider needed                    |
| Animations    | `framer-motion` (required dependency)     | CSS-based, no extra deps              |
| Component API | Flat props: `<Card title="x">`            | Compound: `<Card><Card.Header>`       |
| Styling       | Tailwind v3/v4 + `@heroui/theme`          | Tailwind v4 + `@heroui/styles`        |
| Packages      | `@heroui/system`, `@heroui/theme`         | `@heroui/react`, `@heroui/styles`     |
| Docs Site     | `https://v2.heroui.com`                   | `https://heroui.com`                  |

---

## Installation

### Automatic (CLI - Recommended)

```bash
# Install CLI
npm install -g heroui-cli

# Initialize project
heroui init my-app

# Add individual components
heroui add button
heroui add button card input

# Or install the full library
heroui add @heroui/react
```

### Manual - Global Installation

```bash
npm install @heroui/react framer-motion
```

### Manual - Individual Installation

```bash
# Core packages (always required)
npm install @heroui/system @heroui/theme framer-motion

# Individual components
npm install @heroui/button @heroui/card @heroui/input
```

### pnpm Users - Hoisted Dependencies

Add to `.npmrc`:

```
public-hoist-pattern[]=*@heroui/*
```

Then run `pnpm install` again.

---

## Tailwind CSS Setup

### Tailwind v4 (since HeroUI v2.8.0)

HeroUI v2 supports Tailwind CSS v4. Create a `hero.ts` file:

```ts
// hero.ts
import heroui from "@heroui/theme";

export default heroui();
```

In your main CSS file:

```css
@import "tailwindcss";
@import "./hero";
```

Update PostCSS config — use `@tailwindcss/postcss` instead of `tailwindcss`:

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Tailwind v3 (legacy)

```js
// tailwind.config.js
const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/*.js",
    // ...your app paths
  ],
  plugins: [heroui()],
};
```

---

## Provider Setup (REQUIRED)

**HeroUI v2 requires `HeroUIProvider` at the root of your application.**

```tsx
// app/providers.tsx
import { HeroUIProvider } from "@heroui/system";

export function Providers({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
```

```tsx
// app/layout.tsx (Next.js App Router)
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### HeroUIProvider Key Props

| Prop                       | Type      | Default     | Description                                      |
| -------------------------- | --------- | ----------- | ------------------------------------------------ |
| `navigate`                 | function  | -           | Client-side router for Link, Tabs, etc.          |
| `locale`                   | string    | `"en-US"`   | Locale for i18n                                  |
| `disableAnimation`         | boolean   | `false`     | Disable all animations globally                  |
| `disableRipple`            | boolean   | `false`     | Disable ripple effect globally                   |
| `skipFramerMotionAnimations` | boolean | same as disableAnimation | Skip framer-motion specifically       |
| `validationBehavior`       | `native` \| `aria` | `"native"` | Form validation mode                     |
| `reducedMotion`            | `"user"` \| `"always"` \| `"never"` | `"never"` | Respect user motion preferences   |

---

## Core Patterns

### Flat Props API (v2 Style)

v2 components use **flat props**, not compound components:

```tsx
// Button
import { Button } from "@heroui/react";

<Button color="primary" variant="ghost" size="lg">
  Click me
</Button>;

// Card
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react";

<Card>
  <CardHeader>
    <h4>Card Title</h4>
  </CardHeader>
  <CardBody>
    <p>Card content</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;

// Modal
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";

<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalBody>Content</ModalBody>
    <ModalFooter>
      <Button>Action</Button>
    </ModalFooter>
  </ModalContent>
</Modal>;
```

### Event Handlers

v2 uses `onPress` (from React Aria) for interactive components:

```tsx
<Button onPress={() => console.log("pressed")}>Click</Button>
<Card isPressable onPress={() => navigate("/detail")}>
  ...
</Card>
```

### Styling via `classNames` Prop

v2 uses `classNames` (not `className`) for slot-based styling:

```tsx
<Button
  classNames={{
    base: "custom-base",
    content: "custom-content",
  }}
>
  Styled
</Button>

<Card
  classNames={{
    base: "bg-red-500",
    header: "border-b-2",
    body: "p-6",
    footer: "justify-end",
  }}
>
  ...
</Card>
```

---

## Components

Always fetch component docs before implementing. Use the scripts below.

### Using Scripts

```bash
# List all available components
node scripts/list_components.mjs

# Get component documentation (MDX)
node scripts/get_component_docs.mjs Button
node scripts/get_component_docs.mjs Button Card Input

# Get theme variables
node scripts/get_theme.mjs
```

### Direct MDX URLs

Component docs: `https://v2.heroui.com/docs/components/{component-name}.mdx`

Examples:
- Button: `https://v2.heroui.com/docs/components/button.mdx`
- Modal: `https://v2.heroui.com/docs/components/modal.mdx`
- Card: `https://v2.heroui.com/docs/components/card.mdx`

### Available Components (47)

Accordion, Autocomplete, Alert, Avatar, Badge, Breadcrumbs, Button, Calendar, Card, Checkbox, Checkbox Group, Chip, Circular Progress, Code, Date Input, Date Picker, Date Range Picker, Divider, Dropdown, Drawer, Form, Image, Input, Input OTP, Kbd, Link, Listbox, Modal, Navbar, Number Input, Pagination, Popover, Progress, Radio Group, Range Calendar, Scroll Shadow, Select, Skeleton, Slider, Snippet, Spacer, Spinner, Switch, Table, Tabs, Toast, Textarea, Time Input, Tooltip, User

---

## Theming

HeroUI v2 uses a Tailwind CSS plugin (`@heroui/theme`) for theming. Themes are configured in `tailwind.config.js` (v3) or via `hero.ts` (v4).

### Dark Mode

Add `dark` class to the root element:

```tsx
<html className="dark">
```

For Next.js, use `next-themes`:

```bash
npm install next-themes
```

```tsx
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="dark">
  <HeroUIProvider>{children}</HeroUIProvider>
</ThemeProvider>;
```

For Vite/plain React, use `@heroui/use-theme`:

```bash
npm install @heroui/use-theme
```

### Semantic Colors

HeroUI provides semantic color scales (50-900) for: `primary`, `secondary`, `success`, `warning`, `danger`, `default`.

Apply via Tailwind classes: `bg-primary-500`, `text-danger-600`, `border-warning-300`.

### CSS Variables

Format: `--heroui-{color}-{shade}` (prefix configurable via `heroui({ prefix: "myapp" })`).

### Custom Theme Example

```js
// tailwind.config.js
heroui({
  themes: {
    light: {
      colors: {
        primary: {
          50: "#e6f0ff",
          500: "#0066ff",
          DEFAULT: "#0066ff",
          foreground: "#ffffff",
        },
      },
    },
    dark: {
      colors: {
        primary: {
          50: "#0a1a33",
          500: "#3399ff",
          DEFAULT: "#3399ff",
          foreground: "#ffffff",
        },
      },
    },
  },
})
```

---

## Component Variants Reference

| Variant     | Available On                        | Description          |
| ----------- | ----------------------------------- | -------------------- |
| `solid`     | Button, Chip                         | Filled background    |
| `bordered`  | Button, Input, Chip                  | Border outline       |
| `light`     | Button                               | Transparent + hover  |
| `flat`      | Button, Input                        | Subtle background    |
| `faded`     | Button, Input                        | Muted appearance     |
| `shadow`    | Button                               | Drop shadow          |
| `ghost`     | Button                               | Minimal emphasis     |
| `underlined`| Input                                | Bottom border only   |

---

## Framework Guides

HeroUI v2 works with:
- **Next.js** (App Router & Pages Router)
- **Vite**
- **Remix**
- **Astro**
- **Laravel**

See framework-specific guides at: `https://v2.heroui.com/docs/frameworks/{framework}`
