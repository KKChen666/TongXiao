import { useState, useEffect } from 'react';
import api from '../api';
import ProgressBar from '../components/ProgressBar';

function TopicsPage({ subject, onBack, onSelectTopic }) {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    if (!subject) return;
    api(`/subjects/${subject.id}/topics`).then(setTopics).catch(console.error);
  }, [subject]);

  return (
    <div className="page active">
      <div className="header">
        <span className="header-back" onClick={onBack}>‹ 返回</span>
        <span className="header-sub">{subject?.display_name || ''}</span>
      </div>
      <div className="scroll-content">
        {topics.length === 0 ? (
          <div className="empty-state">暂无章节</div>
        ) : (
          topics.map(t => {
            const label = t.reviewed_cards > 0 ? '复习' : '开始';
            return (
              <div key={t.id} className="list-card" onClick={() => onSelectTopic(t)}>
                <div className="list-card-row">
                  <div className="list-card-info">
                    <div className="list-card-name">{t.name}</div>
                    <div className="list-card-meta">{t.reviewed_cards}/{t.total_cards}</div>
                    <ProgressBar pct={t.progress_pct} />
                  </div>
                  <button
                    className="btn-sm"
                    onClick={(e) => { e.stopPropagation(); onSelectTopic(t); }}
                  >
                    {label}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TopicsPage;
