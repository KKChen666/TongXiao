#!/usr/bin/env node
/**
 * Get HeroUI v2 theme information.
 *
 * Usage:
 *   node get_theme.mjs
 *
 * Output:
 *   Theme configuration reference including colors, layout, and setup
 */

const themeReference = {
  version: "v2",
  plugin: "@heroui/theme",

  setup: {
    tailwindV3: {
      file: "tailwind.config.js",
      code: `const { heroui } = require("@heroui/theme");

module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/*.js",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [heroui()],
};`,
    },
    tailwindV4: {
      file: "hero.ts",
      code: `import heroui from "@heroui/theme";
export default heroui();`,
      css: `@import "tailwindcss";
@import "./hero";`,
    },
  },

  semanticColors: {
    description:
      "Semantic colors adapt to the current theme (light/dark). Use Tailwind classes like bg-primary-500, text-danger-600.",
    colors: [
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "default",
    ],
    shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    special: {
      description:
        "Each color has DEFAULT and foreground variants for automatic text contrast.",
      example: "bg-primary text-primary-foreground",
    },
    cssVariables: {
      format: "--heroui-{color}-{shade}",
      example: "var(--heroui-primary-500)",
    },
  },

  layout: {
    description:
      "Layout tokens control spacing, radius, borderWidth, and other structural properties.",
    tokens: [
      "borderRadius.small",
      "borderRadius.medium",
      "borderRadius.large",
      "borderWidth.small",
      "borderWidth.medium",
      "borderWidth.large",
      "disabledOpacity",
      "dividerWeight",
      "fontSize.small",
      "fontSize.medium",
      "fontSize.large",
      "lineHeight.small",
      "lineHeight.medium",
      "lineHeight.large",
      "radius.small",
      "radius.medium",
      "radius.large",
      "spacing.small",
      "spacing.medium",
      "spacing.large",
    ],
  },

  darkMode: {
    method: "Add 'dark' class to root element",
    nextThemes: {
      package: "next-themes",
      setup: `import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="dark">
  <HeroUIProvider>{children}</HeroUIProvider>
</ThemeProvider>`,
    },
    useTheme: {
      package: "@heroui/use-theme",
      setup: `import { useTheme } from "@heroui/use-theme";

const { theme, setTheme } = useTheme();`,
    },
  },

  customTheme: {
    description:
      "Customize themes in tailwind.config.js heroui plugin options.",
    example: `heroui({
  themes: {
    light: {
      colors: {
        primary: {
          50: "#e6f0ff",
          100: "#b3d1ff",
          200: "#80b3ff",
          300: "#4d94ff",
          400: "#1a75ff",
          500: "#0066ff",
          600: "#0052cc",
          700: "#003d99",
          800: "#002966",
          900: "#001433",
          DEFAULT: "#0066ff",
          foreground: "#ffffff",
        },
      },
    },
    dark: {
      colors: {
        primary: {
          50: "#0a1a33",
          100: "#0f2b52",
          200: "#143d71",
          300: "#1a4e90",
          400: "#1f60af",
          500: "#3399ff",
          600: "#5cb3ff",
          700: "#85ccff",
          800: "#ade0ff",
          900: "#d6f0ff",
          DEFAULT: "#3399ff",
          foreground: "#ffffff",
        },
      },
    },
  },
})`,
    customThemeName: `heroui({
  themes: {
    "my-brand": {
      extend: "light",
      colors: {
        primary: "#ff5722",
        background: "#fafafa",
        foreground: "#1a1a1a",
      },
    },
  },
})

// Apply: <html class="my-brand">`,
  },

  nestedThemes: {
    description: "HeroUI supports nested themes for different sections.",
    example: `<div className="light">
  <Button color="primary">Light Theme</Button>
</div>
<div className="dark">
  <Button color="primary">Dark Theme</Button>
</div>`,
  },

  overrideStyles: {
    description: "Use classNames prop or Tailwind merge for style overrides.",
    classNamesExample: `<Button
  classNames={{
    base: "bg-gradient-to-br from-indigo-500 to-pink-500",
    content: "text-white font-bold",
  }}
>
  Custom Styled
</Button>`,
  },
};

async function main() {
  console.log(JSON.stringify(themeReference, null, 2));
  console.error("\n# HeroUI v2 theme reference generated");
}

main();
