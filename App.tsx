
import React, { useState } from 'react';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import TodoView from './components/TodoView';
import PersonalView from './components/PersonalView';
import ArchitectureCanvas from './components/ArchitectureCanvas';
import { ViewType } from './types';
import { Code, Bell, User } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);

  const handleNavigate = (view: ViewType, context?: string) => {
    if (context) {
      setChatContext(context);
    }
    setActiveView(view);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] font-sans antialiased text-[#FFFFFF] overflow-hidden relative">
      {/* 顶部状态栏 */}
      <header className="shrink-0 h-14 flex items-center justify-between px-6 z-[60] bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-widest text-white leading-tight">水华精灵</span>
          <span className="text-[8px] tracking-[0.3em] text-blue-500 font-bold uppercase">Strategic Insight Hub V4.5</span>
        </div>
        <div className="flex items-center gap-4">
          <div 
            onClick={() => handleNavigate(ViewType.SETTINGS)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 border border-white/20 flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform"
          >
            <User size={14} className="text-white" />
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar scroll-smooth">
        {activeView === ViewType.DASHBOARD && <Dashboard onNavigate={handleNavigate} />}
        {activeView === ViewType.CHAT && (
          <ChatView 
            initialContext={chatContext} 
            onClearContext={() => setChatContext(null)} 
          />
        )}
        {activeView === ViewType.TODO && <TodoView onNavigate={handleNavigate} />}
        {activeView === ViewType.SETTINGS && <PersonalView />}
      </main>

      {/* 系统架构监控 - 保留入口但不在头像点击触发，可以通过其他调试手段开启或稍后重新关联 */}
      {showDevMode && <ArchitectureCanvas onClose={() => setShowDevMode(false)} />}

      {/* 底部导航 */}
      <MobileNav activeView={activeView} setActiveView={handleNavigate} />
    </div>
  );
};

export default App;
