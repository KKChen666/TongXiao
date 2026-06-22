import { useRef, useCallback } from 'react';
import { Button, Chip } from '@heroui/react';
import { SpeakerWaveIcon, ArrowsRightLeftIcon, EyeIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function FlashCard({ card, isEnglish, onSwipe, onAiClick }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const flipped = useRef(false);
  const tweenRef = useRef(null);
  const touchStart = useRef(null);
  const swipeIndicatorRef = useRef(null);

  const speak = useCallback((text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  const handleSpeak = useCallback((e) => {
    e.stopPropagation();
    speak(card.front);
  }, [speak, card.front]);

  const { contextSafe } = useGSAP(() => {}, { scope: containerRef });

  const handleFlip = contextSafe(() => {
    flipped.current = !flipped.current;
    if (tweenRef.current) tweenRef.current.kill();
    tweenRef.current = gsap.to(cardRef.current, {
      rotationX: flipped.current ? 180 : 0,
      duration: 0.6,
      ease: 'power2.inOut',
    });
  });

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;

    // Determine primary direction
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isHorizontal && Math.abs(dx) > 10) {
      // Horizontal swipe - 认识/不认识
      e.preventDefault();
      const clampedDx = Math.max(-120, Math.min(120, dx));
      const rotate = clampedDx * 0.05;
      if (cardRef.current) {
        gsap.set(cardRef.current, { x: clampedDx, rotation: rotate });
      }
      if (swipeIndicatorRef.current) {
        if (dx > 40) {
          swipeIndicatorRef.current.textContent = '认识';
          swipeIndicatorRef.current.className = 'absolute top-4 right-4 text-green-600 font-bold text-lg z-10 opacity-80';
        } else if (dx < -40) {
          swipeIndicatorRef.current.textContent = '不认识';
          swipeIndicatorRef.current.className = 'absolute top-4 left-4 text-red-600 font-bold text-lg z-10 opacity-80';
        } else {
          swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0';
        }
      }
    } else if (!isHorizontal && Math.abs(dy) > 10) {
      // Vertical swipe - 切换卡片
      e.preventDefault();
      const clampedDy = Math.max(-120, Math.min(120, dy));
      if (cardRef.current) {
        gsap.set(cardRef.current, { y: clampedDy });
      }
      if (swipeIndicatorRef.current) {
        if (dy < -40) {
          swipeIndicatorRef.current.textContent = '下一张';
          swipeIndicatorRef.current.className = 'absolute bottom-4 left-1/2 -translate-x-1/2 text-blue-600 font-bold text-lg z-10 opacity-80';
        } else if (dy > 40) {
          swipeIndicatorRef.current.textContent = '上一张';
          swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-blue-600 font-bold text-lg z-10 opacity-80';
        } else {
          swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0';
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const startX = touchStart.current.x;
    const startY = touchStart.current.y;
    const startTime = touchStart.current.time;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const elapsed = Date.now() - startTime;

    touchStart.current = null;

    // Reset visual position
    if (cardRef.current) {
      gsap.to(cardRef.current, { x: 0, y: 0, rotation: 0, duration: 0.3, ease: 'power2.out' });
    }
    if (swipeIndicatorRef.current) {
      swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0';
    }

    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const distance = isHorizontal ? Math.abs(dx) : Math.abs(dy);

    // Detect swipe: min distance 60px, max time 500ms
    if (distance > 60 && elapsed < 500 && onSwipe) {
      if (isHorizontal) {
        // Horizontal swipe - 认识/不认识
        const direction = dx > 0 ? 'know' : 'unknown';
        gsap.to(cardRef.current, {
          x: dx > 0 ? 400 : -400,
          rotation: dx > 0 ? 15 : -15,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => onSwipe(direction),
        });
      } else {
        // Vertical swipe - 切换卡片
        const direction = dy < 0 ? 'next' : 'prev';
        gsap.to(cardRef.current, {
          y: dy < 0 ? -400 : 400,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => onSwipe(direction),
        });
      }
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && elapsed < 300) {
      // Tap -> flip
      handleFlip();
    }
  }, [onSwipe, handleFlip]);

  // Entrance animation
  useGSAP(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: 0, y: 0, rotation: 0, opacity: 1 });
    }
    gsap.from(cardRef.current, {
      opacity: 0,
      y: 30,
      scale: 0.95,
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  }, { scope: containerRef, dependencies: [card.id] });

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0 py-2">
      <div
        className="flex-1 cursor-pointer preserve-3d relative"
        style={{ perspective: 1200 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={swipeIndicatorRef} className="absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0 transition-opacity" />
        <div ref={cardRef} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* 正面 */}
          <div
            className="absolute inset-0 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {onAiClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onAiClick(); }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors pointer-events-auto z-10 flex items-center gap-1"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-xs font-medium">AI</span>
              </button>
            )}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 pointer-events-auto">
              <div className="flex flex-col items-center justify-center min-h-full">
                <Chip size="sm" variant="secondary" color="accent" className="mb-6 gap-1.5 pointer-events-none">
                  <LightBulbIcon className="w-3.5 h-3.5" />
                  题目
                </Chip>
                <div className="text-3xl md:text-4xl font-bold text-center break-all leading-relaxed select-none">
                  {card.front}
                </div>
                {card.phonetic && (
                  <div className="text-lg text-default-400 mt-3 select-none">/{card.phonetic}/</div>
                )}
                {isEnglish && (
                  <div className="mt-6">
                    <Button variant="ghost" size="sm" onPress={handleSpeak}>
                      <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                      朗读发音
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-default-300 py-3 px-6 select-none pointer-events-none border-t border-gray-100">
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                左滑不认识
              </span>
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5 rotate-90" />
                上下滑切换
              </span>
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                右滑认识
              </span>
            </div>
          </div>

          {/* 背面 */}
          <div
            className="absolute inset-0 flex flex-col bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl shadow-sm overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
          >
            {onAiClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onAiClick(); }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors pointer-events-auto z-10 flex items-center gap-1"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-xs font-medium">AI</span>
              </button>
            )}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 pointer-events-auto">
              <div className="flex flex-col items-center justify-center min-h-full">
                <Chip size="sm" variant="secondary" color="success" className="mb-4 gap-1.5 pointer-events-none">
                  <EyeIcon className="w-3.5 h-3.5" />
                  答案
                </Chip>
                <div className="text-base text-default-500 mb-3 select-none">{card.front}</div>
                <div className="text-xl md:text-2xl text-center font-semibold leading-relaxed whitespace-pre-line px-2 select-none">
                  {card.back_detail || card.back}
                </div>
                {card.example && (
                  <div className="text-sm text-default-500 text-center mt-6 px-4 leading-relaxed border-t border-default-200 pt-4 w-full select-none">
                    <span className="text-default-400 text-xs">例句：</span><br />
                    {card.example}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-default-300 py-3 px-6 select-none pointer-events-none border-t border-blue-100">
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                左滑不认识
              </span>
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5 rotate-90" />
                上下滑切换
              </span>
              <span className="flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                右滑认识
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
