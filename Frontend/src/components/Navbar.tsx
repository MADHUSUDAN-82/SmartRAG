import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, Key, Settings, Trash2, Plus, Sparkles, 
  HelpCircle, Server, Check, X, FileText 
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  useSimulation: boolean;
  setUseSimulation: (val: boolean) => void;
  apiUrl: string;
  setApiUrl: (val: string) => void;
  uploadedFileName?: string;
  onClearChat: () => void;
  onNewChat: () => void;
}

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
  useSimulation,
  setUseSimulation,
  apiUrl,
  setApiUrl,
  uploadedFileName,
  onClearChat,
  onNewChat,
}: NavbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setApiUrl(tempUrl);
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Left Section: Menu trigger and App title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#111111] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-tr from-orange-500 to-amber-200 flex items-center justify-center font-bold text-black text-[11px]">
              PDF
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-350 leading-none">
                AI Intelligence
              </span>
              <span className="font-serif italic text-xs text-zinc-400 mt-1 leading-none">
                Editorial v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Active Document Badge (highly elegant serif matching design html) */}
        {uploadedFileName && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden max-w-xs items-center gap-2.5 px-3 py-1 text-zinc-300 md:flex lg:max-w-md"
          >
            <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            <span className="truncate text-sm font-serif italic text-white font-medium">
              {uploadedFileName}
            </span>
            <span className="bg-zinc-800 text-[9px] px-2 py-0.5 rounded text-zinc-400 font-mono tracking-widest uppercase">
              Extracted
            </span>
          </motion.div>
        )}

        {/* Right Section: Configuration and controls */}
        <div className="flex items-center gap-2">
          
          {/* Status Indicators */}
          <button
            onClick={() => {
              setUseSimulation(!useSimulation);
            }}
            className={`hidden items-center gap-1.5 rounded bg-zinc-900 border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-all sm:flex ${
              useSimulation 
                ? 'text-amber-400 border-amber-500/20 bg-amber-950/20 hover:bg-amber-950/30' 
                : 'text-orange-450 text-orange-450 border-orange-500/20 bg-orange-950/20 hover:bg-orange-950/30 text-orange-400'
            }`}
            title="Click to toggle simulation mode"
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${useSimulation ? 'bg-amber-400' : 'bg-orange-400'}`} />
            {useSimulation ? 'Demo' : 'Real API'}
          </button>

          {/* Quick Clear Button */}
          <button
            onClick={onClearChat}
            className="flex h-8 items-center gap-1 my-auto rounded border border-white/10 px-2.5 text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Clear Chat Messages"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex h-8 items-center gap-1 my-auto rounded bg-white px-3 text-[10px] font-bold tracking-widest uppercase text-black hover:bg-zinc-200 transition-colors"
            title="New Chat Session"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
              showSettings 
                ? 'border-orange-500 bg-orange-950/10 text-orange-400' 
                : 'border-white/10 bg-[#111] text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
            title="Server Connection Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

        </div>
      </div>

      {/* Settings Panel Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-[#0c0c0c] backdrop-blur-md"
          >
            <div className="mx-auto max-w-4xl px-4 py-5 sm:px-8">
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-orange-400" />
                      API Environment Configuration
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Configure your local server endpoint or run sandbox simulations offline.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">Local Demo Mode:</span>
                    <button
                      type="button"
                      onClick={() => setUseSimulation(!useSimulation)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        useSimulation ? 'bg-orange-500' : 'bg-[#1a1a1a]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          useSimulation ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {!useSimulation && (
                  <div className="grid gap-2">
                    <label htmlFor="api-url-input" className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                      Backend Gateway URL
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="api-url-input"
                          type="url"
                          required
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          placeholder="http://localhost:8000"
                          className="w-full rounded border border-white/10 bg-[#111] px-3 py-1.5 text-xs text-neutral-200 placeholder:text-zinc-650 focus:border-orange-500/50 focus:outline-none placeholder:text-zinc-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex h-8 items-center gap-1.5 my-auto rounded bg-white px-3.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                      <Key className="h-3 w-3" />
                      Local standard preview runs via port 3000. Real-time updates remain sandbox restricted.
                    </span>
                  </div>
                )}

                {useSimulation && (
                  <div className="rounded border border-amber-500/10 bg-amber-950/10 p-4 text-[11px] text-amber-200/80 leading-relaxed font-sans">
                    <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400 mb-1">
                      <HelpCircle className="h-4 w-4" />
                      About Sandboxed Demo Mode
                    </p>
                    Because standard preview environments lack local server instances by default, we build in interactive offline-first response mapping. You can upload any simulated structure and chat smoothly. Disable to pipe queries directly to your real <code>localhost:8000</code> stack.
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
