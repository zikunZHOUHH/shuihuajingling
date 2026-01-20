
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Cpu, Database, BarChart3, ChevronRight, CheckCircle2, Target, ShieldAlert, Zap, Brain, Activity, Radio, Terminal, Network, ListChecks, FileText, ChevronDown, ChevronUp, Share2, Mic, MicOff } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import OntologySphere from './OntologySphere';
import ShareSheet from './ShareSheet';

type MessageCategory = 'standard' | 'urgent' | 'strategic';

interface MindMapNode {
  label: string;
  subNodes?: string[];
}

interface VisualData {
  type: 'analysis' | 'chart' | 'plan';
  title: string;
  conclusionCards: { label: string; value: string; trend: string; isGood: boolean }[];
  mindMap: MindMapNode[];
  detailedReport?: string;
}

interface Message {
  id: number;
  type: 'agent' | 'user';
  content: string;
  category?: MessageCategory;
  visual?: VisualData;
  isStreaming?: boolean;
  showReport?: boolean;
}

interface ThinkingStep {
  id: string;
  text: string;
  icon: any;
  status: 'pending' | 'active' | 'done';
}

const StrategicMindMap: React.FC<{ data: MindMapNode[] }> = ({ data }) => (
  <div className="space-y-3 mt-4">
    <div className="flex items-center gap-2 mb-2">
      <Network size={12} className="text-blue-400" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">战略决策链路建议</span>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {data.map((node, idx) => (
        <div key={idx} className="flex gap-3 relative group">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-black z-10"></div>
            {idx !== data.length - 1 && <div className="w-0.5 flex-1 bg-white/10 my-1"></div>}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-[13px] font-bold text-slate-100 mb-1">{node.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {node.subNodes?.map((sub, sIdx) => (
                <span key={sIdx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-400 font-mono">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatView: React.FC<{ initialContext?: string | null; onClearContext?: () => void }> = ({ initialContext, onClearContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sphereStatus, setSphereStatus] = useState<'idle' | 'thinking' | 'working'>('idle');
  const [shareConfig, setShareConfig] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: {} });
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([
    { id: '1', text: '理解用户意图', icon: Target, status: 'pending' },
    { id: '2', text: '检索知识库', icon: Database, status: 'pending' },
    { id: '3', text: '生成回答', icon: Brain, status: 'pending' },
    { id: '4', text: '完成', icon: CheckCircle2, status: 'pending' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 防止重复点击
  const [isConnecting, setIsConnecting] = useState(false);
  const baseTextRef = useRef(""); // 记录录音开始时的已有文本

  const hasInteracted = messages.length > 0 || isThinking;


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (initialContext) {
      handleSend(initialContext);
      onClearContext?.();
    }
  }, [initialContext]);

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
        stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    baseTextRef.current = inputValue; // 锁定当前文本

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // 初始化 WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/asr`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("ASR WebSocket Connected");
            setIsRecording(true);
            setIsConnecting(false); // 连接成功
            setSphereStatus('working'); // 让球体有反应
            processAudio(stream, ws);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.text) {
                 // 后端现在返回的是完整的 session_text (因为关闭了 wpgs 并进行了累积)
                 // 所以这里直接替换掉当前正在输入的部分
                 // baseTextRef.current 是录音开始前的文本
                 setInputValue(baseTextRef.current + data.text);
            }
            if (data.error) {
                console.error("ASR Error:", data.error);
                // 不要立即 stopRecording，允许重试或部分失败
            }
        };

        ws.onerror = (e) => {
            console.error("ASR WebSocket Error:", e);
            setIsConnecting(false);
            stopRecording();
        };
        
        ws.onclose = () => {
             console.log("ASR WebSocket Closed");
             setIsConnecting(false);
             stopRecording();
        };

    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("无法访问麦克风");
        setIsConnecting(false);
    }
  };

  const processAudio = (stream: MediaStream, ws: WebSocket) => {
      // 讯飞要求：16k采样率，16bit位深，单声道，PCM
      // Web Audio API 默认采样率通常是 44.1k 或 48k，需要重采样
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      // 使用 ScriptProcessorNode 进行处理 (虽然已废弃但兼容性好，AudioWorklet 更现代但复杂)
      // bufferSize 调整为 1024 (约64ms)，以提高实时性，实现"边说边显"
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioContext.destination); // 需要连接到 destination 才能触发 onaudioprocess
      
      processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          // 转换 Float32 到 Int16 PCM
          const pcmData = floatTo16BitPCM(inputData);
          ws.send(pcmData);
      };
  };

  const floatTo16BitPCM = (input: Float32Array) => {
      const output = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return output.buffer;
  };

  const stopRecording = () => {
      // 停止录音时，不立即关闭 WebSocket，而是先停止音频发送，并发送结束信号
      if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // 发送文本 "STOP" 作为结束信号
          wsRef.current.send("STOP");
          // 不需要 setTimeout，等待服务器关闭连接
          // 当服务器处理完所有数据后，会关闭连接，触发 ws.onclose -> 调用 stopRecording 清理 UI
      } else {
          wsRef.current = null;
      }
      
      setIsRecording(false);
      setSphereStatus('idle');
  };

  const toggleRecording = () => {
      if (isConnecting) return; // 正在连接中，忽略点击
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const handleSend = async (text?: string) => {
    const content = text || inputValue;
    if (!content.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content }]);
    setInputValue('');
    setIsThinking(true);
    setSphereStatus('thinking');

    const runSteps = async () => {
      for (let i = 0; i < thinkingSteps.length; i++) {
        setThinkingSteps(prev => prev.map((s, idx) => ({ 
          ...s, status: idx === i ? 'active' : (idx < i ? 'done' : 'pending') 
        })));
        await new Promise(r => setTimeout(r, 600));
      }
    };

    const callAi = async () => {
      try {
        console.log("Starting API call to /api/chat");
        // Use relative path to leverage Vite proxy
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: content }),
        });

        console.log("Response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           const text = await response.text();
           console.error("Received non-JSON response:", text);
           throw new Error(`Received non-JSON response: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);
        
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'agent',
          content: data.content,
          category: 'standard'
        }]);
      } catch (e: any) {
        console.error("Failed to fetch AI response:", e);
        // Optional: Add error message to chat
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'agent',
            content: `系统连接异常: ${e.message}`,
            category: 'standard'
        }]);
      }
    };

    await Promise.all([callAi(), runSteps()]);
    setIsThinking(false);
    setSphereStatus('idle');
  };

  const toggleReport = (id: number) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, showReport: !m.showReport } : m));
  };

  const handleOpenShare = (msg: Message) => {
    setShareConfig({
        isOpen: true,
        data: {
            title: `AI 战略报告: ${msg.visual?.title || '综合推演'}`,
            type: 'report',
            content: msg.visual?.detailedReport
        }
    });
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <ShareSheet 
        isOpen={shareConfig.isOpen} 
        onClose={() => setShareConfig({ ...shareConfig, isOpen: false })} 
        data={shareConfig.data} 
      />

      {/* 顶部思考 HUD */}
      <div className={`shrink-0 transition-all duration-700 relative z-30 border-b border-white/5 ${
        hasInteracted ? 'h-[100px] bg-black/40 backdrop-blur-3xl' : 'h-[240px]'
      }`}>
        <div className={`absolute transition-all duration-700 ${
            hasInteracted ? '-left-[55px] top-1/2 -translate-y-1/2 scale-[0.4]' : 'left-1/2 -translate-x-1/2 top-4 scale-100'
        }`}>
           <OntologySphere status={sphereStatus} />
        </div>

        <div className={`absolute transition-all duration-700 ${
            hasInteracted ? 'left-[100px] right-4 top-1/2 -translate-y-1/2' : 'left-0 right-0 bottom-8 flex flex-col items-center'
        }`}>
            {!hasInteracted ? (
                <div className="text-center animate-in fade-in duration-1000 px-6">
                    <div className="flex items-center justify-center gap-2 mb-2 text-slate-500 font-mono text-[9px] uppercase tracking-[0.4em]">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse glow-blue"></div>
                       AI_ADVISOR_ONLINE
                    </div>
                    <h1 className="text-2xl font-bold text-white leading-tight">
                        董事长，<br />水华精灵已就绪，请下达指令。
                    </h1>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-left-4 duration-700">
                    {thinkingSteps.map(step => (
                        <div key={step.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
                            step.status === 'active' ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/10' : 
                            step.status === 'done' ? 'border-transparent opacity-40' : 'border-transparent opacity-10'
                        }`}>
                            <step.icon size={12} className={step.status === 'active' ? 'text-blue-400 animate-pulse' : 'text-slate-500'} />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{step.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 对话流 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-40 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col mb-8 ${msg.type === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
            {msg.type === 'user' && (
              <div className="max-w-[85%] px-5 py-3.5 bg-blue-600 text-white rounded-[1.8rem] rounded-tr-none text-[14px] shadow-xl shadow-blue-900/20">
                {msg.content}
              </div>
            )}

            {msg.type === 'agent' && (
              <div className="w-full space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg glow-blue">
                    <Brain size={16} className="text-white" />
                  </div>
                  <div className="flex-1 p-4 glass-card rounded-[1.8rem] rounded-tl-none text-[14px] leading-relaxed text-slate-200 relative group">
                    {msg.content}
                  </div>
                </div>

                {msg.visual && (
                  <div className="w-full glass-card rounded-[2.5rem] border-white/10 bg-black/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={14} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.visual.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleOpenShare(msg)}
                            className="p-1.5 text-slate-500 hover:text-blue-400 active:scale-90 transition-all"
                        >
                            <Share2 size={14} />
                        </button>
                        <Zap size={14} className="text-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {msg.visual.conclusionCards.map((card, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{card.label}</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-mono-prec font-bold text-white tracking-tighter">{card.value}</span>
                              <span className={`text-[9px] font-bold ${card.isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                                {card.trend}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <StrategicMindMap data={msg.visual.mindMap} />

                      <div className="mt-6 flex flex-col gap-2">
                        {msg.visual.detailedReport && (
                          <button 
                            onClick={() => toggleReport(msg.id)}
                            className="w-full py-4 glass-card border-white/10 rounded-2xl text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/10"
                          >
                            {msg.showReport ? <><ChevronUp size={14} /> 收起论证逻辑</> : <><FileText size={14} /> 查看深度背景与建议建议报告</>}
                          </button>
                        )}
                      </div>

                      {msg.showReport && msg.visual.detailedReport && (
                        <div className="mt-4 p-5 bg-white/5 rounded-2xl border border-white/5 text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap animate-in slide-in-from-top-2 duration-300 font-light">
                          {msg.visual.detailedReport}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 backdrop-blur-md flex items-center gap-3">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-slate-400 font-mono animate-pulse">
                    AI正在思考...
                </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="fixed bottom-[94px] left-0 right-0 px-5 z-40">
        <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-blue-900/20 blur-[25px] rounded-[2rem] -z-10 group-focus-within:bg-blue-800/30 transition-all"></div>
            <div className={`relative glass-card bg-black/60 backdrop-blur-3xl rounded-[2rem] border-white/10 p-1 flex items-center shadow-2xl transition-all ${isRecording ? 'border-red-500/30 shadow-red-900/20' : ''}`}>
                <div className="px-4 text-slate-500">
                    <Brain size={18} className={isThinking ? 'animate-pulse text-blue-400' : ''} />
                </div>
                <input 
                    type="text" 
                    value={inputValue}
                    disabled={isThinking}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isThinking ? "水华思维星环推演中..." : isRecording ? "正在聆听..." : "输入您的战略指令..."}
                    className="flex-1 bg-transparent border-none focus:outline-none py-4 text-[14px] text-white placeholder:text-slate-600 font-light"
                />
                <div className="flex items-center gap-1">
                    <button 
                        onClick={toggleRecording}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isRecording 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isRecording ? "停止录音" : "开始语音输入"}
                    >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button 
                        onClick={() => handleSend()}
                        disabled={isThinking || !inputValue.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all ${
                        isThinking || !inputValue.trim() ? 'bg-white/5 text-slate-700' : 'bg-blue-600 shadow-lg glow-blue'
                        }`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
