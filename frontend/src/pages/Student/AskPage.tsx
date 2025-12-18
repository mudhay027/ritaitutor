import { useState, useEffect, useRef } from 'react';
import { askQuestion } from '../../services/ai';
import { createSession, getMessages } from '../../services/chat';
import { getPdfs } from '../../services/pdf';
import ChatBubble from '../../components/Shared/ChatBubble';
import ChatSidebar from '../../components/Shared/ChatSidebar';
import { useStore } from '../../store/store';
import { Send, Loader2, Paperclip, Bot, PenLine, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const AskPage = () => {
  const { user } = useStore();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // PDF Search State
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [showPdfDropdown, setShowPdfDropdown] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadPdfs = async () => {
      try {
        const data = await getPdfs();
        setPdfs(data);
      } catch (error) {
        console.error('Failed to load PDFs', error);
      }
    };
    loadPdfs();
  }, []);

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setSelectedPdfId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectSession = async (id: number) => {
    setSessionId(id);
    try {
      const msgs = await getMessages(id);
      // Map API response to UI format
      const mappedMsgs = msgs.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role?.toLowerCase() === 'user',
        sources: msg.sources
      }));
      setMessages(mappedMsgs);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { id: Date.now(), text: messageText, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createSession(messageText.substring(0, 30) + '...');
        currentSessionId = session.id;
        setSessionId(currentSessionId);
        setRefreshTrigger(prev => prev + 1);
      }

      // Pass selectedPdfId to askQuestion
      const response = await askQuestion(messageText, selectedPdfId, 5, currentSessionId);
      const aiMsg = {
        id: Date.now() + 1,
        text: response.answer,
        isUser: false,
        sources: response.sources
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Failed to send message', error);
      // Optionally add an error message to the chat
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <div className="liquid-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <ChatSidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshTrigger={refreshTrigger}
      />

      <div className="flex-1 flex flex-col relative bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-white/20 relative z-20">
          <div className="relative">
            <button
              onClick={() => setShowPdfDropdown(!showPdfDropdown)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Paperclip className="w-4 h-4" />
              <span className="max-w-[200px] truncate">
                {selectedPdfId ? pdfs.find(p => p.filename === selectedPdfId)?.filename : 'Search All PDFs'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPdfDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPdfDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 custom-scrollbar">
                <button
                  onClick={() => { setSelectedPdfId(null); setShowPdfDropdown(false); }}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !selectedPdfId ? "bg-blue-50 dark:bg-blue-900/20 text-[#2596be]" : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  Search All PDFs
                </button>
                {pdfs.map(pdf => (
                  <button
                    key={pdf.filename}
                    onClick={() => { setSelectedPdfId(pdf.filename); setShowPdfDropdown(false); }}
                    className={clsx(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate",
                      selectedPdfId === pdf.filename ? "bg-blue-50 dark:bg-blue-900/20 text-[#2596be]" : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                    title={pdf.filename}
                  >
                    {pdf.filename}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              <h2 className="text-5xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">Hello, {user?.name || 'Student'}</span>
              </h2>

              {/* Center Input Area */}
              <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-3xl shadow-lg shadow-blue-500/5 flex flex-col p-2 relative focus-within:ring-2 focus-within:ring-[#2596be]/20 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask a question..."
                    className="w-full bg-transparent border-none focus:ring-0 px-6 py-4 text-slate-800 dark:text-white placeholder:text-slate-400 resize-none max-h-32 custom-scrollbar text-lg"
                    rows={1}
                    style={{ minHeight: '60px' }}
                  />
                  <div className="flex justify-between items-center px-4 pb-2">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-[#2596be] transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-[#2596be] transition-colors">
                        <Bot className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading}
                      className="p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-[#2596be] disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {['Explain Quantum Computing', 'Summarize the PDF', 'Create a Study Plan', 'Write a Python Script'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:scale-105 transition-all shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto pt-8 pb-32">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg.text}
                  isUser={msg.isUser}
                  sources={msg.sources}
                  onEdit={(newText) => handleSend(newText)}
                />
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#2596be]" />
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area (Only visible when there are messages) */}
        {messages.length > 0 && (
          <div className="absolute bottom-8 left-0 right-0 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl shadow-lg shadow-blue-500/5 flex items-end p-2 relative focus-within:ring-2 focus-within:ring-[#2596be]/20 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 resize-none max-h-32 custom-scrollbar text-[15px]"
                  rows={1}
                  style={{ minHeight: '52px' }}
                />

                <div className="flex items-center gap-2 pb-2 pr-2">
                  <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors text-slate-400 hover:text-green-500" title="AI Model">
                    <Bot className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="p-2.5 bg-[#2596be] hover:bg-[#1e85aa] text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskPage;
