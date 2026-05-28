import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, CheckCircle2, Sparkles, X,
  HelpCircle, MessageSquare, Plus, FileText
} from 'lucide-react';
import { ChatSession, Message } from '../types';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import { sendChatMessage } from '../services/api';

// Toast Notification type
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Home() {
  // State initialization with localStorage fallback
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ai-pdf-chat-sessions_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('ai-pdf-active-session-id_v2');
    return saved || '';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [useSimulation, setUseSimulation] = useState<boolean>(() => {
    const saved = localStorage.getItem('ai-pdf-use-simulation');
    return saved !== 'false'; // Default to true for sandbox previews
  });

  const [apiUrl, setApiUrl] = useState<string>(() => {
    const saved = localStorage.getItem('ai-pdf-api-url');
    return saved || 'https://smartrag-orpc.onrender.com';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Find currently active session
  const activeSession = chatSessions.find(s => s.id === activeSessionId);

  // Quick persistent sync hooks
  useEffect(() => {
    localStorage.setItem('ai-pdf-chat-sessions_v2', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem('ai-pdf-active-session-id_v2', activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem('ai-pdf-use-simulation', String(useSimulation));
  }, [useSimulation]);

  useEffect(() => {
    localStorage.setItem('ai-pdf-api-url', apiUrl);
  }, [apiUrl]);

  // Create an initial empty session if none exists
  useEffect(() => {
    if (chatSessions.length === 0) {
      handleNewChat();
    } else if (!activeSessionId) {
      setActiveSessionId(chatSessions[0].id);
    }
  }, [chatSessions, activeSessionId]);

  // Toast System Actions
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Session Actions
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Session ${chatSessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      isDisabled: false,
    };

    // Disable all previous sessions
    const updatedSessions = chatSessions.map(session => ({
      ...session,
      isDisabled: true,
    }));

    setChatSessions([newSession, ...updatedSessions]);

    setActiveSessionId(newSession.id);

    addToast('info', 'New chat session initialized. Upload a PDF to begin.');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = chatSessions.filter(s => s.id !== id);
    setChatSessions(filtered);
    addToast('info', 'Session deleted.');

    if (activeSessionId === id) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        setActiveSessionId('');
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  // Upload Actions
  const handleUploadSuccess = (fileName: string) => {
    if (!activeSessionId) return;

    if (fileName === '') {
      // signifies file removal/reset
      setChatSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, uploadedFileName: undefined, messages: [] };
        }
        return s;
      }));
      addToast('info', 'Document removed.');
      return;
    }

    setChatSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Automatically append welcome greeting from the AI after parsing
        const welcomeMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'ai',
          text: `Hi there! I have successfully parsed and processed **${fileName}**.\n\nAsk me queries regarding its content, tables, specific guidelines, or budgets, and I will outline them directly.`,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        };

        // Create elegant dynamic title based on file name
        const cleanTitle = fileName.replace(/\.[^/.]+$/, ""); // strip extension
        const truncTitle = cleanTitle.length > 25 ? `${cleanTitle.substring(0, 25)}...` : cleanTitle;

        return {
          ...s,
          uploadedFileName: fileName,
          title: truncTitle,
          messages: [welcomeMessage],
        };
      }
      return s;
    }));

    addToast('success', 'PDF compiled and analyzed. Knowledge base ready!');
  };

  const handleUploadError = (message: string) => {
    addToast('error', message);
  };

  const handleClearChat = () => {
    if (!activeSessionId) return;
    setChatSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [] };
      }
      return s;
    }));
    addToast('info', 'Messages cleared. File context remains active.');
  };

  // Message Actions
  const handleSendMessage = async (text: string) => {
    if (!activeSessionId || !activeSession || !activeSession.uploadedFileName || activeSession.isDisabled) return;

    // 1. Append user message to state
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setChatSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      // 2. Query connection provider
      const fullResponse = await sendChatMessage(text, apiUrl, useSimulation);
      setIsLoading(false);

      // 3. Initiate client-side token streamer
      const aiMessageId = Math.random().toString(36).substring(2, 9);
      const initialAiMsg: Message = {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      // Append blank AI message waiting to stream
      setChatSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, initialAiMsg] };
        }
        return s;
      }));

      // Stream splitting by space chunk (Word based streaming)
      const words = fullResponse.split(' ');
      let currentText = '';
      let wordIndex = 0;

      const incrementStream = setInterval(() => {
        if (wordIndex < words.length) {
          currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];

          setChatSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const updatedMsgs = s.messages.map(m => {
                if (m.id === aiMessageId) {
                  return { ...m, text: currentText };
                }
                return m;
              });
              return { ...s, messages: updatedMsgs };
            }
            return s;
          }));

          wordIndex++;
        } else {
          clearInterval(incrementStream);
          // Terminate streaming pulse cursor
          setChatSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const updatedMsgs = s.messages.map(m => {
                if (m.id === aiMessageId) {
                  return { ...m, isStreaming: false };
                }
                return m;
              });
              return { ...s, messages: updatedMsgs };
            }
            return s;
          }));
        }
      }, 35); // Fast, pleasing pace

    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      let errMsg = 'Failed to generate response. Check server connection.';
      if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      } else if (err.message) {
        errMsg = err.message;
      }
      addToast('error', errMsg);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] font-sans text-neutral-200 antialiased selection:bg-orange-500/25 select-none md:select-text">

      {/* Toast Overlay layer */}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full select-all">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 rounded border p-4 shadow-lg backdrop-blur-md ${toast.type === 'success'
                ? 'border-orange-500/20 bg-[#0c0c0c]/90 text-zinc-200'
                : toast.type === 'error'
                  ? 'border-red-500/20 bg-red-950/20 text-red-200'
                  : 'border-white/10 bg-[#0c0c0c] text-zinc-200'
                }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                ) : toast.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-450 text-red-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-orange-400" />
                )}
              </div>
              <div className="flex-1 text-xs font-semibold leading-relaxed tracking-wide font-sans">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded p-0.5 text-zinc-500 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar navigation */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        useSimulation={useSimulation}
        setUseSimulation={setUseSimulation}
      />

      {/* App Workspace container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Top Header menu */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          useSimulation={useSimulation}
          setUseSimulation={setUseSimulation}
          apiUrl={apiUrl}
          setApiUrl={setApiUrl}
          uploadedFileName={activeSession?.uploadedFileName}
          onClearChat={handleClearChat}
          onNewChat={handleNewChat}
        />

        {/* Central Chat Board */}
        <ChatWindow
          messages={activeSession ? activeSession.messages : []}
          uploadedFileName={activeSession?.uploadedFileName}
          isLoading={isLoading}
          useSimulation={useSimulation}
          apiUrl={apiUrl}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {/* Floating keyboard inputs */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={
            !activeSession?.uploadedFileName ||
            activeSession?.isDisabled
          }
          isLoading={isLoading}
          placeholderText={
            activeSession?.isDisabled
              ? 'This chat session has been locked.'
              : activeSession?.uploadedFileName
                ? `Ask a question about ${activeSession.uploadedFileName}...`
                : 'Please upload a PDF document before chatting.'
          }
        />

      </div>
    </div>
  );
}
