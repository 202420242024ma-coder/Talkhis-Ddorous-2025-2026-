import React from 'react';
import { Language } from '../types';
import { ArrowRight, BookOpen, BrainCircuit, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  lang: Language;
}

const Dashboard: React.FC<Props> = ({ lang }) => {
  const isRTL = lang === Language.AR;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {lang === Language.AR ? 'مرحبًا بك في منصة تلخيص الدروس' : 'Welcome to the Lesson Summary Platform'}
        </h1>
        <p className="opacity-90 text-lg mb-6 max-w-2xl">
          {lang === Language.AR 
            ? 'استخدم قوة الذكاء الاصطناعي لتلخيص الدروس، إنشاء اختبارات مخصصة، والحصول على معلم خاص فوري.'
            : 'Leverage AI to summarize lessons, create custom quizzes, and get an instant personal tutor.'}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/summarizer" className="bg-white text-primary px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            {lang === Language.AR ? 'ابدأ التلخيص' : 'Start Summarizing'}
          </Link>
          <Link to="/planner" className="bg-white/20 backdrop-blur text-white border border-white/30 px-6 py-2 rounded-full font-semibold hover:bg-white/30 transition-colors">
            {lang === Language.AR ? 'إنشاء جدول مراجعة' : 'Create Study Plan'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tutor Card */}
        <Link to="/tutor" className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-transparent hover:border-indigo-500/20">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">
              {lang === Language.AR ? 'المعلم الذكي' : 'AI Tutor'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              {lang === Language.AR 
               ? 'معلمك الخاص للإجابة على جميع الأسئلة.' 
               : 'Your personal tutor for all questions.'}
            </p>
            <div className={`flex items-center text-indigo-600 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              {lang === Language.AR ? 'ابدأ' : 'Start'} <ArrowRight size={16} className={`mx-1 ${isRTL ? 'rotate-180' : ''}`} />
            </div>
        </Link>

        {/* Summarizer Card */}
          <Link to="/summarizer" className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-transparent hover:border-blue-500/20">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">
              {lang === Language.AR ? 'تلخيص الدروس' : 'Lesson Summarizer'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              {lang === Language.AR 
               ? 'حول الدروس الطويلة إلى ملخصات مركزة.' 
               : 'Turn long lessons into focused summaries.'}
            </p>
            <div className={`flex items-center text-blue-600 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              {lang === Language.AR ? 'لخص' : 'Summarize'} <ArrowRight size={16} className={`mx-1 ${isRTL ? 'rotate-180' : ''}`} />
            </div>
          </Link>

          {/* Quiz Card */}
          <Link to="/quiz" className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-transparent hover:border-green-500/20">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">
              {lang === Language.AR ? 'الاختبارات' : 'Quiz Generator'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              {lang === Language.AR 
               ? 'اختبر معلوماتك وتميز في دراستك.' 
               : 'Test your knowledge and excel.'}
            </p>
            <div className={`flex items-center text-green-600 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              {lang === Language.AR ? 'اختبر' : 'Quiz'} <ArrowRight size={16} className={`mx-1 ${isRTL ? 'rotate-180' : ''}`} />
            </div>
          </Link>

           {/* Planner Card */}
           <Link to="/planner" className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-transparent hover:border-teal-500/20">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-lg flex items-center justify-center mb-4">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">
              {lang === Language.AR ? 'جدول الدراسة' : 'Study Planner'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              {lang === Language.AR 
               ? 'نظم وقتك بجدول دراسي ذكي.' 
               : 'Organize your time with a smart plan.'}
            </p>
            <div className={`flex items-center text-teal-600 text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              {lang === Language.AR ? 'خطط' : 'Plan'} <ArrowRight size={16} className={`mx-1 ${isRTL ? 'rotate-180' : ''}`} />
            </div>
          </Link>
      </div>
    </div>
  );
};

export default Dashboard;
