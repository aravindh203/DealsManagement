import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { sharePointService } from '../../services/sharePointService';
import { getAccessTokenByApp } from '../../hooks/useClientCredentialsAuth';
import { appConfig } from '../../config/appConfig';
import { AiChatBot } from '../../services/AiChatBot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isSuggestion?: boolean;
}



const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [projectData, setProjectData] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  useEffect(() => {
    let isMounted = true;
    const fetchContainerData = async () => {
      try {
        const token = await getAccessTokenByApp();
        if (!token) return;
        
        const containerId = appConfig.ContainerID;
        const rootFolders = await sharePointService.fetchRootFolders(token, containerId);
        
        // Recursive function to fetch child files and folders
        const buildFolderTree = async (folderId: string): Promise<any[]> => {
          try {
            const children = await sharePointService.listFiles(token, containerId, folderId);
            const tree = await Promise.all(
              children.map(async (child) => {
                if (child.isFolder) {
                  return {
                    ...child,
                    children: await buildFolderTree(child.id)
                  };
                }
                return child;
              })
            );
            return tree;
          } catch (err) {
            console.error(`Error fetching children for folder ${folderId}:`, err);
            return [];
          }
        };

        const combinedData = await Promise.all(
          (rootFolders ?? []).map(async (folder: any) => {
            const metaData = await sharePointService.fetchCustomDatas(token, containerId, folder.id);
            const childTree = await buildFolderTree(folder.id);
            return {
              folder,
              metaData,
              children: childTree
            };
          })
        );
        
        if (isMounted) {
          setProjectData(combinedData);
          console.log("ChatBot loaded complete container tree:", combinedData);
        }
      } catch (error) {
        console.error("Error fetching complete container tree for ChatBot:", error);
      }
    };

    fetchContainerData();
    return () => { isMounted = false; };
  }, []);

  const handleSendMessage = async () => {
    const text = currentMessage.trim();
    if (!text) return;

    // Add user message to UI
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Formulate minimalist query data (sending all raw stringified folders may exceed tokens)
      // Since AiChatBot handles JSON stringification we pass projectData
      const response = await AiChatBot(projectData, text);
      
      let botResponseContent = response.answer || response.suggestion;
      if (typeof botResponseContent === 'object') {
        botResponseContent = JSON.stringify(botResponseContent, null, 2);
      } else if (!botResponseContent) {
        botResponseContent = "I'm sorry, I couldn't process your request.";
      }

      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: String(botResponseContent),
        isSuggestion: !response.answer && !!response.suggestion
      };
      
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error("AI ChatBot Error:", error);
      setMessages((prev) => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', content: "An error occurred while connecting to the AI service. Please try again later." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100">
          {/* Header */}
          <div className="bg-[#8b5cf6] p-4 flex items-center justify-between text-white drop-shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] leading-tight drop-shadow-sm">AI Assistant</span>
                <span className="text-[11px] text-white/80 font-medium">Always active</span>
              </div>
            </div>
            <button 
              onClick={toggleChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#f8fafc] flex flex-col gap-4">
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#8b5cf6] border-[#7c3aed]' : 'bg-white border-gray-200'}`}>
                  {msg.role === 'user' 
                    ? <User className="w-4 h-4 text-white" /> 
                    : <Bot className="w-4 h-4 text-[#8b5cf6]" />
                  }
                </div>
                <div className={`text-[14px] p-3.5 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#8b5cf6] text-white rounded-br-sm' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-[#8b5cf6]" />
                </div>
                <div className="bg-white border border-gray-100 text-gray-500 text-[14px] px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8b5cf6]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-[#f1f5f9] p-1.5 rounded-xl border border-gray-200/60 focus-within:border-[#8b5cf6] focus-within:ring-1 focus-within:ring-[#8b5cf6]/20 transition-all">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none outline-none px-3 text-[14px] text-gray-700 placeholder-gray-400"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     handleSendMessage();
                   }
                }}
              />
              <button 
                className="w-9 h-9 bg-[#a78bfa] hover:bg-[#8b5cf6] flex items-center justify-center rounded-lg shadow-sm transition-colors shrink-0 disabled:opacity-50"
                onClick={handleSendMessage}
                disabled={isTyping}
              >
                <Send className="w-4 h-4 text-white -ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-[#8b5cf6] hover:bg-[#7c3aed] hover:scale-105 active:scale-95 transition-all duration-300 rounded-full flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(139,92,246,0.6)]"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default ChatBot;
