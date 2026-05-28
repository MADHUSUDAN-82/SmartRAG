import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, FileWarning } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean | undefined;
  isLoading: boolean;
  placeholderText?: string;
}

export default function MessageInput({
  onSendMessage,
  disabled,
  isLoading,
  placeholderText,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    
    // Reset heights
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-8">
      <div className="relative">
        <div className={`relative flex items-end rounded-lg border transition-all shadow ${
          disabled 
            ? 'border-white/5 bg-[#0f0f0f] text-zinc-650 text-zinc-600' 
            : 'border-white/10 bg-[#111] focus-within:border-orange-500/40 focus-within:ring-1 focus-within:ring-orange-500/10 hover:border-white/20 backdrop-blur-md'
        }`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              placeholderText
            }
            className="w-full resize-none bg-transparent py-4 pr-14 pl-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed max-h-[200px] scrollbar-thin overflow-y-auto"
          />

          {/* Action icon */}
          <div className="absolute right-3 bottom-2.5">
            <motion.button
              whileHover={!disabled && text.trim() ? { scale: 1.02 } : {}}
              whileTap={!disabled && text.trim() ? { scale: 0.98 } : {}}
              onClick={handleSend}
              disabled={!text.trim() || disabled || isLoading}
              className={`flex h-8 w-8 items-center justify-center rounded transition-all cursor-pointer ${
                !text.trim() || disabled || isLoading
                  ? 'bg-zinc-800 text-zinc-505 bg-white/5 text-zinc-650 cursor-not-allowed text-zinc-500'
                  : 'bg-white text-black font-bold shadow hover:bg-zinc-200'
              }`}
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Input footer detail help labels */}
        <div className="mt-2.5 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono uppercase tracking-widest">
          {disabled ? (
            <span className="text-amber-500/80 flex items-center gap-1 font-sans font-light tracking-normal lowercase first-letter:uppercase italic">
              <FileWarning className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              Upload an intelligent node file (PDF) to initiate the workspace text engine.
            </span>
          ) : (
            <>
              <span>Enter to submit</span>
              <span className="text-zinc-700">•</span>
              <span>Shift + Enter for break</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
