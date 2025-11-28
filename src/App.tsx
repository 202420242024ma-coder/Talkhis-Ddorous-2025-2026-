import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  BrainCircuit, 
  PenTool, 
  Moon, 
  Sun, 
  Menu,
  X,
  Home,
  MessageSquare,
  History as HistoryIcon,
  Calendar
} from 'lucide-react';
import { Language } from './types';
import GamificationBar from './components/GamificationBar';

// Pages
import Dashboard from './pages/Dashboard';
import Summarizer from './pages/Summarizer';
import Quizzer from './pages/Quizzer';
import Resources from './pages/Resources';
import Tutor from './pages/Tutor';
import History from './pages/History';
import Planner from './pages/Planner';

const translations = {
  [Language.AR]: {
    home: 'الرئيسية',
    summary: 'تلخيص ذكي',
    quiz: 'اختبارات',
    resources: 'المصادر',
    tutor: 'المعلم الذكي',
    history: 'السجل',
    planner: 'جدول المراجعة',
    title: 'منصة تلخيص الدروس',
    subtitle: 'مساعدك التعليمي الذكي',
    designedBy: 'تم التصميم بواسطة محمد امين خضري'
  },
  [Language.EN]: {
    home: 'Home',
    summary: 'Summarizer',
    quiz: 'Quizzes',
    resources: 'Resources',
    tutor: 'AI Tutor',
    history: 'History',
    planner: 'Study Planner',
    title: 'Lesson Summary Platform',
    subtitle: 'Your Smart Educational Assistant',
    designedBy: 'Designed by Mohammed Amin Khodari'
  },
  [Language.FR]: {
    home: 'Accueil',
    summary: 'Résumé',
    quiz: 'Quiz',
    resources: 'Ressources',
    tutor: 'Tuteur IA',
    history: 'Historique',
    planner: 'Planning',
    title: 'Plateforme de Résumé',
    subtitle: 'Votre assistant éducatif intelligent',
    designedBy: 'Conçu par Mohammed Amin Khodari'
  },
  [Language.ES]: {
    home: 'Inicio',
    summary: 'Resumen',
    quiz: 'Cuestionarios',
    resources: 'Recursos',
    tutor: 'Tutor IA',
    history: 'Historial',
    planner: 'Planificador',
    title: 'Plataforma de Resúmenes',
    subtitle: 'Tu asistente educativo inteligente',
    designedBy: 'Diseñado por Mohammed Amin Khodari'
  }
};

const AppLogo = () => (
  <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
      <BookOpen className="w-9 h-9 text-[#0B2447] dark:text-indigo-400 mt-2" strokeWidth={2} />
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-800">
          <BrainCircuit className="w-3.5 h-3.5 text-white" strokeWidth={2.5}/>
      </div>
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, lang, setLang }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLangChange = (l: Language) => {
    setLang(l);
  };

  useEffect(() => {
    document.documentElement.dir = lang === Language.AR ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];

  const navItems = [
    { path: '/', icon: Home, label: t.home },
    { path: '/planner', icon: Calendar, label: t.planner },
    { path: '/tutor', icon: MessageSquare, label: t.tutor },
    { path: '/summarizer', icon: BookOpen, label: t.summary },
    { path: '/quiz', icon: PenTool, label: t.quiz },
    { path: '/resources', icon: BrainCircuit, label: t.resources },
    { path: '/history', icon: HistoryIcon, label: t.history },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 font-sans`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : (lang === Language.AR ? 'translate-x-full' : '-translate-x-full')} lg:static`}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <AppLogo />
             <span className="text-primary dark:text-secondary font-bold text-xl leading-tight">{t.title}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500">
            <X />
          </button>
        </div>
        
        <nav className="px-4 space-y-2 mt-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary dark:text-secondary font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <div className="mb-4 text-[10px] uppercase tracking-wider text-center text-gray-400 dark:text-gray-500 font-semibold">
             {t.designedBy}
          </div>
          <div className="flex justify-between items-center mb-4">
             <button onClick={toggleDark} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="flex gap-1">
               {Object.values(Language).map((l) => (
                 <button 
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={`text-xs font-bold px-2 py-1 rounded ${lang === l ? 'bg-primary text-white' : 'text-gray-400'}`}
                 >
                   {l.toUpperCase()}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
           {/* Mobile Menu Button */}
           <div className="lg:hidden p-4 flex items-center border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 dark:text-gray-300">
                <Menu />
            </button>
            <div className="mx-4 flex items-center gap-2">
                <AppLogo />
                <span className="font-bold text-lg dark:text-white">{t.title}</span>
            </div>
           </div>
           
           {/* Gamification Bar */}
           <GamificationBar lang={lang} />
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

const App = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved && Object.values(Language).includes(saved as Language)) {
      return saved as Language;
    }
    return Language.AR;
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);
  
  return (
    <Layout lang={lang} setLang={setLang}>
      <Routes>
        <Route path="/" element={<Dashboard lang={lang} />} />
        <Route path="/tutor" element={<Tutor lang={lang} />} />
        <Route path="/summarizer" element={<Summarizer lang={lang} />} />
        <Route path="/quiz" element={<Quizzer lang={lang} />} />
        <Route path="/resources" element={<Resources lang={lang} />} />
        <Route path="/history" element={<History lang={lang} />} />
        <Route path="/planner" element={<Planner lang={lang} />} />
      </Routes>
    </Layout>
  );
}

export default AppWrapper;
