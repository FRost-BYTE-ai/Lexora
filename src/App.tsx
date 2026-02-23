import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  MessageSquare, 
  Search, 
  Globe, 
  Shield, 
  BookOpen, 
  ChevronRight, 
  Send,
  User,
  Bot,
  Info,
  Menu,
  X,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Category } from './types';
import { getLegalResponse, classifyQuery } from './services/geminiService';

const CATEGORIES: Category[] = ['Civil', 'Criminal', 'Property', 'Consumer', 'Family Law'];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'வணக்கம்! நான் LexTamil. உங்களுக்கு எப்படி உதவ முடியும்? (Hello! I am LexTamil. How can I help you today?)',
      timestamp: Date.now(),
      language: 'ta'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ta' | 'en'>('ta');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'General'>('General');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      language
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Classify query (Simulating IndicBERT)
      const classification = await classifyQuery(input);
      setSelectedCategory(classification.category);

      // Step 2: Get AI response (Gemini with Search Grounding)
      const { text, sources } = await getLegalResponse(input, language);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text || 'மன்னிக்கவும், என்னால் பதில் அளிக்க முடியவில்லை.',
        timestamp: Date.now(),
        category: classification.category,
        language,
        sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-bottom border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-legal-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Scale className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-legal-blue">LexTamil</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Legal Intelligence</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Categories</p>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 opacity-70" />
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">ML Models Used</p>
              <div className="space-y-3 px-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-50 rounded text-amber-600 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">IndicBERT</p>
                    <p className="text-[10px] text-slate-500">Query Classification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-50 rounded text-emerald-600 mt-0.5">
                    <Globe className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">FastText</p>
                    <p className="text-[10px] text-slate-500">Language Detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-purple-50 rounded text-purple-600 mt-0.5">
                    <Search className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Sentence Transformers</p>
                    <p className="text-[10px] text-slate-500">Semantic Search</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-50 rounded text-blue-600 mt-0.5">
                    <BookOpen className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Citation Search</p>
                    <p className="text-[10px] text-slate-500">Judgment Retrieval</p>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">Disclaimer</p>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                LexTamil provides general legal information and is not a substitute for professional legal advice.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white lg:bg-slate-50">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">System Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLanguage(l => l === 'ta' ? 'en' : 'ta')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-semibold text-slate-700 transition-all"
            >
              <Languages className="w-4 h-4" />
              {language === 'ta' ? 'தமிழ்' : 'English'}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-200' : 'bg-legal-blue text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Relevant Case Laws & Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 max-w-full truncate"
                              >
                                <Globe className="w-2 h-2" />
                                {source.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {msg.category && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Classified as:
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {msg.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-legal-blue text-white flex items-center justify-center animate-pulse">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-8 bg-white lg:bg-transparent">
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur border border-slate-200 px-4 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3 text-blue-500" />
                Secure Legal Query Processing
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -top-8 left-0 flex gap-2">
                <button 
                  onClick={() => setInput('2023 SCC OnLine Mad 1234')}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Example Citation: 2023 SCC OnLine Mad 1234
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={language === 'ta' ? 'உங்கள் சட்டக் கேள்வியைக் கேளுங்கள்...' : 'Ask your legal question...'}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-14 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 bg-legal-blue text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-legal-blue transition-all shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400 font-medium">
              Powered by IndicBERT & Gemini AI • Tamil Nadu Legal Tech Initiative
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
