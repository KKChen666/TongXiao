import { ProgressBar as HeroProgressBar } from '@heroui/react';

function ProgressBar({ pct, color, size = 'sm' }) {
  return (
    <HeroProgressBar
      aria-label="进度"
      value={pct}
      size={size}
      color={color || 'primary'}
      className="mt-1"
    />
  );
}

export default ProgressBar;
