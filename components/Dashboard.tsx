
import React, { useState } from 'react';
import { Sparkles, Wallet, ChevronRight, Target, Radar, Box, Cpu, Zap, Gem, ReceiptText, PieChart, Info, Building2, TrendingUp, Share2 } from 'lucide-react';
import { ViewType } from '../types';
import ShareSheet from './ShareSheet';

const ClusterItem: React.FC<{
  name: string;
  revenue: string;
  progress: number;
  icon: any;
  color: string;
  trend: string;
  onClick: () => void;
}> = ({ name, revenue, progress, icon: Icon, color, trend, onClick }) => (
  <div 
    onClick={onClick}
    className="w-full glass-card p-4 rounded-[1.8rem] border-white/10 bg-white/5 flex flex-col justify-between h-[150px] relative overflow-hidden group active:scale-[0.96] transition-all"
  >
    <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${color}-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform`}></div>
    <div className="flex justify-between items-start z-10">
      <div className={`p-2 rounded-xl bg-${color}-500/20 text-${color}-400`}>
        <Icon size={14} />
      </div>
      <div className="text-right">
        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5 truncate max-w-[60px]">{name}</span>
        <span className="text-[9px] font-mono text-emerald-400 font-bold">{trend}</span>
      </div>
    </div>
    <div className="z-10 mt-1">
      <div className="text-[9px] text-slate-500 font-bold uppercase mb-0.5 italic">REVENUE</div>
      <div className="text-lg font-mono-prec font-bold text-white tracking-tighter mb-2">{revenue}</div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 shadow-[0_0_8px_${color === 'blue' ? '#3b82f6' : color}]`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[7px] text-slate-500 font-bold uppercase">达成率</span>
        <span className="text-[7px] font-mono text-slate-400">{progress}%</span>
      </div>
    </div>
  </div>
);

const CostCard: React.FC<{
  name: string;
  cost: string;
  breakdown: { label: string; value: string }[];
  color: string;
  onClick: () => void;
}> = ({ name, cost, breakdown, color, onClick }) => (
  <div 
    onClick={onClick}
    className="w-full glass-card p-4 rounded-[1.8rem] border-white/5 bg-white/2 flex flex-col justify-between h-[150px] relative overflow-hidden group active:scale-[0.96] transition-all"
  >
    <div className="z-10 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ReceiptText size={10} className={`text-${color}-400`} />
          <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">成本构成洞察</span>
        </div>
        <div className="text-lg font-mono-prec font-bold text-red-500 tracking-tighter mb-2">{cost}</div>
      </div>
      
      <div className="space-y-1">
        {breakdown.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-white/[0.03] pb-1">
            <span className="text-[7px] text-slate-400 truncate pr-2 font-medium">{item.label}</span>
            <span className="text-[7px] font-mono font-bold text-slate-300">{item.value}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-1 mt-1 opacity-40">
        <Info size={8} />
        <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter italic">可穿透降本空间评估 15%+</span>
      </div>
    </div>
  </div>
);

const InsightItem: React.FC<{ 
  icon: any; 
  color: string; 
  text: string | React.ReactNode; 
  subtext: string; 
  isUrgent?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, color, text, subtext, isUrgent, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all group select-none active:scale-[0.98] ${
    onClick ? 'cursor-pointer' : ''
  } ${
    isUrgent ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5' : 'bg-white/5 border-white/5 hover:bg-white/10'
  }`}>
    <div className={`p-2.5 rounded-xl bg-${color}-500/20 text-${color}-400 shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] text-slate-200 leading-snug mb-1.5">{text}</div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{subtext}</span>
        {isUrgent && <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>}
      </div>
    </div>
    <div className="flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <ChevronRight size={14} className="text-blue-500" />
    </div>
  </div>
);

const Dashboard: React.FC<{ onNavigate: (v: ViewType, ctx?: string) => void }> = ({ onNavigate }) => {
  const [shareConfig, setShareConfig] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: {} });

  const clusters = [
    { name: "帝王事业集群", revenue: "48.2 亿", cost: "32.1 亿", progress: 82, icon: Box, color: "blue", trend: "+5.2%", breakdown: [{label: "研发支出", value: "8.4亿"}, {label: "供应链", value: "15.2亿"}] },
    { name: "欧神诺事业集群", revenue: "61.5 亿", cost: "41.8 亿", progress: 74, icon: Gem, color: "emerald", trend: "+3.8%", breakdown: [{label: "窑炉能源", value: "12.1亿"}, {label: "物流中心", value: "9.5亿"}] },
    { name: "AI 事业集群", revenue: "12.4 亿", cost: "8.6 亿", progress: 91, icon: Cpu, color: "purple", trend: "+124%", breakdown: [{label: "算力租赁", value: "4.2亿"}, {label: "人才激励", value: "2.1亿"}] },
    { name: "新材料事业集群", revenue: "26.1 亿", cost: "19.5 亿", progress: 62, icon: Zap, color: "orange", trend: "+8.4%", breakdown: [{label: "产线升级", value: "7.8亿"}, {label: "环保处理", value: "3.2亿"}] },
  ];

  const handleClusterClick = (name: string, isCost: boolean = false) => {
    const context = `请为我深度剖析 ${name} 的 ${isCost ? '大额支出成本构成及降本建议' : '核心营收指标及未来战略推演'}。请重点分析目前的 ${isCost ? '成本管控风险' : '市场竞争格局'} 并在对话中生成具体的策略建议。`;
    onNavigate(ViewType.CHAT, context);
  };

  const handleShareLiquidity = () => {
    setShareConfig({
        isOpen: true,
        data: {
            title: "集团实时流动头寸日报 (¥148.2亿)",
            type: "liquidity-snapshot"
        }
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-700 bg-black relative">
      <ShareSheet 
        isOpen={shareConfig.isOpen} 
        onClose={() => setShareConfig({ ...shareConfig, isOpen: false })} 
        data={shareConfig.data} 
      />

      {/* 1. 全球可用余额总枢纽 */}
      <div className="relative glass-card rounded-[2.5rem] border-white/10 bg-gradient-to-br from-blue-900/20 to-black p-7 overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Wallet size={80} className="text-blue-500" />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse glow-blue"></div>
                <span className="text-[9px] font-bold tracking-[0.3em] text-slate-500 uppercase">实时流动头寸监控 (LIQUIDITY_MONITOR)</span>
            </div>
            <button 
                onClick={handleShareLiquidity}
                className="p-2 bg-white/5 hover:bg-blue-600/20 rounded-xl border border-white/5 transition-all active:scale-90"
            >
                <Share2 size={14} className="text-slate-400 group-hover:text-blue-400" />
            </button>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-mono-prec font-bold text-white tracking-tighter">¥ 148.2</span>
            <span className="text-lg font-bold text-blue-500">亿</span>
        </div>
        <div className="mt-4 flex gap-4">
            <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">较上日变动</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">+2.41%</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">异常拦截状态</span>
                <span className="text-xs font-mono text-blue-500 font-bold">健康 (HEALTHY)</span>
            </div>
        </div>
      </div>

      {/* 2. 事业集群：数据分屏 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <PieChart size={14} className="text-blue-500" />
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">事业集群经营快照</h3>
            </div>
            <div className="flex gap-1.5 items-center">
                <span className="text-[8px] text-slate-600 font-bold animate-pulse uppercase">右滑查阅 AI / 新材料</span>
                <ChevronRight size={10} className="text-slate-700" />
            </div>
        </div>
        
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            <div className="w-full shrink-0 snap-start grid grid-cols-2 gap-3 pr-2">
                <ClusterItem 
                    name={clusters[0].name} 
                    revenue={clusters[0].revenue} 
                    progress={clusters[0].progress} 
                    icon={clusters[0].icon} 
                    color={clusters[0].color} 
                    trend={clusters[0].trend}
                    onClick={() => handleClusterClick(clusters[0].name)}
                />
                <CostCard 
                    name={clusters[0].name.split('事业')[0]} 
                    cost={clusters[0].cost} 
                    breakdown={clusters[0].breakdown} 
                    color={clusters[0].color}
                    onClick={() => handleClusterClick(clusters[0].name, true)}
                />
                <ClusterItem 
                    name={clusters[1].name} 
                    revenue={clusters[1].revenue} 
                    progress={clusters[1].progress} 
                    icon={clusters[1].icon} 
                    color={clusters[1].color} 
                    trend={clusters[1].trend}
                    onClick={() => handleClusterClick(clusters[1].name)}
                />
                <CostCard 
                    name={clusters[1].name.split('事业')[0]} 
                    cost={clusters[1].cost} 
                    breakdown={clusters[1].breakdown} 
                    color={clusters[1].color}
                    onClick={() => handleClusterClick(clusters[1].name, true)}
                />
            </div>
            <div className="w-full shrink-0 snap-start grid grid-cols-2 gap-3 pr-2">
                <ClusterItem 
                    name={clusters[2].name} 
                    revenue={clusters[2].revenue} 
                    progress={clusters[2].progress} 
                    icon={clusters[2].icon} 
                    color={clusters[2].color} 
                    trend={clusters[2].trend}
                    onClick={() => handleClusterClick(clusters[2].name)}
                />
                <CostCard 
                    name={clusters[2].name.split('事业')[0]} 
                    cost={clusters[2].cost} 
                    breakdown={clusters[2].breakdown} 
                    color={clusters[2].color}
                    onClick={() => handleClusterClick(clusters[2].name, true)}
                />
                <ClusterItem 
                    name={clusters[3].name} 
                    revenue={clusters[3].revenue} 
                    progress={clusters[3].progress} 
                    icon={clusters[3].icon} 
                    color={clusters[3].color} 
                    trend={clusters[3].trend}
                    onClick={() => handleClusterClick(clusters[3].name)}
                />
                <CostCard 
                    name={clusters[3].name.split('事业')[0]} 
                    cost={clusters[3].cost} 
                    breakdown={clusters[3].breakdown} 
                    color={clusters[3].color}
                    onClick={() => handleClusterClick(clusters[3].name, true)}
                />
            </div>
        </div>
      </div>

      {/* 3. AI 行业竞争战略脉冲 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-500" />
            <h3 className="text-[10px] font-bold tracking-[0.1em] text-white uppercase italic">行业竞争态势雷达</h3>
          </div>
          <Radar size={12} className="text-emerald-500 animate-spin-slow" />
        </div>

        <div className="glass-card p-2 rounded-[2rem] border-white/5 space-y-2.5">
          {[
            { id: 1, icon: Target, color: "orange", isUrgent: true, text: "东鹏瓷砖在华东区启动价格战，主流岩板下调 14%，建议分析我方对冲策略。", subtext: "市场态势分析" },
            { id: 4, icon: Building2, color: "blue", text: "万科等头部房企正寻求『AI+智慧精装』数字化方案，欧神诺可考虑提前进行场景化技术预研。", subtext: "AI战略预研建议" },
            { id: 3, icon: TrendingUp, color: "emerald", text: "标杆房企对“零碳瓷砖”集采兴趣提升 18%，建议推演绿色供应链竞争优势。", subtext: "战略溢价评估" }
          ].map(item => (
            <InsightItem 
              key={item.id}
              icon={item.icon} 
              color={item.color} 
              isUrgent={item.isUrgent}
              onClick={() => onNavigate(ViewType.CHAT, item.text)}
              text={item.text}
              subtext={item.subtext}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
