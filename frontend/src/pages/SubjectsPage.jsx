import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, Spinner, Chip } from '@heroui/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../api';
import { getSubjectIcon, getSubjectColor } from '../utils';

function SubjectsPage({ onSelectSubject, ebbinghaus }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    api('/subjects').then(setSubjects).catch(console.error).finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (loading || !subjects.length) return;
    const cards = gridRef.current?.children;
    if (!cards?.length) return;
    gsap.from(cards, {
      opacity: 0,
      y: 40,
      scale: 0.92,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power3.out',
    });
  }, { scope: gridRef, dependencies: [loading, subjects.length] });

  if (loading) {
    return <PageShell header={<Header />}><Spinner size="lg" /></PageShell>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4 md:px-8 md:pb-8">
          {!subjects.length ? (
            <PageShell><p className="text-base text-default-400">暂无科目，请先导入学习资料</p></PageShell>
          ) : (
            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {subjects.map(s => {
                const Icon = getSubjectIcon(s);
                const color = getSubjectColor(s);
                return (
                  <Card
                    key={s.id}
                    className="border border-transparent hover:border-primary/20 transition-shadow duration-200 cursor-pointer hover:shadow-md"
                    onClick={() => onSelectSubject(s)}
                  >
                    <CardContent className="p-4 md:p-5 flex flex-col items-center text-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center`}>
                        {Icon && <Icon className={`w-8 h-8 text-${color}`} />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base">{s.display_name}</h3>
                        <p className="text-xs text-default-400 mt-1">{s.total_cards} 张卡片</p>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 pb-4 pt-0 flex justify-center gap-2">
                      <Chip size="sm" variant="flat" color="primary">新学 {s.total_cards - s.reviewed_cards}</Chip>
                      {s.reviewed_cards > 0 && <Chip size="sm" variant="flat" color="success">已学 {s.reviewed_cards}</Chip>}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-4 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4 flex-shrink-0">
      <h2 className="text-2xl font-bold">TongXiao</h2>
      <p className="text-sm text-default-400 mt-1">考研背诵 · 选择科目开始记忆</p>
    </div>
  );
}

function PageShell({ children }) {
  return <div className="flex-1 flex items-center justify-center pb-20">{children}</div>;
}

export default SubjectsPage;
