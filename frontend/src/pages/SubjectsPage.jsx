import { useState, useEffect } from 'react';
import api from '../api';
import ProgressBar from '../components/ProgressBar';

function SubjectsPage({ onSelectSubject }) {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    api('/subjects').then(setSubjects).catch(console.error);
  }, []);

  if (!subjects.length) {
    return (
      <div className="page active">
        <div className="header"><div className="header-title">考研背诵</div></div>
        <div className="empty-state">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="header"><div className="header-title">考研背诵</div></div>
      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>选择科目开始学习</div>
      <div className="scroll-content">
        {subjects.map(s => (
          <button
            key={s.id}
            className="list-card"
            onClick={() => onSelectSubject(s)}
          >
            <div className="list-card-row">
              <div className="list-card-icon">{s.icon}</div>
              <div className="list-card-info">
                <div className="list-card-name">{s.display_name}</div>
                <div className="list-card-meta">{s.reviewed_cards}/{s.total_cards} 已掌握</div>
                <ProgressBar pct={s.progress_pct} />
              </div>
              <div className="list-card-arrow">›</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubjectsPage;
