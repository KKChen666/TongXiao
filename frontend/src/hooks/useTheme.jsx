import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEMES = [
  { key: 'blue', name: '天空蓝', accent: '#006FEE' },
  { key: 'purple', name: '星云紫', accent: '#7828C8' },
  { key: 'green', name: '森林绿', accent: '#17C964' },
  { key: 'rose', name: '玫瑰红', accent: '#F31260' },
  { key: 'orange', name: '暖阳橙', accent: '#F5A524' },
];

function load() {
  try {
    return JSON.parse(localStorage.getItem('tongxiao_theme')) || { mode: 'light', color: 'blue' };
  } catch {
    return { mode: 'light', color: 'blue' };
  }
}

function save(t) {
  localStorage.setItem('tongxiao_theme', JSON.stringify(t));
}

function applyTheme(mode, colorKey) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');

  const theme = THEMES.find(c => c.key === colorKey);
  if (!theme) return;

  const c = hexToOklch(theme.accent);
  root.style.setProperty('--accent', c.base);
  root.style.setProperty('--accent-hover', c.hover);
  root.style.setProperty('--accent-foreground', '#FFFFFF');
  root.style.setProperty('--accent-soft', c.soft);
  root.style.setProperty('--accent-soft-foreground', c.base);
  root.style.setProperty('--accent-soft-hover', c.softHover);
  root.dataset.accent = colorKey;
}

// Simple "make it darker/lighter" without full color conversion
function hexToOklch(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toOklch = (l, c) => `oklch(${l}% ${c} 0)`;
  
  // Rough OKLCH approximations using RGB-to-lightness mapping
  const l = Math.round(0.2126 * (r / 2.55) + 0.7152 * (g / 2.55) + 0.0722 * (b / 2.55));
  const chroma = Math.max(1, Math.round((Math.max(r, g, b) - Math.min(r, g, b)) / 2.55 * 0.4));
  
  return {
    base: `oklch(${Math.min(65, l)}% 0.2 ${hue(r, g, b)})`,
    hover: `oklch(${Math.max(25, l - 8)}% 0.18 ${hue(r, g, b)})`,
    soft: `color-mix(in oklch, ${hex}, transparent 88%)`,
    softHover: `color-mix(in oklch, ${hex}, transparent 80%)`,
  };
}

function hue(r, g, b) {
  // Simple RGB to hue for OKLCH
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  let h;
  const d = max - min;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return Math.round(h);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = load();
    applyTheme(saved.mode, saved.color);
    return saved;
  });

  const toggleMode = useCallback(() => {
    setTheme(prev => {
      const next = { ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' };
      save(next);
      applyTheme(next.mode, next.color);
      return next;
    });
  }, []);

  const setColor = useCallback((key) => {
    setTheme(prev => {
      const next = { ...prev, color: key };
      save(next);
      applyTheme(next.mode, next.color);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ ...theme, toggleMode, setColor, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
