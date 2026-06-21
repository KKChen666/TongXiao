import { Button } from '@heroui/react';
import { BookOpenIcon, ClockIcon, ArrowDownTrayIcon, UserIcon, RectangleStackIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

const tabs = [
  { key: 'learn', icon: BookOpenIcon, label: '学习' },
  { key: 'review', icon: ClockIcon, label: '复习' },
  { key: 'ai', icon: ChatBubbleBottomCenterTextIcon, label: 'AI' },
  { key: 'wordbook', icon: RectangleStackIcon, label: '词书' },
  { key: 'import', icon: ArrowDownTrayIcon, label: '导入' },
  { key: 'profile', icon: UserIcon, label: '我的' },
];

function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="md:hidden flex bg-background border-t border-divider flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = activeTab === t.key;
        return (
          <Button
            key={t.key}
            variant="ghost"
            onPress={() => onTabChange(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-none h-auto min-h-0 ${isActive ? 'text-primary' : 'text-default-400'}`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[11px] font-medium">{t.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
export { tabs };
