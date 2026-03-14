import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
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

interface ChatBotProps {
  onCreateProjectClick?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onCreateProjectClick }) => {
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

        // const containerId = appConfig.ContainerID;
        // const rootFolders = await sharePointService.fetchRootFolders(token, containerId);

        // // Recursive function to fetch child files and folders
        // const buildFolderTree = async (folderId: string): Promise<any[]> => {
        //   try {
        //     const children = await sharePointService.listFiles(token, containerId, folderId);
        //     const tree = await Promise.all(
        //       children.map(async (child) => {
        //         if (child.isFolder) {
        //           return {
        //             ...child,
        //             children: await buildFolderTree(child.id)
        //           };
        //         }
        //         return child;
        //       })
        //     );
        //     return tree;
        //   } catch (err) {
        //     console.error(`Error fetching children for folder ${folderId}:`, err);
        //     return [];
        //   }
        // };

        // const combinedData = await Promise.all(
        //   (rootFolders ?? []).map(async (folder: any) => {
        //     const metaData = await sharePointService.fetchCustomDatas(token, containerId, folder.id);
        //     const childTree = await buildFolderTree(folder.id);
        //     return {
        //       folder,
        //       metaData,
        //       children: childTree
        //     };
        //   })
        // );

        // const containerId = appConfig.ContainerID;

        // const rootFolders = await sharePointService.fetchRootFolders(token, containerId);

        // // Recursive function to fetch subfolders and files
        // const buildFolderTree = async (folderId: string): Promise<any[]> => {
        //   try {
        //     const children = await sharePointService.listFiles(token, containerId, folderId);

        //     if (!children || children.length === 0) {
        //       return [];
        //     }

        //     const tree = await Promise.all(
        //       children.map(async (child: any) => {

        //         const isFolder = !!child.folder;

        //         if (isFolder) {
        //           return {
        //             id: child.id,
        //             name: child.name,
        //             type: "folder",
        //             children: await buildFolderTree(child.id)
        //           };
        //         }

        //         return {
        //           id: child.id,
        //           name: child.name,
        //           type: "file"
        //         };
        //       })
        //     );

        //     return tree;

        //   } catch (err) {
        //     console.error(`Error fetching children for folder ${folderId}:`, err);
        //     return [];
        //   }
        // };


        // // Combine project folder + metadata + child tree
        // const combinedData = await Promise.all(
        //   (rootFolders ?? []).map(async (folder: any) => {

        //     const metaData = await sharePointService.fetchCustomDatas(
        //       token,
        //       containerId,
        //       folder.id
        //     );

        //     const childTree = await buildFolderTree(folder.id);

        //     return {
        //       id: folder.id,
        //       name: folder.name,
        //       metaData: metaData ?? {},
        //       children: childTree
        //     };

        //   })
        // );


        const containerId = appConfig.ContainerID;

        const rootFolders = await sharePointService.fetchRootFolders(token, containerId);

        // Recursive function to fetch folder tree + metadata
        const buildFolderTree = async (folderId: string): Promise<any[]> => {
          try {

            const children = await sharePointService.listFiles(token, containerId, folderId);

            if (!children || children.length === 0) {
              return [];
            }

            const tree = await Promise.all(
              children.map(async (child: any) => {

                const isFolder = !!child.folder;

                if (isFolder) {

                  // 🔹 fetch metadata for each child folder
                  const childMetaData = await sharePointService.fetchCustomDatas(
                    token,
                    containerId,
                    child.id
                  );

                  return {
                    id: child.id,
                    name: child.name,
                    metaData: childMetaData ?? {},
                    children: await buildFolderTree(child.id)
                  };
                }

                return {
                  id: child.id,
                  name: child.name,
                  type: "file"
                };

              })
            );

            return tree;

          } catch (err) {
            console.error(`Error fetching children for folder ${folderId}:`, err);
            return [];
          }
        };


        // Root project folders
        const combinedData = await Promise.all(
          (rootFolders ?? []).map(async (folder: any) => {

            const metaData = await sharePointService.fetchCustomDatas(
              token,
              containerId,
              folder.id
            );

            const childTree = await buildFolderTree(folder.id);

            return {
              id: folder.id,
              name: folder.name,
              metaData: metaData ?? {},
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

      let botResponseContent: string = "";
      let isSuggestionNode = false;

      if (response && response.answer) {
        botResponseContent = typeof response.answer === 'object' ? JSON.stringify(response.answer, null, 2) : String(response.answer);
      } else if (response && response.suggestion) {
        botResponseContent = typeof response.suggestion === 'object' ? JSON.stringify(response.suggestion, null, 2) : String(response.suggestion);
        isSuggestionNode = true;
      } else {
        botResponseContent = "I'm sorry, I couldn't process your request.";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponseContent,
        isSuggestion: isSuggestionNode
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

  const toggleChat = () => {
    if (isOpen) {
      // Reset chat when closing
      setMessages([{ id: 'initial', role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }]);
    }
    setIsOpen(!isOpen);
  };

  const handleSuggestionClick = (type: 'create' | 'details') => {
    if (type === 'create') {
      if (onCreateProjectClick) {
        // Toggle chat state locally
        setIsOpen(false);
        // Also perform the reset logic
        setMessages([{ id: 'initial', role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }]);
        onCreateProjectClick();
      }
    } else if (type === 'details') {
      const botMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sure! Please tell me which project you are looking for, or ask your specific question about its details.'
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

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
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden bg-[#f8fafc] flex flex-col gap-4">

            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 w-fit max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#8b5cf6] border-[#7c3aed]' : 'bg-white border-gray-200'}`}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-[#8b5cf6]" />
                  }
                </div>
                <div className={`text-[14px] p-3.5 rounded-2xl shadow-sm whitespace-pre-wrap break-words ${msg.role === 'user'
                  ? 'bg-[#8b5cf6] text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                  }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-end gap-2 max-w-[85%] self-start">
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

          {/* Quick Suggestions - Sticky above input */}
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-[#f8fafc] border-t border-gray-100/50">
            {/* <button
              onClick={() => handleSuggestionClick('create')}
              className="text-[12px] bg-indigo-50 hover:bg-indigo-100 text-[#6d28d9] border border-indigo-200 px-3 py-1.5 rounded-full transition-colors font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 duration-200"
            >
              <Sparkles className="w-3 h-3" />
              Create a project
            </button> */}
            <button
              onClick={() => handleSuggestionClick('details')}
              className="text-[12px] bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full transition-colors font-semibold whitespace-nowrap shadow-sm hover:scale-105 active:scale-95 duration-200"
            >
              Project details
            </button>
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
        className="w-14 h-14 bg-white hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-300 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(88,28,135,0.35)] border border-slate-100"
        aria-label="Open DealBridge assistant"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="chatbot-bubble" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#a855f7" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="chatbot-star" x1="0" y1="20" x2="20" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f97316" />
              <stop offset="1" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Chat bubble */}
          <path
            d="M8.5 6C6.567 6 5 7.567 5 9.5v7C5 18.985 6.79 21 9 21h4.4l3.24 2.7c.98.82 2.36.11 2.36-1.1V21H23.5C25.433 21 27 19.433 27 17.5v-8C27 7.567 25.433 6 23.5 6h-15Z"
            fill="url(#chatbot-bubble)"
          />
          {/* Lines inside bubble */}
          <path
            d="M11 11.25c0-.414.336-.75.75-.75H19a.75.75 0 0 1 0 1.5h-7.25A.75.75 0 0 1 11 11.25Zm0 3c0-.414.336-.75.75-.75H17a.75.75 0 0 1 0 1.5h-5.25A.75.75 0 0 1 11 14.25Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Sparkle/star */}
          <path
            d="M21.75 7.5c.15-.39.71-.39.86 0l.64 1.65c.16.43.5.77.93.93l1.65.64c.39.15.39.71 0 .86l-1.65.64c-.43.16-.77.5-.93.93l-.64 1.65c-.15.39-.71.39-.86 0l-.64-1.65a1.5 1.5 0 0 0-.93-.93l-1.65-.64a.45.45 0 0 1 0-.86l1.65-.64c.43-.16.77-.5.93-.93l.64-1.65Z"
            fill="url(#chatbot-star)"
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatBot;
