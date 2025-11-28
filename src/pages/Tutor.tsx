import React, { useState, useEffect, useRef } from 'react';
import { Language, Message, ChatMode } from '../types';
import { sendChatMessage } from '../services/geminiService';
import LiveTutor from '../components/LiveTutor';
import { Send, User, Sparkles, Loader2, MessageSquare, Camera, Paperclip, X, FileText, BrainCircuit, Search, GraduationCap, FileSearch } from 'lucide-react';

interface Props {
  lang: Language;
}

const Tutor: React.FC<Props> = ({ lang }) => {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  
  const translations = {
    [Language.AR]: { textChat: 'المحادثة النصية', voiceChat: 'المعلم الصوتي الحي', chatDesc: 'تحدث صوتياً أو كتابياً مع معلمك الذكي.', voiceDesc: 'تحدث مباشرة مع الذكاء الاصطناعي لتحسين لغتك أو مناقشة درس.', placeholder: 'اكتب سؤالك هنا...', welcome: 'مرحباً! أنا معلمك الذكي. كيف يمكنني مساعدتك في دراستك اليوم؟', tipsTitle: 'نصائح للمحادثة', tips: ['تحدث بوضوح وفي مكان هادئ.', 'اطلب من المعلم إعادة الشرح إذا لم تفهم.', 'جرب طلب اختبار سريع شفوياً.'], switchVoice: 'صوت', switchChat: 'محادثة', connecting: 'جاري الكتابة...', camera: 'كاميرا', file: 'إرفاق ملف', modes: { normal: 'عادي', thinking: 'جاري التفكير (عميق)', research: 'بحث تفصيلي', search: 'البحث في الويب', study: 'ذاكر وتعلم' } },
    [Language.EN]: { textChat: 'Text Chat', voiceChat: 'Live Voice Tutor', chatDesc: 'Chat via voice or text with your AI tutor.', voiceDesc: 'Talk directly with AI to improve language or discuss a lesson.', placeholder: 'Type your question...', welcome: 'Hello! I am your AI Tutor. How can I help you study today?', tipsTitle: 'Conversation Tips', tips: ['Speak clearly in a quiet environment.', 'Ask the tutor to re-explain if confused.', 'Try asking for a quick oral quiz.'], switchVoice: 'Voice', switchChat: 'Chat', connecting: 'Thinking...', camera: 'Camera', file: 'Attach File', modes: { normal: 'Normal', thinking: 'Deep Thinking', research: 'Deep Research', search: 'Web Search', study: 'Study & Learn' } },
    [Language.FR]: { textChat: 'Chat Textuel', voiceChat: 'Tuteur Vocal en Direct', chatDesc: 'Discutez par voix ou texte avec votre tuteur IA.', voiceDesc: 'Parlez directement avec l\'IA pour améliorer la langue.', placeholder: 'Tapez votre question...', welcome: 'Bonjour! Je suis votre tuteur IA. Comment puis-je vous aider?', tipsTitle: 'Conseils de Conversation', tips: ['Parlez clairement dans un endroit calme.', 'Demandez au tuteur de réexpliquer si nécessaire.', 'Essayez de demander un quiz oral rapide.'], switchVoice: 'Voix', switchChat: 'Chat', connecting: 'Réflexion...', camera: 'Caméra', file: 'Joindre', modes: { normal: 'Normal', thinking: 'Pensée Profonde', research: 'Recherche Dét.', search: 'Recherche Web', study: 'Étudier' } },
    [Language.ES]: { textChat: 'Chat de Texto', voiceChat: 'Tutor de Voz en Vivo', chatDesc: 'Chatea por voz o texto con tu tutor de IA.', voiceDesc: 'Habla directamente con la IA para mejorar tu idioma.', placeholder: 'Escribe tu pregunta...', welcome: '¡Hola! Soy tu tutor de IA. ¿Cómo puedo ayudarte hoy?', tipsTitle: 'Consejos de Conversación', tips: ['Habla claro en un ambiente tranquilo.', 'Pide al tutor que te vuelva a explicar si te confundes.', 'Intenta pedir un cuestionario oral rápido.'], switchVoice: 'Voz', switchChat: 'Chat', connecting: 'Pensando...', camera: 'Cámara', file: 'Adjuntar', modes: { normal: 'Normal', thinking: 'Pensamiento Profundo', research: 'Investigación', search: 'Búsqueda Web', study: 'Estudiar' } }
  };

  const t = translations[lang];

  const [messages, setMessages] = useState<Message[]>([{ role: 'model', text: t.welcome, timestamp: Date.now() }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (messages.length === 1 && messages[0].role === 'model') setMessages([{ role: 'model', text: t.welcome, timestamp: Date.now() }]); }, [lang]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, attachment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { const res = reader.result as string; setAttachment({ data: res.split(',')[1], mimeType: file.type, name: file.name }); };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const clearAttachment = () => setAttachment(null);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachment) return;

    const userMsg: Message = { role: 'user', text: inputText, timestamp: Date.now(), attachment: attachment ? { ...attachment } : undefined };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachment(null);
    setLoading(true);

    try {
      const responseText = await sendChatMessage(messages, userMsg.text, lang, userMsg.attachment, chatMode);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err) {
      const errorMsg: Message = { role: 'model', text: lang === Language.AR ? "حدث خطأ في الاتصال. حاول مرة أخرى." : "Connection error.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const modesList: {id: ChatMode, icon: any, label: string, color: string}[] = [
    { id: 'normal', icon: MessageSquare, label: t.modes.normal, color: 'text-gray-600' },
    { id: 'thinking', icon: BrainCircuit, label: t.modes.thinking, color: 'text-purple-600' },
    { id: 'research', icon: FileSearch, label: t.modes.research, color: 'text-blue-600' },
    { id: 'search', icon: Search, label: t.modes.search, color: 'text-green-600' },
    { id: 'study', icon: GraduationCap, label: t.modes.study, color: 'text-orange-600' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
      <div className="md:hidden flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mb-2 shrink-0">
        <button onClick={() => setMode('text')} className={`flex-1 py-2 rounded-md text-sm font-bold ${mode === 'text' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}>{t.switchChat}</button>
        <button onClick={() => setMode('voice')} className={`flex-1 py-2 rounded-md text-sm font-bold ${mode === 'voice' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}>{t.switchVoice}</button>
      </div>

      <div className={`flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${mode === 'voice' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2"><MessageSquare className="text-primary" size={20}/><h3 className="font-bold dark:text-white">{t.textChat}</h3></div>
          <div className="relative">
             <button onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
               {(() => { const m = modesList.find(x => x.id === chatMode); const Icon = m?.icon || MessageSquare; return (<><Icon size={16} className={m?.color} /><span className="dark:text-white">{m?.label}</span></>)})()}
             </button>
             {isModeSelectorOpen && (<div className="absolute top-10 right-0 z-20 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 animate-fade-in">{modesList.map((m) => (<button key={m.id} onClick={() => { setChatMode(m.id); setIsModeSelectorOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${chatMode === m.id ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><m.icon size={18} className={m.color} />{m.label}{chatMode === m.id && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}</button>))}</div>)}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>{msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}</div>
              <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachment && (<div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 mb-1">{msg.attachment.mimeType.startsWith('image/') ? (<img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} alt="attachment" className="max-h-48 object-cover"/>) : (<div className="p-4 bg-gray-100 dark:bg-gray-700 flex items-center gap-2 text-sm font-medium"><FileText size={20} />{msg.attachment.name || 'File'}</div>)}</div>)}
                <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'}`}><div className="whitespace-pre-wrap text-sm leading-relaxed prose dark:prose-invert max-w-none">{msg.text.split('\n').map((line, i) => (<React.Fragment key={i}>{line.startsWith('- [') ? (<div dangerouslySetInnerHTML={{ __html: line.replace(/- \[(.*?)\]\((.*?)\)/g, '• <a href="$2" target="_blank" class="text-blue-500 underline">$1</a>') }} />) : (<div>{line}</div>)}</React.Fragment>))}</div></div>
                <span className={`text-[10px] opacity-70 ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          ))}
          {loading && (<div className="flex gap-3 animate-pulse"><div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Sparkles size={16} /></div><div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none flex items-center gap-2"><Loader2 size={16} className="animate-spin text-gray-500" /><span className="text-xs text-gray-500">{t.connecting}</span></div></div>)}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {attachment && (<div className="mb-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center gap-3 w-fit">{attachment.mimeType.startsWith('image/') ? (<img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt="preview" className="w-10 h-10 object-cover rounded" />) : (<FileText className="text-gray-500 dark:text-gray-300" size={24} />)}<div className="text-xs max-w-[150px] truncate dark:text-white font-medium">{attachment.name}</div><button onClick={clearAttachment} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><X size={14} className="text-gray-500" /></button></div>)}
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileSelect} />
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title={t.camera}><Camera size={20} /></button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors" title={t.file}><Paperclip size={20} /></button>
            <div className="relative flex-1"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.placeholder} className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-shadow" disabled={loading} /><button type="submit" disabled={loading || (!inputText.trim() && !attachment)} className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"><Send size={18} /></button></div>
          </form>
        </div>
      </div>

      <div className={`w-full md:w-80 flex flex-col gap-6 shrink-0 ${mode === 'text' ? 'hidden md:flex' : 'flex'}`}>
        <LiveTutor initialLang={lang} />
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-indigo-100 dark:border-gray-700">
           <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2"><Sparkles size={16} /> {t.tipsTitle}</h4>
           <ul className="space-y-2">{t.tips.map((tip: string, i: number) => (<li key={i} className="text-sm text-indigo-800 dark:text-indigo-300 flex gap-2"><span className="text-indigo-400">•</span> {tip}</li>))}</ul>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
