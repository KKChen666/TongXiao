import { useRef, useEffect } from 'react';
import gsap from 'gsap';

function SplashPage({ onComplete }) {
  const containerRef = useRef(null);
  const bgRef = useRef(null);
  const inkRef = useRef(null);
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const engTextRef = useRef(null);
  const chTextRef = useRef(null);
  const sealRef = useRef(null);
  const sloganRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out entire splash
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete,
        });
      },
    });

    // 1. Background fade in
    tl.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });

    // 2. Ink stroke reveal (draw + fill)
    const inkEl = inkRef.current;
    if (inkEl) {
      const pathLength = inkEl.getTotalLength ? inkEl.getTotalLength() : 2000;
      gsap.set(inkEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength, fillOpacity: 0 });
      tl.to(inkEl, { strokeDashoffset: 0, fillOpacity: 1, duration: 1.6, ease: 'power2.inOut' }, '-=0.1');
    }

    // 3. Glow circle + dot appear
    tl.fromTo(glowRef.current, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', transformOrigin: '50% 50%' }, '-=0.4');
    tl.fromTo(dotRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, '-=0.3');

    // 4. English text slide up
    tl.fromTo(engTextRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');

    // 5. Chinese text slide up
    tl.fromTo(chTextRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

    // 6. Seal stamp
    tl.fromTo(sealRef.current,
      { opacity: 0, scale: 2, rotation: -10 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' },
      '-=0.2'
    );

    // 7. Slogan slide up
    tl.fromTo(sloganRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');

    // 8. Hold for a moment then complete
    tl.to({}, { duration: 0.8 });

    return () => tl.kill();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8F8F6]"
    >
      <div className="w-[280px] h-[280px] md:w-[380px] md:h-[380px]">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F0BA42" stopOpacity="1" />
              <stop offset="100%" stopColor="#F0BA42" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect ref={bgRef} width="1024" height="1024" fill="#F8F8F6" opacity="0" />

          {/* Ink stroke */}
          <path
            ref={inkRef}
            d="M140 290
               C240 240,380 245,500 285
               C620 325,740 305,865 235
               C760 325,620 370,470 340
               C330 312,220 305,140 290 Z"
            fill="#1E1E1E"
            stroke="#1E1E1E"
            strokeWidth="2"
          />

          {/* Glow circle */}
          <circle ref={glowRef} cx="512" cy="286" r="52" fill="url(#glow)" opacity="0" />
          <circle ref={dotRef} cx="512" cy="286" r="5" fill="#F0BA42" opacity="0" />

          {/* English text */}
          <text
            ref={engTextRef}
            x="512" y="500"
            textAnchor="middle"
            fontFamily="Poppins, Arial, sans-serif"
            fontSize="92"
            fill="#1E1E1E"
            letterSpacing="4"
            opacity="0"
          >
            TongXiao
          </text>

          {/* Chinese text */}
          <text
            ref={chTextRef}
            x="512" y="615"
            textAnchor="middle"
            fontFamily="KaiTi, STKaiti, serif"
            fontSize="86"
            fill="#1E1E1E"
            opacity="0"
          >
            通霄
          </text>

          {/* Seal */}
          <g ref={sealRef} opacity="0">
            <rect x="620" y="560" width="42" height="58" rx="4" fill="#C62828" />
            <text
              x="641" y="600"
              textAnchor="middle"
              fontFamily="KaiTi, serif"
              fontSize="22"
              fill="white"
            >
              印
            </text>
          </g>

          {/* Slogan */}
          <text
            ref={sloganRef}
            x="512" y="690"
            textAnchor="middle"
            fontFamily="Microsoft YaHei, Arial, sans-serif"
            fontSize="28"
            letterSpacing="4"
            fill="#444444"
            opacity="0"
          >
            背至通宵 · 终将通晓
          </text>
        </svg>
      </div>
    </div>
  );
}

export default SplashPage;
