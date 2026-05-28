export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // ISO string for persistence/serialization
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  uploadedFileName?: string;
  createdAt: string;
  isDisabled?: boolean;
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  fileName?: string;
  error?: string;
}
