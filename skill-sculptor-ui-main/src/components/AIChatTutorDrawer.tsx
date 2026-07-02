import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, Send, Sparkles, User, Bot, RefreshCw, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import API from '../../api/axios';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: Date;
}

interface AIChatTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapId: string;
  roadmapTitle: string;
  stepIdx: number;
  stepTitle: string;
}

const SUGGESTIONS = [
  "Explain this step simply",
  "Give me a practical code example",
  "What are the key concepts here?",
  "Test me with a quick question"
];

export function AIChatTutorDrawer({
  isOpen,
  onClose,
  roadmapId,
  roadmapTitle,
  stepIdx,
  stepTitle
}: AIChatTutorDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history or set initial welcome message per step
  useEffect(() => {
    if (isOpen) {
      const storageKey = `chat_history_${roadmapId}_${stepIdx}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } else {
        // Default warm welcome message
        const welcome: Message = {
          id: 'welcome',
          sender: 'tutor',
          text: `Hi there! I am your AI Study Tutor. 🌟\n\nI am ready to help you master **${stepTitle}** for your **${roadmapTitle}** course. Ask me to explain tricky parts, write code, or query concepts!`,
          timestamp: new Date()
        };
        setMessages([welcome]);
      }
    }
  }, [isOpen, roadmapId, stepIdx, stepTitle, roadmapTitle]);

  // Save chat history to localStorage
  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
    const storageKey = `chat_history_${roadmapId}_${stepIdx}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    const newHistory = [...messages, userMsg];
    saveMessages(newHistory);
    setInputValue('');
    setIsGenerating(true);

    try {
      // Map messages history to a clean lightweight payload
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await API.post('/chat-tutor', {
        chatHistory: historyPayload,
        message: textToSend,
        context: {
          roadmapTitle,
          stepTitle
        }
      });

      const tutorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: res.data.response || "I'm sorry, I couldn't process that response.",
        timestamp: new Date()
      };

      saveMessages([...newHistory, tutorMsg]);
    } catch (err) {
      console.error("AI tutor communication error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: "I apologize, but I had trouble connecting to my brain. Please check that your API key is correctly configured in your `.env` file and try again!",
        timestamp: new Date()
      };
      saveMessages([...newHistory, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    const welcome: Message = {
      id: 'welcome',
      sender: 'tutor',
      text: `Chat cleared! Let's start fresh. Ask me anything about **${stepTitle}**!`,
      timestamp: new Date()
    };
    saveMessages([welcome]);
  };

  // Render markdown-like structures simply
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold text formatting
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-bold">$1</code>');

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-xs font-black text-foreground mt-3 mb-1 uppercase tracking-wider">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-foreground/90 mt-1" dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
      }
      return <p key={idx} className="text-xs leading-relaxed text-foreground/90 min-h-[8px]" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Background Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-out Panel */}
      <div className={cn(
        "relative w-full sm:w-[460px] h-full bg-card border-l border-border/40 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-card/65 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/15 text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                AI Campaign Tutor
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate max-w-[260px]">{stepTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleClearChat}
              title="Clear Chat History"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <X className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/15 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                  isUser 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div className={cn(
                  "p-3 rounded-2xl text-xs space-y-1.5 shadow-sm border",
                  isUser 
                    ? "bg-primary text-white border-primary/10 rounded-tr-none" 
                    : "bg-card border-white/5 text-foreground rounded-tl-none"
                )}>
                  {isUser ? (
                    <p className="leading-relaxed">{msg.text}</p>
                  ) : (
                    renderMessageText(msg.text)
                  )}
                  <span className={cn(
                    "block text-[8px] text-right mt-1 opacity-60",
                    isUser ? "text-white" : "text-muted-foreground"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* AI Generating Loader */}
          {isGenerating && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 animate-spin">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-card border border-white/5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        <div className="p-3 border-t border-white/5 bg-card flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug)}
              className="text-[10px] bg-muted/60 hover:bg-primary/10 border border-border/40 hover:border-primary/20 text-muted-foreground hover:text-primary px-2.5 py-1 rounded-full transition-all duration-200 font-bold"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-card flex gap-2">
          <input
            type="text"
            placeholder="Ask your tutor anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputValue);
            }}
            className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
          <Button
            size="icon"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isGenerating}
            className="rounded-xl w-10 h-10 bg-primary hover:bg-primary-hover text-white shadow-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
