import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Button, Spinner, Chip } from '@heroui/react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import ProgressBar from '../components/ProgressBar';
import { getSubjectIcon, getSubjectColor } from '../utils';

function TopicsPage({ subject, onBack, onSelectTopic, ebbinghaus }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    api(`/subjects/${subject.id}/topics`)
      .then(setTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subject]);

  useGSAP(() => {
    if (loading || !topics.length) return;
    const items = listRef.current?.children;
    if (!items?.length) return;
    gsap.from(items, {
      opacity: 0,
      x: -30,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out',
    });
  }, { scope: listRef, dependencies: [loading, topics.length] });

  const Icon = getSubjectIcon(subject);
  const color = getSubjectColor(subject);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button isIconOnly variant="light" size="sm" onPress={onBack}>
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
            {Icon && <Icon className={`w-6 h-6 text-${color}`} />}
          </div>
          <div>
            <h2 className="text-lg font-bold">{subject?.display_name}</h2>
            <p className="text-xs text-default-400">{subject?.total_cards} 张卡片</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-default-400"><p className="text-base">暂无章节</p></div>
        ) : (
          <div ref={listRef} className="space-y-3">
            {topics.map(t => {
              const isNew = t.reviewed_cards === 0;
              return (
                <Card key={t.id}
                  className="border border-transparent hover:border-primary/20 transition-shadow duration-200 cursor-pointer hover:shadow-md"
                  onClick={() => onSelectTopic(t)}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{t.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-default-400">{t.total_cards} 张 | 已学 {t.reviewed_cards}</span>
                          {!isNew && <Chip size="sm" variant="flat" color="success" className="text-[10px] h-5">{t.progress_pct}%</Chip>}
                        </div>
                        <div className="mt-2"><ProgressBar pct={t.progress_pct} /></div>
                      </div>
                      <Button color="primary" size="sm" variant={isNew ? 'solid' : 'flat'} className="flex-shrink-0">
                        {isNew ? '开始学习' : '继续学习'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicsPage;
