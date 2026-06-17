import { useState, useEffect } from 'react';
import api from '../api';
import ProgressBar from '../components/ProgressBar';

function ProfilePage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="page active">
        <div className="header"><div className="header-title">学习统计</div></div>
        <div className="empty-state">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="header"><div className="header-title">学习统计</div></div>
      <div className="scroll-content">
        <div className="stats-card">
          <div className="stat-row">
            <span className="stat-label">📊 总卡片数</span>
            <span className="stat-value">{stats.total_cards}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-row">
            <span className="stat-label">✅ 已复习</span>
            <span className="stat-value">{stats.reviewed_cards}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-row">
            <span className="stat-label">🎯 待复习</span>
            <span className="stat-value">{stats.pending_cards}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-row">
            <span className="stat-label">📈 完成率</span>
            <span className="stat-value">{stats.completion_rate}%</span>
          </div>
        </div>

        {stats.subjects && stats.subjects.length > 0 && (
          <div className="subject-progress">
            <div className="section-title">各科目进度</div>
            {stats.subjects.map(s => (
              <div key={s.id} className="subj-stat-card">
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {s.icon} {s.display_name}
                </div>
                <div className="subj-stat">
                  {s.reviewed_cards}/{s.total_cards} ({s.progress_pct}%)
                </div>
                <ProgressBar pct={s.progress_pct} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
