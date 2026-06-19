import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Button, Chip, Spinner } from '@heroui/react';
import { ClockIcon, PlayIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import { getSubjectIcon, getSubjectColor } from '../utils';
import EbbinghausChart from '../components/EbbinghausChart';

function ReviewPage({ onSelectSubject, ebbinghaus }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    api('/subjects').then(setSubjects).catch(console.error).finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (loading || !subjects.length) return;
    const items = listRef.current?.children;
    if (!items?.length) return;
    // Skip first child (EbbinghausChart) if present
    const startIdx = items[0]?.dataset?.type === 'chart' ? 1 : 0;
    const cards = Array.from(items).slice(startIdx);
    gsap.from(cards, {
      opacity: 0, x: -20, duration: 0.4, stagger: 0.06, ease: 'power2.out',
    });
  }, { scope: listRef, dependencies: [loading, subjects.length] });

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
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8 space-y-4">
        {subjects.length === 0 ? (
          <Empty />
        ) : (
          <>
            <div data-type="chart"><EbbinghausChart retentionStats={ebbinghaus.getReentionStats()} /></div>
            {subjects.map(s => {
              const Icon = getSubjectIcon(s);
              const color = getSubjectColor(s);
              return (
                <Card key={s.id}
                  className="border border-transparent hover:border-primary/20 transition-shadow cursor-pointer hover:shadow-md"
                  onClick={() => onSelectSubject(s)}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                        {Icon && <Icon className={`w-6 h-6 text-${color}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{s.display_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Chip size="sm" variant="secondary" color="warning" className="gap-1">
                            <ClockIcon className="w-3 h-3" />待复习 {s.reviewed_cards || 0} 张
                          </Chip>
                          <span className="text-xs text-default-400">共 {s.total_cards} 张</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm"><PlayIcon className="w-4 h-4 mr-1" />复习</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
      <h2 className="text-2xl font-bold">复习计划</h2>
      <p className="text-sm text-default-400 mt-1">基于艾宾浩斯记忆曲线，科学安排复习</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-default-400">
      <ClockIcon className="w-16 h-16 mb-4 opacity-30" />
      <p className="text-base font-medium">暂无复习任务</p>
      <p className="text-sm mt-1">先去「学习」页面学习新卡片吧</p>
    </div>
  );
}

export default ReviewPage;
