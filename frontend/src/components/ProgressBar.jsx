function ProgressBar({ pct, color, height }) {
  return (
    <div className="progress-bar" style={height ? { height } : undefined}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${pct}%`,
          background: color || undefined,
        }}
      />
    </div>
  );
}

export default ProgressBar;
