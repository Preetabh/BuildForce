import React, { useState } from 'react';
import { Bot, X, Sparkles, Send, BookOpen, Calculator, Layers, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; time: string }>>([
    {
      role: 'ai',
      text: 'Hello Engineer! I am your Civil Guru AI copilot. How can I help you with DSR/SOR clauses, measurement formulas, or rate analysis today?',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');

  const quickPrompts = [
    'How to calculate RCC M25 cement bags?',
    'Find Earthwork excavation clause in CPWD SOR',
    'Standard unit for Plastering 12mm',
    'Explain L × W × D formula for Earthwork',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      role: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      let reply = 'Here is what you need: ';
      const lower = text.toLowerCase();

      if (lower.includes('cement') || lower.includes('m25') || lower.includes('rcc')) {
        reply = 'For RCC 1:1:2 (M25 nominal mix) per 1 CUM of concrete:\n• Cement: 8.4 Bags (420 kg)\n• Sand / Fine Aggregate: 0.42 CUM\n• Coarse Aggregate (20mm/10mm): 0.84 CUM\n• Water: ~180 Litres.';
      } else if (lower.includes('earthwork') || lower.includes('soil') || lower.includes('excavation')) {
        reply = 'In CPWD SOR 2023:\n• Item 2.1.1: Earth work in surface excavation upto 30 cm depth in all kinds of soil (Unit: SQM, Rate: ₹129.85/SQM).\n• Item 2.2.1: Earth work in excavation over areas exceeding 30 cm in depth (Unit: CUM, Rate: ₹395.30/CUM).';
      } else if (lower.includes('plaster') || lower.includes('12mm')) {
        reply = 'Cement Plaster 12mm (1:6) standard is measured in SQM. Dry mortar requirement is approx 0.018 CUM per 1 SQM of 12mm plaster with ~15-20% wastage allowance.';
      } else if (lower.includes('formula') || lower.includes('lxwxd') || lower.includes('volume')) {
        reply = 'Volumetric items (Earthwork excavation, RCC, Masonry) use Length × Width × Depth (L × W × D) to produce cubic quantity (CUM / m³). Surface items (Plastering, Painting, Flooring) use Length × Width (L × W) to produce square area (SQM / m²).';
      } else {
        reply = `I have analyzed "${text}". You can search matching clauses directly in Smart Measurement Entry or navigate to Rate Master to check verified CPWD / State SOR rate items.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <>
      {/* Floating Pink Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Civil Guru AI Copilot"
          className={cn(
            'w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-pink-600 via-rose-500 to-fuchsia-500 text-white shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none ring-4 ring-pink-500/20 hover:ring-pink-500/40',
            isOpen && 'rotate-90 ring-pink-500/50 shadow-pink-500/30'
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6 animate-pulse" />}
        </button>
      </div>

      {/* AI Copilot Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-[92vw] sm:w-[420px] max-h-[600px] h-[540px] bg-[#0E1320] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-pink-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Civil Guru AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                    COPILOT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Construction Engineering & DSR/SOR Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0B0F17]/70 text-xs sm:text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-line shadow-sm',
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  )}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Quick prompt suggestions */}
          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="shrink-0 text-[11px] bg-slate-800 hover:bg-slate-700 hover:text-pink-300 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask formula, DSR code, rate analysis..."
              className="flex-1 bg-slate-800/80 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
