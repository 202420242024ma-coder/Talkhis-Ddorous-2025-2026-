import React, { useState } from 'react';
import { Language } from '../types';
import { quickSearch } from '../services/geminiService';
import { Search, ExternalLink, Loader2, Copy, Printer, Check } from 'lucide-react';

interface Props {
  lang: Language;
}

const Resources: React.FC<Props> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{text: string, links: any[]} | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await quickSearch(query, lang);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${lang === Language.AR ? 'rtl' : 'ltr'}">
          <head>
            <title>Resource Summary</title>
            <style>
              body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #4F46E5; }
              p { line-height: 1.6; font-size: 16px; white-space: pre-wrap; }
              .links { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
              .link-item { margin-bottom: 10px; }
              a { color: #4F46E5; text-decoration: none; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>${query}</h1>
            <p>${result.text}</p>
            ${result.links.length > 0 ? `
              <div class="links">
                <h3>${lang === Language.AR ? 'المصادر' : 'Sources'}</h3>
                ${result.links.map(l => l.web?.uri ? `<div class="link-item"><a href="${l.web.uri}">${l.web.title}</a></div>` : '').join('')}
              </div>
            ` : ''}
             <div class="footer">
               <p>Designed by Mohammed Amin Khodari | Talkhis Ddorous</p>
               <p>تم التصميم بواسطة محمد امين خضري | منصة تلخيص الدروس</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold dark:text-white mb-6">
        {lang === Language.AR ? 'البحث الذكي والمصادر' : 'Smart Search & Resources'}
      </h2>

      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === Language.AR ? 'ابحث عن درس، معلومة، أو مفهوم علمي...' : 'Search for a lesson, fact, or concept...'}
          className="w-full p-4 pr-12 rounded-full shadow-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none"
        />
        <button 
          type="submit" 
          className={`absolute top-2 ${lang === Language.AR ? 'left-2' : 'right-2'} p-2 bg-primary text-white rounded-full hover:bg-primary/90`}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </button>
      </form>

      {result && (
        <div className="animate-fade-in bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-[70%]">{query}</h3>
             <div className="flex gap-2">
                <button 
                  onClick={handleCopy} 
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={lang === Language.AR ? 'نسخ النص' : 'Copy Text'}
                >
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
                <button 
                  onClick={handlePrint} 
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={lang === Language.AR ? 'طباعة' : 'Print'}
                >
                    <Printer size={20} />
                </button>
             </div>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
             <p className="text-lg leading-relaxed whitespace-pre-wrap">{result.text}</p>
          </div>

          {result.links.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">
                {lang === Language.AR ? 'المصادر المستخدمة' : 'Sources'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.links.map((chunk, idx) => (
                  chunk.web?.uri ? (
                  <a 
                    key={idx} 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="bg-white p-1 rounded shadow-sm">
                      <img src={`https://www.google.com/s2/favicons?domain=${chunk.web.uri}`} alt="" className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate dark:text-gray-200">{chunk.web.title}</p>
                      <p className="text-xs text-gray-400 truncate">{chunk.web.uri}</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-400 ml-auto shrink-0" />
                  </a>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Resources;
