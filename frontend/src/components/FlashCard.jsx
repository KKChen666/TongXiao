import { useRef, useCallback } from 'react';
import { Button, Chip } from '@heroui/react';
import { SpeakerWaveIcon, ArrowsRightLeftIcon, EyeIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function FlashCard({ card, isEnglish, onSwipe }) {
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
  }, [speak, card]);

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

    // Only handle horizontal swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
      // Visual feedback: slight rotation + translate
      const clampedDx = Math.max(-120, Math.min(120, dx));
      const rotate = clampedDx * 0.05;
      if (cardRef.current) {
        gsap.set(cardRef.current, {
          x: clampedDx,
          rotation: rotate,
        });
      }
      // Show swipe indicator
      if (swipeIndicatorRef.current) {
        if (dx > 40) {
          swipeIndicatorRef.current.textContent = '认识';
          swipeIndicatorRef.current.className = 'absolute top-4 right-4 text-success font-bold text-lg z-10 opacity-80';
        } else if (dx < -40) {
          swipeIndicatorRef.current.textContent = '不认识';
          swipeIndicatorRef.current.className = 'absolute top-4 left-4 text-danger font-bold text-lg z-10 opacity-80';
        } else {
          swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0';
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const elapsed = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Reset visual position
    if (cardRef.current) {
      gsap.to(cardRef.current, { x: 0, rotation: 0, duration: 0.3, ease: 'power2.out' });
    }
    if (swipeIndicatorRef.current) {
      swipeIndicatorRef.current.className = 'absolute top-4 left-1/2 -translate-x-1/2 text-lg font-bold z-10 opacity-0';
    }

    // Detect swipe: min distance 60px, max time 500ms
    const isSwipe = Math.abs(dx) > 60 && elapsed < 500 && Math.abs(dx) > Math.abs(touch.clientY - (touchStart.current?.y || touch.clientY));

    if (isSwipe && onSwipe) {
      // Animate card out
      const direction = dx > 0 ? 1 : -1;
      gsap.to(cardRef.current, {
        x: direction * 400,
        rotation: direction * 15,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          onSwipe(direction > 0 ? 'right' : 'left');
        },
      });
    } else if (Math.abs(dx) < 10 && elapsed < 300) {
      // Tap -> flip
      handleFlip();
    }
  }, [onSwipe, handleFlip]);

  // Entrance animation
  useGSAP(() => {
    if (cardRef.current) {
      gsap.set(cardRef.current, { x: 0, rotation: 0, opacity: 1 });
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
            className="absolute inset-0 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-sm pointer-events-none"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
              <Chip size="sm" variant="secondary" color="accent" className="mb-6 gap-1.5">
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
                <div className="pointer-events-auto mt-6">
                  <Button variant="ghost" size="sm"
                    onPress={handleSpeak}>
                    <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                    朗读发音
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-default-300 mt-4 select-none">
              <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
              左滑不认识 · 右滑认识 · 点击翻转
            </div>
          </div>

          {/* 背面 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-6 md:p-10 shadow-sm pointer-events-none"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
              <Chip size="sm" variant="secondary" color="success" className="mb-4 gap-1.5">
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
            <div className="flex items-center gap-1.5 text-xs text-default-300 mt-4 select-none">
              <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
              左滑不认识 · 右滑认识 · 点击翻转
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
