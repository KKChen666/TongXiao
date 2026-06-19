import { Button, Separator } from '@heroui/react';
import { tabs } from './BottomNav';
import { SparklesIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

function Sidebar({ activeTab, onTabChange, user, onLogout }) {
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
              variant={isActive ? 'secondary' : 'ghost'}
              onPress={() => onTabChange(t.key)}
              className={`w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl font-medium ${isActive ? '' : 'text-default-500'}`}
            >
              <Icon className="w-5 h-5" />
              {t.label}
            </Button>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4 space-y-2">
        {user && (
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-default-500 truncate">{user.display_name || user.username}</span>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={onLogout}
              title="退出登录"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-default-400" />
            </Button>
          </div>
        )}
        <p className="text-[11px] text-default-300 text-center">TongXiao v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
