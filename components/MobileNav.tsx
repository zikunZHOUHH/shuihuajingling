
import React from 'react';
import { LayoutDashboard, MessageSquare, CheckSquare, User } from 'lucide-react';
import { ViewType } from '../types';
import { TODOS_DATA } from '../constants';

interface MobileNavProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
  const pendingCount = TODOS_DATA.filter(t => t.status === 'pending').length;

  const mobileTabs = [
    { id: ViewType.DASHBOARD, icon: LayoutDashboard, label: '指挥中心' },
    { id: ViewType.CHAT, icon: MessageSquare, label: 'AI智僚' },
    { id: ViewType.TODO, icon: CheckSquare, label: '今日待办', badge: pendingCount > 0 },
    { id: ViewType.SETTINGS, icon: User, label: '个人' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100]">
      <div className="glass-card rounded-[2rem] px-4 py-3 border-white/10 shadow-2xl flex items-center justify-between backdrop-blur-2xl bg-black/60">
        {mobileTabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ViewType)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-500 relative ${
                isActive ? 'text-blue-500' : 'text-slate-600'
              }`}
            >
              <div className="relative">
                <tab.icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
                )}
              </div>
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
