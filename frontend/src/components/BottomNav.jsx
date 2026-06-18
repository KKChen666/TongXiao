function BottomNav({ activeTab, onTabChange, visible }) {
  if (!visible) return null;

  const tabs = [
    { key: 'subjects', icon: '📖', label: '背诵' },
    { key: 'import', icon: '📥', label: '导入' },
    { key: 'profile', icon: '👤', label: '我的' },
  ];

  return (
    <div className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`nav-item ${activeTab === t.key ? 'active' : ''}`}
          onClick={() => onTabChange(t.key)}
        >
          <span className="nav-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default BottomNav;
