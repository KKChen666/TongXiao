import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button, ProgressBar, Spinner, Chip } from '@heroui/react';
import { ChevronLeftIcon, CheckIcon, XMarkIcon, TrophyIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import FlashCard from '../components/FlashCard';
import AiChatPanel from '../components/AiChatPanel';

// Memoized progress dots component to avoid re-rendering all dots
const ProgressDots = ({ cards, results, index }) => {
  // Only render nearby dots for performance
  const visibleDots = useMemo(() => {
    const maxVisible = 30;
    if (cards.length <= maxVisible) {
      return cards.map((_, i) => i);
    }
    // Show dots around current index
    const start = Math.max(0, index - Math.floor(maxVisible / 2));
    const end = Math.min(cards.length, start + maxVisible);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [cards.length, index]);

  return (
    <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
      {visibleDots.map((i) => {
        const result = i < results.length ? results[i] : null;
        const isCurrent = i === index;
        return (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isCurrent
                ? 'w-5 bg-primary'
                : result === 1
                ? 'bg-success'
                : result === 0
                ? 'bg-danger'
                : 'bg-default-200'
            }`}
          />
        );
      })}
    </div>
  );
};

function CardsPage({ topic, onBack, ebbinghaus, reviewMode }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const completionRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!topic) return;

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    api(`/topics/${topic.id}/cards`, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;

        let filteredCards = data;
        // In review mode, filter cards due for review
        if (reviewMode && ebbinghaus) {
          const dueCards = ebbinghaus.getDueCards(data);
          // If there are due cards, show them; otherwise show all
          if (dueCards.length > 0) {
            filteredCards = dueCards;
          }
        }

        setCards(filteredCards);
        setIndex(0);
        setResults([]);
        setFinished(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load cards:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [topic, reviewMode, ebbinghaus]);

  useGSAP(() => {
    if (!finished) return;
    const children = completionRef.current?.children;
    if (!children?.length) return;
    gsap.from(children, {
      opacity: 0, y: 20, scale: 0.9,
      duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)',
    });
  }, { scope: completionRef, dependencies: [finished] });

  const currentCard = cards[index];

  const answer = useCallback((result) => {
    if (finished || !currentCard) return;

    // Record review asynchronously
    api(`/cards/${currentCard.id}/review`, {
      method: 'POST',
      body: JSON.stringify({ result }),
    }).catch(console.error);

    ebbinghaus.recordReview(currentCard.id, result === 1);

    // Use functional updates to avoid stale state
    setResults(prev => {
      const newResults = [...prev, result];
      // Check if finished after this answer
      if (index + 1 >= cards.length) {
        setFinished(true);
      } else {
        setIndex(prevIndex => prevIndex + 1);
      }
      return newResults;
    });
  }, [finished, currentCard, ebbinghaus, index, cards.length]);

  const goPrev = useCallback(() => {
    if (index === 0) return;
    setIndex(prev => prev - 1);
    setResults(prev => prev.slice(0, -1));
  }, [index]);

  const restart = useCallback(() => {
    setIndex(0);
    setResults([]);
    setFinished(false);
  }, []);

  const handleSwipe = useCallback((direction) => {
    if (direction === 'know') {
      // Right swipe = 认识
      answer(1);
    } else if (direction === 'unknown') {
      // Left swipe = 不认识
      answer(0);
    } else if (direction === 'next') {
      // Swipe up = next card (if already answered)
      if (index < cards.length - 1 && results.length > index) {
        setIndex(prev => prev + 1);
      }
    } else if (direction === 'prev') {
      // Swipe down = previous card
      goPrev();
    }
  }, [answer, index, cards.length, results.length, goPrev]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar topic={topic} onBack={onBack} />
        <div className="flex-1 flex items-center justify-center pb-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar topic={topic} onBack={onBack} />
        <div className="flex-1 flex items-center justify-center pb-20 text-default-400">
          {reviewMode ? '暂无待复习卡片' : '此章节暂无卡片'}
        </div>
      </div>
    );
  }

  if (finished) {
    const known = results.filter(r => r === 1).length;
    const total = results.length;
    const pct = total ? Math.round(known / total * 100) : 0;
    const color = pct >= 60 ? 'success' : 'warning';

    return (
      <div className="flex-1 flex flex-col">
        <TopBar topic={topic} onBack={onBack} />
        <div ref={completionRef} className="flex-1 flex flex-col items-center justify-center pb-20 px-4">
          <div className={`w-20 h-20 rounded-full bg-${color}/10 flex items-center justify-center mb-4`}>
            {pct >= 80 ? (
              <TrophyIcon className="w-10 h-10 text-warning" />
            ) : (
              <CheckIcon className={`w-10 h-10 text-${color}`} />
            )}
          </div>
          <h2 className="text-2xl font-bold">学习完成</h2>
          <p className="text-sm text-default-400 mt-2">共 {total} 张卡片</p>
          <div className="flex items-center gap-4 mt-3">
            <Chip color="success" variant="secondary" size="sm">认识 {known}</Chip>
            <Chip color="danger" variant="secondary" size="sm">不认识 {total - known}</Chip>
          </div>
          <div className="w-52 mt-4">
            <ProgressBar value={pct} color={color} size="sm" aria-label="掌握率">
              <ProgressBar.Output />
            </ProgressBar>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onPress={restart}>再来一次</Button>
            <Button variant="outline" onPress={onBack}>返回</Button>
          </div>
        </div>
      </div>
    );
  }

  const isEnglish = topic?.subject_id === 1;
  const cardContext = currentCard ? `${currentCard.front}${currentCard.back ? ' - ' + currentCard.back : ''}` : '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">
      <TopBar topic={topic} onBack={onBack} index={index} total={cards.length} />
      <div className="flex-1 flex flex-col px-4 md:px-8 pb-2 md:pb-4 overflow-hidden">
        {/* Progress dots - optimized to only render nearby dots */}
        <ProgressDots cards={cards} results={results} index={index} />

        <FlashCard key={currentCard.id} card={currentCard} isEnglish={isEnglish} onAiClick={() => setAiOpen(true)} onSwipe={handleSwipe} />
        <div className="flex gap-3 flex-shrink-0 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="h-14 w-14 rounded-2xl flex-shrink-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => answer(0)}
            className="flex-1 h-14 rounded-2xl font-bold text-base bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center"
          >
            <XMarkIcon className="w-5 h-5 mr-1" />
            不认识
          </button>
          <button
            onClick={() => answer(1)}
            className="flex-1 h-14 rounded-2xl font-bold text-base bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <CheckIcon className="w-5 h-5 mr-1" />
            认识
          </button>
        </div>
      </div>

      {/* AI 对话面板 */}
      <AiChatPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={cardContext}
        subject={isEnglish ? 'english' : 'politics'}
      />
    </div>
  );
}

function TopBar({ topic, onBack, index, total }) {
  return (
    <div className="px-4 pt-6 pb-0 md:px-8 md:pt-8 flex-shrink-0">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate">{topic?.name || ''}</h2>
        </div>
      </div>
      {index !== undefined && total !== undefined && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-default-400 whitespace-nowrap">{index + 1} / {total}</span>
          <ProgressBar value={(index / total) * 100} size="sm" color="accent" className="flex-1">
            <ProgressBar.Output />
          </ProgressBar>
        </div>
      )}
    </div>
  );
}

export default CardsPage;
