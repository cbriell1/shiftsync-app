// filepath: app/components/StadiumAssistant.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function StadiumAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'WELCOME TO THE STADIUM. 🏟️ How can I help you with Pickles & Play pricing or policies today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else if (data.error) {
         setMessages(prev => [...prev, { role: 'assistant', content: `**ERROR:** ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "ERROR: Communication with the Stadium lost. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-slate-900 text-yellow-400 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[9999] border-4 border-yellow-400 animate-bounce"
      >
        <Bot size={32} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-80 md:w-[450px] bg-white border-4 border-slate-900 rounded-[32px] shadow-2xl flex flex-col z-[9999] transition-all overflow-hidden ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
      
      {/* HEADER */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white border-b-4 border-yellow-400 shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-yellow-400 text-slate-900 p-1.5 rounded-lg shadow-lg">
              <Sparkles size={18} className="animate-pulse" />
           </div>
           <div>
              <h3 className="font-black uppercase text-xs tracking-widest sports-slant leading-none">Stadium</h3>
              <p className="font-black text-yellow-400 uppercase text-[10px] tracking-tighter leading-none mt-0.5">Assistant</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
           </button>
           <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors text-red-400">
              <X size={18} />
           </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* MESSAGES */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-3xl text-[12px] leading-relaxed shadow-md border-2 transition-all ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none font-bold' 
                    : 'bg-white text-slate-900 border-slate-200 rounded-tl-none font-medium'
                }`}>
                  <div className="prose prose-sm max-w-none prose-slate">
                    <ReactMarkdown 
                      components={{
                        h3: ({node, ...props}) => <h3 className="text-[13px] font-black uppercase sports-slant text-blue-700 mt-3 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-blue-500 font-bold" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-black text-slate-900" {...props} />
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border-2 border-slate-200 p-4 rounded-3xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Analyzing Stadium Data...</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <form onSubmit={handleSend} className="p-4 border-t-4 border-slate-100 bg-white shrink-0 shadow-[0_-10px_25px_rgba(0,0,0,0.02)]">
             <div className="relative flex items-center">
                <input 
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="ASK THE STADIUM..."
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-4 text-[11px] font-black uppercase outline-none focus:border-blue-600 transition-all pr-14 shadow-inner placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2.5 bg-slate-900 text-yellow-400 rounded-xl hover:bg-black transition-all disabled:opacity-50 shadow-lg active:scale-95"
                >
                   <Send size={16} />
                </button>
             </div>
          </form>
        </>
      )}
    </div>
  );
}
