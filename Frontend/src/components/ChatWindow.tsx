import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, FileText, Upload, ArrowUpRight, MessageSquare, 
  Cpu, Zap, Lock, RefreshCw 
} from 'lucide-react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingAnimation from './TypingAnimation';
import UploadBox from './UploadBox';

interface ChatWindowProps {
  messages: Message[];
  uploadedFileName?: string;
  isLoading: boolean;
  useSimulation: boolean;
  apiUrl: string;
  onUploadSuccess: (fileName: string) => void;
  onUploadError: (msg: string) => void;
}

export default function ChatWindow({
  messages,
  uploadedFileName,
  isLoading,
  useSimulation,
  apiUrl,
  onUploadSuccess,
  onUploadError,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#050505]">
      
      {/* Scrollable messages container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent select-none md:select-text"
      >
        <AnimatePresence mode="wait">
          
          {/* STATE 1: If there is no uploaded file, show the Upload Portal */}
          {!uploadedFileName ? (
            <motion.div
              key="upload-portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-full flex-col items-center justify-center p-6 md:p-8 text-center max-w-4xl mx-auto space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-500 to-amber-200 text-black p-[1px]"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#050505]">
                    <FileText className="h-6 w-6 text-orange-450 text-orange-400" />
                  </div>
                </motion.div>
                
                <h1 className="text-xl md:text-2xl font-medium tracking-tight text-white font-serif">
                  Document Intelligence Hub
                </h1>
                
                <p className="max-w-md mx-auto text-xs md:text-sm text-zinc-400 leading-relaxed font-serif italic">
                  Upload financial reports, research documents, schemas, or legal statements to extract intelligence with an interactive aesthetic streaming experience.
                </p>
              </div>

              {/* Upload Drop Container */}
              <UploadBox
                onUploadSuccess={onUploadSuccess}
                onUploadError={onUploadError}
                useSimulation={useSimulation}
                apiUrl={apiUrl}
                currentFileName={uploadedFileName}
              />

              {/* Pro Feature Grid highlights */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full border-t border-white/5 pt-8 mt-4">
                
                <div className="rounded border border-white/5 bg-[#0c0c0c]/40 p-5 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500/10 text-orange-400 mb-3 border border-orange-500/10">
                    <Cpu className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">
                    PARSING ENGINE
                  </h4>
                  <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed font-serif">
                    Decoupled Node Parsing accurately mapping tabular statistics, text and schemas.
                  </p>
                </div>

                <div className="rounded border border-white/5 bg-[#0c0c0c]/40 p-5 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/10">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">
                    TOKEN STREAMING
                  </h4>
                  <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed font-serif">
                    Real-time incremental intelligence for rapid scanning and outline construction.
                  </p>
                </div>

                <div className="rounded border border-white/5 bg-[#0c0c0c]/40 p-5 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/10">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">
                    SECURED WORKSPACE
                  </h4>
                  <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed font-serif">
                    Fully localized sandbox or secure encrypted routing directly on your systems.
                  </p>
                </div>

              </div>
            </motion.div>
          ) : (
            
            /* STATE 2: File is uploaded. Show Chat interface. */
            <div className="w-full flex flex-col justify-start">
              
              {/* If message list is empty, show welcoming dashboard headers */}
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto w-full max-w-2xl px-4 py-12 md:py-24 text-center space-y-4"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-orange-950/20 text-orange-450 border border-orange-500/20">
                    <CheckCircle2Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono uppercase tracking-widest">
                      Document Processing Complete
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed font-serif">
                      Knowledge extracted from <code className="text-[11px] text-orange-400 bg-orange-500/5 px-1.5 py-0.5 border border-orange-500/20 rounded select-all truncate">{uploadedFileName}</code>. 
                      Ask queries regarding outline elements, budgets, guides, or specifications below.
                    </p>
                  </div>
                  
                  {/* Starter Prompts suggest list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
                    <div className="rounded border border-white/5 bg-[#0c0c0c]/40 p-4 hover:border-orange-500/30 cursor-pointer transition-all flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-mono mb-1">Outline</span>
                      <p className="text-xs text-zinc-300 font-serif italic">"Provide a high-level summary of the primary highlights."</p>
                    </div>
                    <div className="rounded border border-white/5 bg-[#0c0c0c]/40 p-4 hover:border-orange-500/30 cursor-pointer transition-all flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-mono mb-1">Financials</span>
                      <p className="text-xs text-zinc-300 font-serif italic">"Map out the budget allocations or key KPIs listed."</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                
                /* List of Chat messages */
                <div className="w-full py-4">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {/* Waiting loading state typing view */}
              {isLoading && (
                <div className="flex w-full gap-5 py-6 px-4 md:px-8 bg-[#080808]/50 max-w-4xl mx-auto items-start">
                  <div className="shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-500 to-amber-200 text-black">
                      <span className="font-bold text-[11px]">AI</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      AI Engine
                    </span>
                    <TypingAnimation />
                  </div>
                </div>
              )}

            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub helper component icon to avoid import issues
function CheckCircle2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
