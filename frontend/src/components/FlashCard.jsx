import { useState } from 'react';

function FlashCard({ card, isEnglish }) {
  const [flipped, setFlipped] = useState(false);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const handleFlip = () => {
    setFlipped(prev => !prev);
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    speak(card.front);
  };

  return (
    <div className="flashcard" onClick={handleFlip}>
      <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
        {/* Front face */}
        <div className="card-face">
          <div className="card-word">{card.front}</div>
          {card.phonetic && <div className="card-phonetic">{card.phonetic}</div>}
          {isEnglish && (
            <button className="card-speak" onClick={handleSpeak}>
              🔊 点击朗读
            </button>
          )}
          <div className="card-def">{card.back}</div>
          {card.example && <div className="card-example">📝 {card.example}</div>}
          <div className="card-hint">点击卡片翻转</div>
        </div>

        {/* Back face */}
        <div className="card-face card-face-back">
          <div className="card-word">{card.front}</div>
          {(card.back_detail || card.back) && (
            <div className="card-detail">{card.back_detail || card.back}</div>
          )}
          {card.example && <div className="card-example">📝 {card.example}</div>}
          <div className="card-hint">点击查看单词</div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
