import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, RefreshCw, Sparkles 
} from 'lucide-react';
import { uploadPDF } from '../services/api';

interface UploadBoxProps {
  onUploadSuccess: (fileName: string) => void;
  onUploadError: (msg: string) => void;
  useSimulation: boolean;
  apiUrl: string;
  currentFileName?: string;
}

export default function UploadBox({
  onUploadSuccess,
  onUploadError,
  useSimulation,
  apiUrl,
  currentFileName,
}: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorText, setErrorText] = useState('');
  const [fileName, setFileName] = useState(currentFileName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if active filename changes
  if (currentFileName && currentFileName !== fileName) {
    setFileName(currentFileName);
    setUploadState('success');
  } else if (!currentFileName && fileName && uploadState === 'success') {
    // Reset if was cleared
    setFileName('');
    setUploadState('idle');
    setUploadProgress(0);
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      const errMsg = 'Invalid file type. Please upload a PDF document.';
      setErrorText(errMsg);
      setUploadState('error');
      onUploadError(errMsg);
      return;
    }

    setFileName(file.name);
    setUploadState('uploading');
    setUploadProgress(0);
    setErrorText('');

    try {
      const result = await uploadPDF(
        file,
        (progress) => setUploadProgress(progress),
        apiUrl,
        useSimulation
      );
      setUploadState('success');
      onUploadSuccess(result.fileName);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to upload PDF. Please check server connection.';
      if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      } else if (err.message) {
        errMsg = err.message;
      }
      setErrorText(errMsg);
      setUploadState('error');
      onUploadError(errMsg);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleTriggerInput = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setFileName('');
    setErrorText('');
    onUploadSuccess(''); // empty signifies reset
  };

  return (
    <div className="w-full max-w-xl mx-auto p-1">
      <div className="relative">
        <AnimatePresence mode="wait">
          
          {/* UPLOADING STATE CARD */}
          {uploadState === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-white/10 bg-[#111] p-8 text-center backdrop-blur-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-200">
                Processing PDF Node Data...
              </h3>
              <p className="mt-1 text-xs text-zinc-500 truncate max-w-xs mx-auto font-mono">
                {fileName}
              </p>
              
              {/* Progress pipeline */}
              <div className="mt-6">
                <div className="flex justify-between text-[11px] font-semibold text-zinc-400 mb-1.5 px-1 font-mono">
                  <span>ANALYZING</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-300 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SUCCESS STATE CARD */}
          {uploadState === 'success' && fileName && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-white/10 bg-[#111] p-8 text-center backdrop-blur-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <CheckCircle2 className="h-6 w-6 text-orange-400" />
              </div>
              
              <div className="mt-4">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 border border-white/5 px-2.5 py-0.5 rounded mb-1">
                  <Sparkles className="h-3 w-3 text-orange-400" /> COMPILATION SUCCESS
                </span>
                <h3 className="text-sm font-serif italic text-white font-medium truncate max-w-xs mx-auto mt-2">
                  {fileName}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Semantic structures and stats lists mapped. Please query below.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={resetUpload}
                  className="flex h-8 items-center gap-1.5 rounded border border-white/10 bg-transparent px-3 text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Replace File
                </button>
              </div>
            </motion.div>
          )}

          {/* ERROR STATE CARD */}
          {uploadState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-red-500/20 bg-red-950/10 p-6 text-center backdrop-blur-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                Upload Interrupted
              </h3>
              <p className="mt-1.5 text-xs text-red-400 bg-red-950/25 py-2 px-3 rounded border border-red-500/10 mt-3 max-w-xs mx-auto font-mono">
                {errorText}
              </p>

              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={resetUpload}
                  className="flex h-8 items-center gap-1.5 rounded bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
                >
                  Try Again
                </button>
                {useSimulation === false && (
                  <button
                    onClick={() => {
                      onUploadSuccess('');
                    }}
                    className="flex h-8 items-center gap-1.5 rounded border border-amber-500/20 bg-amber-950/10 px-3 text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:bg-amber-950/20"
                  >
                    Simulate Locally
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* IDLE DROP ZONE STATE */}
          {uploadState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleTriggerInput}
              className={`group flex flex-col items-center justify-center cursor-pointer rounded-xl border border-dashed p-8 text-center transition-all ${
                dragActive
                  ? 'border-orange-500 bg-orange-950/10'
                  : 'border-white/10 bg-[#111111]/40 hover:border-white/20 hover:bg-[#111111]/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${
                dragActive
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 bg-[#050505] text-zinc-500 group-hover:border-white/20 group-hover:text-zinc-300'
              }`}>
                <UploadCloud className={`h-5 w-5 ${dragActive ? 'animate-bounce' : ''}`} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-zinc-200">
                Upload your PDF Document
              </h3>
              
              <p className="mt-1 text-xs text-zinc-500 leading-normal max-w-xs">
                Drag and drop your file here, or click to browse.
              </p>

              <div className="mt-4 flex items-center justify-center gap-1.5 rounded border border-white/5 bg-[#050505]/60 pr-2 pl-3 py-1 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                <span>PDF support up to 25MB</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-650" />
              </div>

              {useSimulation && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded border border-orange-500/20 bg-orange-950/80 px-2.5 py-0.5 text-[9px] text-orange-350 uppercase tracking-wider font-bold whitespace-nowrap shadow-sm">
                  DEMO INSTANT LOAD ACTIVE
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
