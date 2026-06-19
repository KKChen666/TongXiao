import { useRef, useCallback } from 'react';
import { Button, Chip } from '@heroui/react';
import { SpeakerWaveIcon, ArrowsRightLeftIcon, EyeIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function FlashCard({ card, isEnglish }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const flipped = useRef(false);
  const tweenRef = useRef(null);

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

  // Entrance animation
  useGSAP(() => {
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
        className="flex-1 cursor-pointer preserve-3d"
        style={{ perspective: 1200 }}
        onClick={handleFlip}
      >
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
              点击翻转查看答案
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
              点击翻回题目
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;
