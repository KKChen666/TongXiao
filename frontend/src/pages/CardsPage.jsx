import { useState, useEffect, useRef } from 'react';
import { Button, ProgressBar, Spinner, Chip } from '@heroui/react';
import { ChevronLeftIcon, CheckIcon, XMarkIcon, TrophyIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import FlashCard from '../components/FlashCard';

function CardsPage({ topic, onBack, ebbinghaus, reviewMode }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const completionRef = useRef(null);

  useEffect(() => {
    if (!topic) return;
    setLoading(true);
    api(`/topics/${topic.id}/cards`).then(data => {
      setCards(data);
      setIndex(0);
      setResults([]);
      setFinished(false);
    }).catch(console.error).finally(() => setLoading(false));
  }, [topic]);

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

  const answer = async (result) => {
    if (finished || !currentCard) return;
    try {
      await api(`/cards/${currentCard.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ result }),
      });
    } catch {}
    ebbinghaus.recordReview(currentCard.id, result === 1);
    const newResults = [...results, result];
    setResults(newResults);
    if (index + 1 >= cards.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const goPrev = () => {
    if (index === 0) return;
    setIndex(index - 1);
    setResults(prev => prev.slice(0, -1));
  };

  const restart = () => {
    setIndex(0);
    setResults([]);
    setFinished(false);
  };

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
          此章节暂无卡片
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
            <Chip color="success" variant="flat" size="sm">认识 {known}</Chip>
            <Chip color="danger" variant="flat" size="sm">不认识 {total - known}</Chip>
          </div>
          <div className="w-52 mt-4">
            <ProgressBar value={pct} color={color} size="sm" label="掌握率" showValueLabel />
          </div>
          <div className="flex gap-3 mt-6">
            <Button color="primary" variant="flat" onPress={restart}>再来一次</Button>
            <Button variant="bordered" onPress={onBack}>返回</Button>
          </div>
        </div>
      </div>
    );
  }

  const isEnglish = topic?.subject_id === 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <TopBar topic={topic} onBack={onBack} index={index} total={cards.length} />
      <div className="flex-1 flex flex-col px-4 md:px-8 pb-2 md:pb-4 overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
          {cards.map((_, i) => {
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
        <FlashCard key={currentCard.id} card={currentCard} isEnglish={isEnglish} />
        <div className="flex gap-3 flex-shrink-0 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="h-14 w-14 rounded-2xl flex-shrink-0"
            isDisabled={index === 0}
            onPress={goPrev}
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </Button>
          <Button
            color="danger"
            size="lg"
            variant="flat"
            className="flex-1 h-14 rounded-2xl font-bold text-base"
            startContent={<XMarkIcon className="w-5 h-5" />}
            onPress={() => answer(0)}
          >
            不认识
          </Button>
          <Button
            color="success"
            size="lg"
            variant="solid"
            className="flex-1 h-14 rounded-2xl font-bold text-base"
            startContent={<CheckIcon className="w-5 h-5" />}
            onPress={() => answer(1)}
          >
            认识
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ topic, onBack, index, total }) {
  return (
    <div className="px-4 pt-6 pb-0 md:px-8 md:pt-8 flex-shrink-0">
      <div className="flex items-center gap-3 mb-3">
        <Button isIconOnly variant="light" size="sm" onPress={onBack}>
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate">{topic?.name || ''}</h2>
        </div>
      </div>
      {index !== undefined && total !== undefined && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-default-400 whitespace-nowrap">{index + 1} / {total}</span>
          <ProgressBar value={(index / total) * 100} size="sm" color="primary" className="flex-1" />
        </div>
      )}
    </div>
  );
}

export default CardsPage;
