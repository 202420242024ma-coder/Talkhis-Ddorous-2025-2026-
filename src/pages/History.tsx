import React, { useState, useEffect } from 'react';
import { Language, SummaryResult, QuizResult } from '../types';
import { FileText, BrainCircuit, Trash2, Clock } from 'lucide-react';

interface Props {
  lang: Language;
}

const History: React.FC<Props> = ({ lang }) => {
  const [summaries, setSummaries] = useState<SummaryResult[]>([]);
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [activeTab, setActiveTab] = useState<'summaries' | 'quizzes'>('summaries');

  useEffect(() => {
    const savedSummaries = JSON.parse(localStorage.getItem('summaries') || '[]');
    const savedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    setSummaries(savedSummaries);
    setQuizzes(savedQuizzes);
  }, []);

  const deleteItem = (type: 'summary' | 'quiz', index: number) => {
    if (type === 'summary') {
      const updated = summaries.filter((_, i) => i !== index);
      setSummaries(updated);
      localStorage.setItem('summaries', JSON.stringify(updated));
    } else {
      const updated = quizzes.filter((_, i) => i !== index);
      setQuizzes(updated);
      localStorage.setItem('quizzes', JSON.stringify(updated));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">
        {lang === Language.AR ? 'السجل والمحفوظات' : 'History & Saved Items'}
      </h2>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab('summaries')} className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'summaries' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>{lang === Language.AR ? 'الملخصات' : 'Summaries'}</button>
        <button onClick={() => setActiveTab('quizzes')} className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'quizzes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>{lang === Language.AR ? 'الاختبارات' : 'Quizzes'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'summaries' ? (
          summaries.length === 0 ? (<p className="text-gray-400 col-span-2 text-center py-10">No saved summaries.</p>) : (
            summaries.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"><FileText size={20} /></div><button onClick={() => deleteItem('summary', idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></div>
                <h3 className="font-bold text-lg dark:text-white mb-1 truncate">{item.topic}</h3>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><Clock size={12}/> {new Date(item.createdAt).toLocaleDateString()}</p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-1">{item.content}</div>
              </div>
            ))
          )
        ) : (
           quizzes.length === 0 ? (<p className="text-gray-400 col-span-2 text-center py-10">No saved quizzes.</p>) : (
            quizzes.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg"><BrainCircuit size={20} /></div><button onClick={() => deleteItem('quiz', idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></div>
                <h3 className="font-bold text-lg dark:text-white mb-1 truncate">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><Clock size={12}/> {new Date(item.createdAt || Date.now()).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.questions.length} Questions</p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default History;
