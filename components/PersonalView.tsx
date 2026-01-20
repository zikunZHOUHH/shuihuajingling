import React, { useState } from 'react';
import { 
  User, Sparkles, Clipboard, Target, 
  Save, Brain, History,
  Database, Bookmark, ShieldCheck, 
  Zap, MessageSquare, Trash2, ShieldAlert,
  Settings2, MessageCircle, X, Check,
  Wind, Waves, Flame, Cloud
} from 'lucide-react';

const TONE_MODES = [
  { 
    id: 'calm', 
    name: '专业冷静模式', 
    desc: '基于数据与逻辑深度推演，提供客观中立的战略建议', 
    icon: Waves, 
    color: 'blue' 
  },
  { 
    id: 'agile', 
    name: '敏捷执行模式', 
    desc: '聚焦行动指令与即时反馈，最大化缩短决策响应链路', 
    icon: Wind, 
    color: 'emerald' 
  },
  { 
    id: 'creative', 
    name: '深度推演模式', 
    desc: '跳出常规思维框架，从系统全局视野探索突变机遇', 
    icon: Flame, 
    color: 'orange' 
  },
  { 
    id: 'balanced', 
    name: '柔波共理模式', 
    desc: '兼顾组织情绪与人文维度，提供更具温度的协同决策', 
    icon: Cloud, 
    color: 'purple' 
  }
];

const PersonalView: React.FC = () => {
  const [memo, setMemo] = useState("目前核心关注华东大区 Q3 的市场占有率提升，重点关注竞品东鹏的价格战动作。内部需要进一步压缩 3 号生产线的切换成本。");
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [currentTone, setCurrentTone] = useState(TONE_MODES[0]);

  // 模拟 AI 记忆数据
  const [memories, setMemories] = useState([
    {
      id: 1,
      category: '战略偏好',
      content: '董事长倾向于在市场波动期采取“积极对冲”而非“被动观望”，优先保住核心渠道毛利。',
      timestamp: '2024-05-20 14:30',
      icon: Target,
      color: 'blue'
    },
    {
      id: 2,
      category: '风险阈值',
      content: '系统已记录：当毛利率低于 22.5% 时，需立即触发董事会级别的紧急预警。',
      timestamp: '2024-05-18 09:12',
      icon: ShieldCheck,
      color: 'orange'
    },
    {
      id: 3,
      category: '交互语境',
      content: '用户在讨论财务报表时，更关注“现金流充裕度”而非单纯的“账面利润”。',
      timestamp: '2024-05-15 16:45',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      id: 4,
      category: '业务洞察',
      content: '已固化记忆：二号基地 3 号产线是目前的降本增效核心突破口，已关联至相关任务链。',
      timestamp: '2024-05-12 11:20',
      icon: Zap,
      color: 'emerald'
    }
  ]);

  const deleteMemory = (id: number) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const handleSelectTone = (tone: typeof TONE_MODES[0]) => {
    setCurrentTone(tone);
    setShowToneSelector(false);
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 个人资料卡片 - 权限与人格语调 */}
      <div className="glass-card p-6 rounded-[2.5rem] border-white/10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 blur-[50px] rounded-full"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 p-0.5 shadow-xl shadow-blue-900/20">
            <div className="w-full h-full rounded-[1.4rem] bg-black flex items-center justify-center">
                <User size={30} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">朱江 <span className="text-[10px] text-slate-500 font-mono ml-2">UID: X-ESSENCE-001</span></h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1 text-glow-blue">首席战略官 / 核心指挥官</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
            {/* 权限层级 */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1.5 group hover:bg-white/[0.04] transition-all relative overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={10} className="text-red-500" />
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">管理权限层级</span>
                </div>
                <span className="text-xs font-mono-prec font-bold text-white">超级管理员 <span className="text-[8px] text-red-500 font-mono opacity-80">(ROOT)</span></span>
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-red-500/50 to-transparent"></div>
            </div>
            {/* 智僚人格语调 */}
            <div 
              onClick={() => setShowToneSelector(true)}
              className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1.5 group hover:bg-white/[0.04] transition-all relative overflow-hidden cursor-pointer active:scale-95"
            >
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={10} className="text-blue-500" />
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">智僚人格语调</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono-prec font-bold text-${currentTone.color}-400`}>{currentTone.name}</span>
                  <Settings2 size={10} className="text-slate-700 animate-spin-slow" />
                </div>
                <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-${currentTone.color}-500/50 to-transparent`}></div>
            </div>
        </div>
      </div>

      {/* 语调选择器 Overlay */}
      {showToneSelector && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowToneSelector(false)}></div>
          <div className="w-full max-w-md glass-card rounded-[2.5rem] border-white/10 p-6 z-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <MessageSquare size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">配置智僚人格模态</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Select Active Persona Tone</p>
                </div>
              </div>
              <button onClick={() => setShowToneSelector(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {TONE_MODES.map((tone) => (
                <div 
                  key={tone.id}
                  onClick={() => handleSelectTone(tone)}
                  className={`p-4 rounded-[1.5rem] border transition-all cursor-pointer flex items-center gap-4 group ${
                    currentTone.id === tone.id 
                    ? `bg-${tone.color}-500/10 border-${tone.color}-500/30` 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentTone.id === tone.id ? `bg-${tone.color}-500/20 text-${tone.color}-400` : 'bg-white/5 text-slate-600'
                  }`}>
                    <tone.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${currentTone.id === tone.id ? `text-${tone.color}-400` : 'text-slate-300'}`}>
                        {tone.name}
                      </span>
                      {currentTone.id === tone.id && <Check size={14} className={`text-${tone.color}-400`} />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                      {tone.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 战略语境备忘录 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <Clipboard size={14} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">手动战略语境</h3>
            </div>
            <Save size={14} className="text-slate-600 hover:text-white transition-colors cursor-pointer active:scale-90" />
        </div>
        <div className="glass-card p-5 rounded-[2rem] border-white/5 relative">
            <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-slate-300 text-[13px] leading-relaxed h-28 resize-none placeholder:text-slate-800 font-light"
                placeholder="输入当前的企业背景或特别关注点..."
            />
            <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-600 italic">
                <Sparkles size={10} /> 这里的指令将拥有最高级别的分析优先级
            </div>
        </div>
      </div>

      {/* AI 智僚核心记忆库 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
              <Brain size={14} className="text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">AI 智僚核心记忆库</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-slate-600 uppercase">Capacity: 12%</span>
            <Database size={10} className="text-slate-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          {memories.map((memory) => (
            <div key={memory.id} className="glass-card p-5 rounded-[2rem] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-${memory.color}-500/10 text-${memory.color}-400`}>
                    <memory.icon size={12} />
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                    memory.color === 'blue' ? 'border-blue-500/30 text-blue-400' :
                    memory.color === 'orange' ? 'border-orange-500/30 text-orange-400' :
                    memory.color === 'purple' ? 'border-purple-500/30 text-purple-400' :
                    'border-emerald-500/30 text-emerald-400'
                  }`}>
                    {memory.category}
                  </span>
                </div>
                <button 
                  onClick={() => deleteMemory(memory.id)}
                  className="p-1.5 text-slate-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[13px] text-slate-300 leading-relaxed font-light mb-3">
                {memory.content}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1 text-[8px] font-mono text-slate-600">
                  <History size={8} />
                  {memory.timestamp}
                </div>
                <div className="flex items-center gap-1">
                   <Bookmark size={8} className="text-blue-500 fill-blue-500/20" />
                   <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter italic">Deep_Synapse_Stored</span>
                </div>
              </div>
            </div>
          ))}

          {memories.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem]">
              <Database size={24} className="text-slate-800 mb-2" />
              <span className="text-[10px] text-slate-700 uppercase tracking-widest">记忆库为空</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalView;