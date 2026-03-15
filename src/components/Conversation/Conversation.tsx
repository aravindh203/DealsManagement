import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  Maximize2,
  Minimize2,
  Paperclip,
  Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isSuggestion?: boolean;
  timestamp?: Date;
}

export interface Suggestion {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface ConversationProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialMessages?: ChatMessage[];
  relationData?: any;
  onRefreshRelationData?: () => Promise<void>;
  onSendMessage: (message: string) => Promise<void>;
  suggestions?: Suggestion[];
  placeholder?: string;
  className?: string;
  botIcon?: React.ReactNode;
  userIcon?: React.ReactNode;
  accentColor?: string;
}

const Conversation: React.FC<ConversationProps> = ({
  isOpen,
  onClose,
  title = "AI Assistant",
  subtitle = "Always active",
  initialMessages = [],
  relationData,
  onRefreshRelationData,
  onSendMessage,
  suggestions = [],
  placeholder = "Type your message...",
  className,
  botIcon = <Bot className="w-4 h-4 text-white" />,
  userIcon = <User className="w-4 h-4 text-white" />,
  accentColor = "#8b5cf6"
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    const text = currentMessage.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      await onSendMessage(text);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: "An error occurred while processing your request. Please try again." 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRefresh = async () => {
    if (onRefreshRelationData && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefreshRelationData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed transition-all duration-300 ease-in-out z-50 flex flex-col bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden",
        isMaximized 
          ? "inset-4 rounded-2xl" 
          : "bottom-6 right-6 w-[400px] h-[600px] rounded-2xl md:w-[450px] md:h-[650px]",
        className
      )}
      style={{ boxShadow: `0 20px 50px -12px ${accentColor}33` }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-inner">
            {botIcon}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight tracking-tight">{title}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[11px] text-white/80 font-medium uppercase tracking-wider">{subtitle}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onRefreshRelationData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 transition-all rounded-lg"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh Data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20 transition-all rounded-lg"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20 transition-all rounded-lg"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="flex flex-col gap-6 min-h-full">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-12">
              <Bot className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">How can I help you today?</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex items-end gap-3 max-w-[85%] transition-all animate-in fade-in slide-in-from-bottom-2",
                msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
              )}
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  msg.role === 'user' ? "text-white" : "bg-white border-slate-200"
                )}
                style={{ 
                  backgroundColor: msg.role === 'user' ? accentColor : 'white',
                  borderColor: msg.role === 'user' ? accentColor : '' 
                }}
              >
                {msg.role === 'user' ? userIcon : botIcon}
              </div>
              <div 
                className={cn(
                  "p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "text-white rounded-br-sm bg-gradient-to-br" 
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                )}
                style={{ 
                  backgroundImage: msg.role === 'user' 
                    ? `linear-gradient(to bottom right, ${accentColor}, ${accentColor}ee)` 
                    : '' 
                }}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
                {msg.timestamp && (
                  <div className={cn(
                    "text-[10px] mt-1 opacity-60",
                    msg.role === 'user' ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-3 self-start animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                {botIcon}
              </div>
              <div className="bg-white border border-slate-100 text-slate-400 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: accentColor }} />
                <span className="text-xs font-medium">Assistant is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Relation Data Badge (Optional) */}
      {relationData && (
        <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex items-center gap-2">
          <div className="px-2 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
            Context
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">
            {typeof relationData === 'string' ? relationData : 'Relation data active'}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2 bg-slate-50/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
          {suggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={suggestion.onClick}
              className="h-8 rounded-full border-slate-200 bg-white text-xs font-semibold hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
            >
              {suggestion.icon || <Sparkles className="w-3 h-3" style={{ color: accentColor }} />}
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
        <div 
          className="flex items-end gap-2 bg-slate-100/80 p-2 rounded-xl border border-transparent focus-within:border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-300 shadow-inner"
        >
          <div className="flex flex-col flex-1">
             <textarea
                placeholder={placeholder}
                className="w-full max-h-32 bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-700 placeholder-slate-400 resize-none min-h-[40px]"
                rows={1}
                value={currentMessage}
                onChange={(e) => {
                  setCurrentMessage(e.target.value);
                  e.target.style.height = 'inherit';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex items-center gap-1 px-1 py-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-md">
                   <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-md">
                   <Smile className="w-4 h-4" />
                </Button>
              </div>
          </div>
         
          <Button
            className="h-10 w-10 shrink-0 text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${accentColor}40` }}
            onClick={handleSend}
            disabled={!currentMessage.trim() || isTyping}
            size="icon"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-slate-400 font-medium tracking-wide">
          Pro-tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default Conversation;

