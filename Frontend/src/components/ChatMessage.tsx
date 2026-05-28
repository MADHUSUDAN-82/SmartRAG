import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Sparkles, User, Copy, Check, FileText } from 'lucide-react';
import { useState } from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert ISO string/relative date back to clear display format
  const displayTime = (() => {
    try {
      const date = new Date(message.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(index * 0.05, 0.2) }}
      className={`flex w-full gap-4 py-6 px-4 md:px-8 border-b border-white/5 ${
        isAI ? 'bg-[#080808]/50' : 'bg-transparent'
      }`}
    >
      <div className="flex max-w-4xl mx-auto w-full gap-5 items-start">
        
        {/* Avatar badge */}
        <div className="shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg shadow ${
              isAI
                ? 'bg-gradient-to-tr from-orange-500 to-amber-200 text-black'
                : 'bg-zinc-800 text-zinc-300 border border-white/10'
            }`}
          >
            {isAI ? (
              <span className="font-bold text-[11px] text-black">AI</span>
            ) : (
              <User className="h-4 w-4 text-zinc-400" />
            )}
          </motion.div>
        </div>

        {/* Message body section */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
              {isAI ? 'AI Engine' : 'User Query'}
            </span>
            <div className="flex items-center gap-2">
              {displayTime && (
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                  {displayTime}
                </span>
              )}
              {isAI && (
                <button
                  onClick={handleCopy}
                  className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                  title="Copy Message"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-orange-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Markdown renderer content bubble */}
          <div className="text-zinc-200 text-sm md:text-base leading-relaxed break-words font-sans selection:bg-orange-500/20">
            {isAI ? (
              <div className="markdown-body relative font-serif text-[15px] text-zinc-300 tracking-wide">
                <Markdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-zinc-300 font-serif font-light">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-white font-sans text-xs uppercase tracking-wider bg-white/5 px-1 rounded">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-zinc-400 font-serif font-light">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-zinc-400 font-serif font-light">{children}</ol>,
                    li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
                    hr: () => <hr className="my-5 border-white/5" />,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l border-orange-500 pl-4 py-1.5 my-4 text-zinc-400 italic font-serif bg-white/5 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="rounded bg-zinc-900 border border-white/5 px-1.5 py-0.5 font-mono text-xs text-orange-300">
                          {children}
                        </code>
                      ) : (
                        <div className="relative my-4 rounded border border-white/10 bg-[#0c0c0c] overflow-hidden">
                          <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5 bg-[#111] font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                            <span>Code Block</span>
                          </div>
                          <pre className="overflow-x-auto p-4 font-mono text-xs text-zinc-300 leading-relaxed select-text">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }
                  }}
                >
                  {message.text}
                </Markdown>
                
                {/* Streaming custom cursor flashing block */}
                {message.isStreaming && (
                  <motion.span
                    className="inline-block h-3.5 w-1.5 ml-1 bg-orange-400 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            ) : (
              // Simple text for user, spacing preserved
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-[14.5px] font-sans">
                {message.text}
              </p>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
