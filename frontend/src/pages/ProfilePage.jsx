import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, ProgressBar, Spinner, Chip, Button, Separator } from '@heroui/react';
import { ChartBarIcon, CheckCircleIcon, ClockIcon, ArrowTrendingUpIcon, FireIcon, SwatchIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import { getSubjectIcon, getSubjectColor } from '../utils';
import { useAppTheme } from '../hooks/useTheme';

function ProfilePage({ ebbinghaus }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const statsGridRef = useRef(null);

  useEffect(() => {
    api('/stats').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalReviewed = ebbinghaus.getTotalReviewed();
  const theme = useAppTheme();

  useGSAP(() => {
    if (loading || !stats) return;
    const cards = statsGridRef.current?.children;
    if (!cards?.length) return;
    gsap.from(cards, {
      opacity: 0, y: 30, scale: 0.95,
      duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)',
    });
  }, { scope: statsGridRef, dependencies: [loading] });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pb-20"><Spinner size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8 space-y-4">
        <div ref={statsGridRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ChartBarIcon} label="总卡片" value={stats?.total_cards || 0} color="primary" />
          <StatCard icon={CheckCircleIcon} label="已复习" value={stats?.reviewed_cards || 0} color="success" />
          <StatCard icon={ClockIcon} label="待复习" value={stats?.pending_cards || 0} color="warning" />
          <StatCard icon={FireIcon} label="艾宾浩斯记录" value={totalReviewed} color="secondary" />
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowTrendingUpIcon className="w-5 h-5 text-success" />
              <span className="font-semibold">总体完成率</span>
              <Chip size="sm" color="success" variant="secondary" className="ml-auto">{stats?.completion_rate || 0}%</Chip>
            </div>
            <ProgressBar value={stats?.completion_rate || 0} color="success" size="md" aria-label="完成率">
              <ProgressBar.Output />
            </ProgressBar>
          </CardContent>
        </Card>

        {stats?.subjects?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ChartBarIcon className="w-5 h-5" />科目详情</h3>
            <div className="space-y-3">
              {stats.subjects.map(s => {
                const Icon = getSubjectIcon(s);
                const color = getSubjectColor(s);
                return (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                          {Icon && <Icon className={`w-5 h-5 text-${color}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{s.display_name}</h4>
                          <p className="text-xs text-default-400">{s.reviewed_cards}/{s.total_cards} 张</p>
                        </div>
                        <Chip size="sm" color={color === 'primary' ? 'accent' : color === 'secondary' ? 'default' : color} variant="secondary">{s.progress_pct}%</Chip>
                      </div>
                      <ProgressBar value={s.progress_pct} color={color === 'primary' ? 'accent' : color === 'secondary' ? 'default' : color} size="sm">
                        <ProgressBar.Output />
                      </ProgressBar>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {/* Theme settings */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <SwatchIcon className="w-5 h-5" />
            主题设置
          </h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme.mode === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5 text-warning" />}
                  <span className="text-sm">外观模式</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={theme.toggleMode}
                >
                  {theme.mode === 'dark' ? <MoonIcon className="w-4 h-4 mr-1" /> : <SunIcon className="w-4 h-4 mr-1" />}
                  {theme.mode === 'dark' ? '深色模式' : '浅色模式'}
                </Button>
              </div>
              <Separator />
              <div>
                <p className="text-sm mb-3">主题色</p>
                <div className="flex gap-2 flex-wrap">
                  {theme.THEMES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => theme.setColor(c.key)}
                      className={`w-9 h-9 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                        theme.color === c.key ? 'border-white ring-2 ring-offset-1 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.accent }}
                      title={c.name}
                    >
                      {theme.color === c.key && <CheckCircleIcon className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {theme.THEMES.map(c => (
                    <Chip
                      key={c.key}
                      size="sm"
                      variant={theme.color === c.key ? 'secondary' : 'soft'}
                      color={theme.color === c.key ? 'accent' : 'default'}
                      className="cursor-pointer"
                      onClick={() => theme.setColor(c.key)}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
      <h2 className="text-2xl font-bold">学习统计</h2>
      <p className="text-sm text-default-400 mt-1">追踪你的学习进度</p>
    </div>
  );
}

function AnimatedNumber({ value, duration = 0.8 }) {
  const ref = useRef(null);

  useGSAP(() => {
    if (value == null) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value, duration, ease: 'power2.out',
      onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(obj.val); },
    });
  }, { dependencies: [value] });

  return <span ref={ref}>0</span>;
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-2">
        <Icon className={`w-5 h-5 text-${color}`} />
        <div>
          <p className="text-2xl font-bold"><AnimatedNumber value={value} /></p>
          <p className="text-[11px] text-default-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfilePage;
