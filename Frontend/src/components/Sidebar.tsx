import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, MessageSquare, Trash2, Sparkles, FileText, 
  HelpCircle, ChevronLeft, Moon, Server, Settings, Check, HelpCircle as HelpIcon 
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatSessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  useSimulation: boolean;
  setUseSimulation: (val: boolean) => void;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  chatSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  useSimulation,
  setUseSimulation,
}: SidebarProps) {
  
  return (
    <>
      {/* Mobile sidebar overlay backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container */}
      <motion.aside
        id="sidebar-container"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0c0c0c] backdrop-blur-md transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={false}
      >
        {/* Top Header Section */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-orange-500 to-amber-200 flex items-center justify-center font-bold text-black text-xs">
              PDF
            </div>
            <span className="text-xs font-semibold tracking-wider text-white uppercase">
              Doc Intelligence
            </span>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            title="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Action button inside sidebar */}
        <div className="px-5 pt-5 pb-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              onNewChat();
              setSidebarOpen(false); // Close mobile drawer on selection
            }}
            className="w-full py-3 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
          >
            + New Session
          </motion.button>
        </div>

        {/* Dynamic Sessions list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1 mt-1">
            Recent Documents
          </p>
          
          {chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-600">
              <MessageSquare className="h-7 w-7 mb-2 stroke-[1.5]" />
              <span className="text-[11px] font-medium uppercase tracking-wide">No active documents</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {chatSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => {
                        onSelectSession(session.id);
                        setSidebarOpen(false); // Close mobile drawer on selection
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg p-3 text-left transition-all text-xs ${
                        isActive
                          ? 'bg-white/5 border border-white/10 text-white font-medium pl-3'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 pl-3 border border-transparent'
                      }`}
                    >
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0 group-hover:bg-zinc-500" />
                      )}
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="truncate font-serif leading-relaxed italic">
                          {session.title || 'Untitled Session'}
                        </p>
                        {session.uploadedFileName && (
                          <span className="text-[10px] text-zinc-500 block mt-0.5 truncate font-mono">
                            {session.uploadedFileName}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Delete session button */}
                    <button
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hidden h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-orange-400 group-hover:flex"
                      title="Delete Session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Sidebar Footer Details Container */}
        <div className="mt-auto border-t border-white/10 p-5 space-y-3 bg-[#080808]/40">
          
          {/* Quick status button in side layout */}
          <div className="rounded-lg border border-white/5 bg-[#111111]/70 p-3.5">
            <h4 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2 block">
              Neural Engine Connect
            </h4>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${useSimulation ? 'text-amber-400' : 'text-orange-400'}`}>
                {useSimulation ? 'Demo Engine' : 'Live Gateway'}
              </span>
              <button
                onClick={() => setUseSimulation(!useSimulation)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  useSimulation 
                    ? 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15' 
                    : 'border-orange-500/20 bg-orange-500/5 text-orange-400 hover:bg-orange-500/15'
                }`}
                title="Change Connection Provider"
              >
                Change
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              {useSimulation 
                ? 'Running offline simulation for instant document responses.' 
                : 'Routing direct API queries to your secure custom backend.'}
            </p>
          </div>

          <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-650 text-zinc-500 uppercase tracking-widest">
            <Server className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="truncate">Port 3000 Front Secured</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
