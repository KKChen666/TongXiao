import { Button, Separator } from '@heroui/react';
import { tabs } from './BottomNav';
import { SparklesIcon } from '@heroicons/react/24/outline';

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:flex-shrink-0 bg-content1 border-r border-divider h-full">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">TongXiao</h1>
        </div>
        <p className="text-xs text-default-400">考研背诵 · 艾宾浩斯记忆</p>
      </div>
      <Separator />
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <Button
              key={t.key}
              variant={isActive ? 'flat' : 'light'}
              color={isActive ? 'primary' : 'default'}
              onPress={() => onTabChange(t.key)}
              className="w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl font-medium"
              startContent={<Icon className="w-5 h-5" />}
            >
              {t.label}
            </Button>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4">
        <p className="text-[11px] text-default-300 text-center">TongXiao v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
