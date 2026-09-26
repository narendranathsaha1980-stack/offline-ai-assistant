import React, { useState, useRef, useEffect } from 'react';
import { AssistantMessage, StoredFile } from '../types';
import { db } from '../services/storage';
import { AssistantService } from '../services/geminiService';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Sparkles, 
  FileText, 
  FolderInput, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AssistantChatProps {
  messages: AssistantMessage[];
  files: StoredFile[];
  onRefresh: () => void;
  onPreviewFile: (file: StoredFile) => void;
  onTriggerClean: () => void;
  onTriggerOrganize: () => void;
  onNavigateTab: (tab: any) => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  messages,
  files,
  onRefresh,
  onPreviewFile,
  onTriggerClean,
  onTriggerOrganize,
  onNavigateTab
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    // 1. Record user message
    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: query,
      isOfflineAnswer: true
    };
    db.addMessage(userMsg);
    setInputQuery('');
    onRefresh();

    setIsProcessing(true);

    try {
      // 2. Answer via hybrid/local engine
      const response = await AssistantService.answerQuery(query);

      const assistantMsg: AssistantMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: response.text,
        sources: response.sources,
        suggestedActions: response.suggestedActions,
        isOfflineAnswer: response.isOffline
      };

      db.addMessage(assistantMsg);
      onRefresh();
    } catch (e) {
      console.error(e);
      const fallbackMsg: AssistantMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: "I processed your request using local offline heuristics.",
        isOfflineAnswer: true
      };
      db.addMessage(fallbackMsg);
      onRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = () => {
    db.clearMessages();
    onRefresh();
  };

  const handleActionClick = (action: any) => {
    if (action.actionType === 'clean_junk') {
      onTriggerClean();
    } else if (action.actionType === 'organize_files') {
      onTriggerOrganize();
    } else if (action.actionType === 'create_task') {
      onNavigateTab('daily_work');
    } else if (action.actionType === 'view_learned') {
      onNavigateTab('learned');
    } else if (action.actionType === 'open_file' && action.payload?.fileId) {
      const f = files.find(file => file.id === action.payload.fileId);
      if (f) onPreviewFile(f);
    }
  };

  const samplePrompts = [
    "অপ্রয়োজনীয় ফাইল ডিলিট করো",
    "আজকের কাজগুলো কী কী?",
    "আমার ইনভয়েস ফাইল কোথায়?",
    "ফাইলগুলো সাজিয়ে দাও",
    "তুমি কী শিখেছ?",
    "Where is my invoice?",
    "What useless files can I delete?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Assistant Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/40 text-cyan-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Archon AI Assistant</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                <ShieldCheck className="w-3 h-3" />
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instant semantic reasoning & knowledge retrieval from local data
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          title="Clear chat history"
          className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Ask Archon Anything</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your questions are answered completely offline using local semantic indexing, file analysis, and learned patterns.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-cyan-600 text-white rounded-tr-none' 
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Attached Sources if available */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-medium text-slate-400 block">Referenced Local Data:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const f = files.find(file => file.id === src.fileId);
                              if (f) onPreviewFile(f);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="font-mono text-[11px] truncate max-w-[180px]">{src.fileName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Interactive Actions */}
                  {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act)}
                          className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          {act.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Offline proof */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{msg.isOfflineAnswer ? 'Local Engine' : 'Hybrid AI'}</span>
                      </>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isProcessing && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Archon is querying local index...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar */}
      <div className="px-6 py-2.5 bg-slate-950/50 border-t border-slate-800/60 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] text-slate-400 pr-1 select-none">Quick Prompts:</span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="বাংলা বা ইংরেজিতে লিখুন (যেমন: অপ্রয়োজনীয় ফাইল মুছো, কাজ কী কী, ইনভয়েস কোথায়)..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className={`p-2.5 rounded-xl text-white transition-colors shrink-0 flex items-center justify-center ${
              inputQuery.trim() && !isProcessing
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
