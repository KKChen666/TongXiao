import { ProgressBar as HeroProgressBar } from '@heroui/react';

const COLOR_MAP = { primary: 'accent', secondary: 'default' };

function ProgressBar({ pct, color = 'primary', size = 'sm' }) {
  return (
    <HeroProgressBar
      aria-label="进度"
      value={pct}
      size={size}
      color={COLOR_MAP[color] || color}
      className="mt-1"
    >
      <HeroProgressBar.Output />
    </HeroProgressBar>
  );
}

export default ProgressBar;
