import { useState, useEffect } from 'react';
import api from '../api';
import FlashCard from '../components/FlashCard';

function CardsPage({ topic, onBack }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!topic) return;
    api(`/topics/${topic.id}/cards`).then(data => {
      setCards(data);
      setIndex(0);
      setResults([]);
      setFinished(false);
    }).catch(console.error);
  }, [topic]);

  const currentCard = cards[index];

  const answer = async (result) => {
    if (finished || !currentCard) return;
    await api(`/cards/${currentCard.id}/review`, {
      method: 'POST',
      body: JSON.stringify({ result }),
    });
    const newResults = [...results, result];
    setResults(newResults);
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const restart = () => {
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

  if (!cards.length) {
    return (
      <div className="page active">
        <div className="header">
          <span className="header-back" onClick={onBack}>‹ 返回</span>
          <span className="header-sub">{topic?.name || ''}</span>
        </div>
        <div className="empty-state">此章节暂无卡片</div>
      </div>
    );
  }

  if (finished) {
    const known = results.filter(r => r === 1).length;
    const total = results.length;
    const pct = total ? Math.round(known / total * 100) : 0;
    const color = pct >= 60 ? 'var(--success)' : 'var(--danger)';

    return (
      <div className="page active">
        <div className="header">
          <span className="header-back" onClick={onBack}>‹ 返回</span>
          <span className="header-sub">{topic?.name || ''}</span>
        </div>
        <div className="summary-container">
          <div className="summary-emoji">🎉</div>
          <div className="summary-title">完成！</div>
          <div className="summary-meta">共 {total} 张卡片</div>
          <div className="summary-meta">认识 {known}  不认识 {total - known}</div>
          <div className="summary-bar">
            <div className="summary-bar-fill" style={{ width: `${pct}%`, background: color }} />
          </div>
          <div className="summary-pct" style={{ color }}>掌握率 {pct}%</div>
          <div className="summary-actions">
            <button className="btn-primary" onClick={restart}>再来一次</button>
            <button className="btn-secondary" onClick={onBack}>返回</button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if current subject is English for TTS button
  const isEnglish = topic?.subject_id === 1;

  return (
    <div className="page active">
      <div className="header">
        <span className="header-back" onClick={onBack}>‹ 返回</span>
        <span className="header-sub">{topic?.name || ''}</span>
      </div>
      <div className="review-area">
        <div className="review-progress">
          <span className="review-counter">{index + 1}/{cards.length}</span>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${(index / cards.length) * 100}%` }} />
          </div>
        </div>

        <FlashCard card={currentCard} isEnglish={isEnglish} />

        <div className="action-row">
          <button className="btn btn-unknown" onClick={() => answer(0)} disabled={finished}>
            不认识
          </button>
          <button className="btn btn-known" onClick={() => answer(1)} disabled={finished}>
            认识
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardsPage;
