
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { ChatSession, ChatMessage as ChatMessageType } from './types';
import { GeminiService } from './services/geminiService';
import { SUGGESTIONS, GeminiIcon } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const geminiService = useRef(new GeminiService());

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_clone_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('gemini_clone_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, streamingText]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: '',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    textareaRef.current?.focus();
  }, []);

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result?.toString().split(',')[1];
        if (base64) {
          setAttachedImage({
            mimeType: file.type,
            data: base64
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (text: string = inputText) => {
    const trimmedText = text.trim();
    if ((!trimmedText && !attachedImage) || isGenerating) return;

    let activeId = currentSessionId;
    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      parts: [
        { text: trimmedText },
        ...(attachedImage ? [{ inlineData: attachedImage }] : [])
      ],
      timestamp: Date.now()
    };

    setSessions(prev => {
      let newSessions = [...prev];
      let session = newSessions.find(s => s.id === activeId);
      
      if (!session) {
        const newSessionId = uuidv4();
        activeId = newSessionId;
        const newSession: ChatSession = {
          id: newSessionId,
          title: trimmedText.slice(0, 40) || 'New Chat',
          messages: [userMessage],
          updatedAt: Date.now()
        };
        newSessions = [newSession, ...newSessions];
        setCurrentSessionId(newSessionId);
      } else {
        session.messages = [...session.messages, userMessage];
        session.updatedAt = Date.now();
        if (!session.title && trimmedText) {
          session.title = trimmedText.slice(0, 40);
        }
      }
      return newSessions;
    });

    setInputText('');
    const imgToSend = attachedImage;
    setAttachedImage(null);
    setIsGenerating(true);
    setStreamingText('');

    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const history = sessions.find(s => s.id === activeId)?.messages || [];
      const result = await geminiService.current.sendMessageStream(
        history,
        trimmedText,
        imgToSend || undefined,
        (chunk) => setStreamingText(prev => prev + chunk)
      );

      const aiMessage: ChatMessageType = {
        id: uuidv4(),
        role: 'model',
        parts: [{ text: result.text }],
        groundingSources: result.groundingSources,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === activeId ? { ...s, messages: [...s.messages, aiMessage], updatedAt: Date.now() } : s
      ));
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessageType = {
        id: uuidv4(),
        role: 'model',
        parts: [{ text: "Sorry, I encountered an error. Please check your connection and try again." }],
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => 
        s.id === activeId ? { ...s, messages: [...s.messages, errorMessage] } : s
      ));
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        isOpen={isSidebarOpen}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col relative h-full">
        <header className="flex items-center justify-between p-4 lg:px-8 bg-[#131314]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#2a2b2d] rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-medium tracking-tight">Gemini</span>
              <span className="text-[10px] font-bold bg-[#2a2b2d] px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-widest">Flash</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">U</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-48 pt-4">
          {(!currentSession || currentSession.messages.length === 0) && !isGenerating ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-4xl mx-auto w-full">
              <div className="text-left w-full mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Hello, User
                </h1>
                <p className="text-2xl md:text-3xl text-gray-500 font-medium">How can I help you today?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(s.title + ": " + s.text)}
                    className="p-4 bg-[#1e1f20] hover:bg-[#2a2b2d] rounded-2xl border border-[#3c4043] text-left transition-all hover:scale-[1.02] flex flex-col justify-between group h-44 shadow-md"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-100">{s.title}:</span>
                      <span className="text-sm text-gray-400 leading-relaxed line-clamp-3">{s.text}</span>
                    </div>
                    <div className="self-end p-2.5 bg-[#131314] rounded-full group-hover:bg-[#37393b] transition-colors shadow-inner">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        {s.icon}
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {currentSession?.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {streamingText && (
                <ChatMessage 
                  message={{
                    id: 'streaming',
                    role: 'model',
                    parts: [{ text: streamingText }],
                    timestamp: Date.now()
                  }} 
                  isStreaming={true}
                />
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 lg:px-8 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent z-20">
          <div className="max-w-4xl mx-auto w-full relative">
            
            {attachedImage && (
              <div className="absolute bottom-full mb-4 p-2 bg-[#1e1f20] border border-[#3c4043] rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-2xl backdrop-blur-md">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#3c4043] shadow-inner">
                  <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-bold text-gray-300">Image ready</span>
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="text-xs text-red-400 font-medium hover:text-red-300 transition-colors mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col bg-[#1e1f20] rounded-3xl border border-[#3c4043] focus-within:ring-2 focus-within:ring-blue-500/30 transition-all overflow-hidden shadow-2xl">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a prompt here"
                rows={1}
                className="w-full bg-transparent px-6 py-4 resize-none focus:outline-none text-[#e3e3e3] min-h-[60px] max-h-60 overflow-y-auto text-base md:text-lg placeholder:text-gray-600"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
                }}
              />
              
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 hover:bg-[#37393b] rounded-full text-blue-400 transition-all hover:scale-110 active:scale-95"
                    title="Upload image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isGenerating || (!inputText.trim() && !attachedImage)}
                  className={`
                    p-3 rounded-full transition-all flex items-center justify-center
                    ${isGenerating || (!inputText.trim() && !attachedImage) 
                      ? 'text-gray-700' 
                      : 'text-blue-400 hover:bg-[#37393b] hover:scale-110 active:scale-90'}
                  `}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-[10px] md:text-xs text-center text-gray-600 mt-4 mb-2 px-4 leading-relaxed">
              Gemini may display inaccurate info, including about people, so double-check its responses. 
              <a href="#" className="underline ml-1 hover:text-gray-400 transition-colors">Privacy and Gemini Apps</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
