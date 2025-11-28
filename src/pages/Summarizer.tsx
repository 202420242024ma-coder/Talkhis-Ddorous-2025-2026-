import React, { useState } from 'react';
import { Language, EducationLevel, SummaryResult } from '../types';
import { generateSummary, speakText } from '../services/geminiService';
import { addXP, checkAchievements } from '../services/gamificationService';
import { FileText, Upload, Play, Loader2, FileImage, Mic, Download, Save, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  lang: Language;
}

const Summarizer: React.FC<Props> = ({ lang }) => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [level, setLevel] = useState<EducationLevel>(EducationLevel.HIGH);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = {
    [Language.AR]: { title: 'مولد الملخصات الذكي', examMode: 'وضع مراجعة الامتحانات', directText: 'نص مباشر', uploadFile: 'رفع ملف/صورة', pastePlaceholder: 'الصق نص الدرس هنا...', dropPlaceholder: 'اضغط لرفع صورة أو ملف PDF (OCR)', remove: 'إزالة', summarizeBtn: 'تلخيص الآن', summaryTitle: 'الملخص', examReviewTitle: 'مراجعة الامتحان', save: 'حفظ', listen: 'استماع', exportPdf: 'تصدير PDF', fileLabel: 'ملف', saveError: 'فشل الحفظ. الذاكرة ممتلئة.', error: 'حدث خطأ أثناء التلخيص. حاول مرة أخرى.', levels: { [EducationLevel.PRIMARY]: 'ابتدائي', [EducationLevel.MIDDLE]: 'إعدادي', [EducationLevel.HIGH]: 'ثانوي', [EducationLevel.UNIVERSITY]: 'جامعي' } },
    [Language.EN]: { title: 'Smart Summary Generator', examMode: 'Exam Review Mode', directText: 'Direct Text', uploadFile: 'Upload File', pastePlaceholder: 'Paste your lesson text here...', dropPlaceholder: 'Click to upload image/PDF (OCR)', remove: 'Remove', summarizeBtn: 'Summarize Now', summaryTitle: 'Summary', examReviewTitle: 'Exam Review', save: 'Save', listen: 'Listen', exportPdf: 'Export PDF', fileLabel: 'File', saveError: 'Failed to save. Storage full.', error: 'Error generating summary. Please try again.', levels: { [EducationLevel.PRIMARY]: 'Primary', [EducationLevel.MIDDLE]: 'Middle School', [EducationLevel.HIGH]: 'High School', [EducationLevel.UNIVERSITY]: 'University' } },
    [Language.FR]: { title: 'Générateur de Résumé Intelligent', examMode: 'Mode Révision Examen', directText: 'Texte Direct', uploadFile: 'Télécharger Fichier', pastePlaceholder: 'Collez le texte de votre leçon ici...', dropPlaceholder: 'Cliquez pour télécharger image/PDF (OCR)', remove: 'Supprimer', summarizeBtn: 'Résumer Maintenant', summaryTitle: 'Résumé', examReviewTitle: 'Révision d\'Examen', save: 'Sauvegarder', listen: 'Écouter', exportPdf: 'Exporter PDF', fileLabel: 'Fichier', saveError: 'Échec de sauvegarde.', error: 'Erreur lors de la génération. Veuillez réessayer.', levels: { [EducationLevel.PRIMARY]: 'Primaire', [EducationLevel.MIDDLE]: 'Collège', [EducationLevel.HIGH]: 'Lycée', [EducationLevel.UNIVERSITY]: 'Université' } },
    [Language.ES]: { title: 'Generador de Resúmenes Inteligente', examMode: 'Modo Revisión de Examen', directText: 'Texto Directo', uploadFile: 'Subir Archivo', pastePlaceholder: 'Pegue el texto de la lección aquí...', dropPlaceholder: 'Haga clic para subir imagen/PDF (OCR)', remove: 'Eliminar', summarizeBtn: 'Resumir Ahora', summaryTitle: 'Resumen', examReviewTitle: 'Revisión de Examen', save: 'Guardar', listen: 'Escuchar', exportPdf: 'Exportar PDF', fileLabel: 'Archivo', saveError: 'Error al guardar.', error: 'Error al generar el resumen. Inténtelo de nuevo.', levels: { [EducationLevel.PRIMARY]: 'Primaria', [EducationLevel.MIDDLE]: 'Secundaria', [EducationLevel.HIGH]: 'Bachillerato', [EducationLevel.UNIVERSITY]: 'Universidad' } }
  }[lang];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setUploadedFile({ data: res.split(',')[1], mimeType: file.type, name: file.name }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadedFile(null);
  };

  const handleSummarize = async () => {
    if (!text && !uploadedFile) return;
    setLoading(true);
    setSummary('');
    setSaved(false);
    setErrorMsg(null);
    try {
      const result = await generateSummary(
        text, 
        level, 
        lang, 
        isReviewMode ? 'exam_review' : 'standard',
        uploadedFile ? { data: uploadedFile.data, mimeType: uploadedFile.mimeType } : undefined
      );
      setSummary(result);
      addXP(50);
      checkAchievements('summary');
    } catch (error) {
      setSummary(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async () => {
    if (!summary || isPlaying) return;
    setIsPlaying(true);
    try {
      const audioBuffer = await speakText(summary, lang);
      if (audioBuffer) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
        source.onended = () => setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const handleSave = () => {
    try {
      const newSummary: SummaryResult = {
        id: Date.now().toString(),
        topic: isReviewMode ? t.examReviewTitle : (uploadedFile ? `File: ${uploadedFile.name}` : t.summaryTitle),
        content: summary,
        level: level,
        createdAt: Date.now()
      };
      
      const existing = JSON.parse(localStorage.getItem('summaries') || '[]');
      const newHistory = [newSummary, ...existing].slice(0, 20); // Keep last 20
      localStorage.setItem('summaries', JSON.stringify(newHistory));
      setSaved(true);
      setErrorMsg(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErrorMsg(t.saveError);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${lang === Language.AR ? 'rtl' : 'ltr'}">
          <head>
            <title>${t.title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #4F46E5; }
              pre { white-space: pre-wrap; font-family: sans-serif; line-height: 1.6; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>${isReviewMode ? t.examReviewTitle : t.summaryTitle}</h1>
            <p>${(t as any).levels[level]}</p>
            ${uploadedFile ? `<p>${t.fileLabel}: ${uploadedFile.name}</p>` : ''}
            <hr/>
            <pre>${summary}</pre>
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold dark:text-white">
          {t.title}
        </h2>
        <div className="flex gap-2 items-center">
           <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
             <input 
               type="checkbox" 
               checked={isReviewMode}
               onChange={(e) => setIsReviewMode(e.target.checked)}
               className="w-4 h-4 text-primary rounded"
             />
             <span className="text-sm font-medium dark:text-gray-200">
               {t.examMode}
             </span>
           </label>
           <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value as EducationLevel)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {Object.values(EducationLevel).map(l => <option key={l} value={l}>{(t as any).levels[l]}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex gap-4 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <button 
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputMode === 'text' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500'}`}
          >
            <FileText size={18} /> {t.directText}
          </button>
          <button 
             onClick={() => setInputMode('file')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputMode === 'file' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500'}`}
          >
            <Upload size={18} /> {t.uploadFile}
          </button>
        </div>

        {inputMode === 'text' ? (
          <textarea
            className="w-full h-48 p-4 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            placeholder={t.pastePlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center relative">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-primary">
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2 text-green-600">
                  <FileImage size={48} />
                  <span className="font-semibold">{uploadedFile.name}</span>
                  <button onClick={clearFile} className="mt-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-red-200">
                    <X size={12}/> {t.remove}
                  </button>
                </div>
              ) : (
                <>
                  <FileImage size={48} />
                  <span>{t.dropPlaceholder}</span>
                </>
              )}
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSummarize}
            disabled={loading || (!text && !uploadedFile)}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : t.summarizeBtn}
          </button>
        </div>
      </div>

      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            <h3 className="font-bold text-lg dark:text-white">
              {isReviewMode ? t.examReviewTitle : t.summaryTitle}
            </h3>
            <div className="flex items-center gap-2">
              {errorMsg && (
                <span className="text-red-500 text-xs flex items-center gap-1 font-bold">
                  <AlertCircle size={12}/> {errorMsg}
                </span>
              )}
              <button 
                onClick={handleSave}
                className={`p-2 rounded-full transition-colors ${saved ? 'text-green-500 bg-green-50' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={t.save}
              >
                {saved ? <Check size={20} /> : <Save size={20} />}
              </button>
              <button 
                onClick={handleExportPDF}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
                title={t.exportPdf}
              >
                <Download size={20} />
              </button>
              <button 
                onClick={handleTTS}
                disabled={isPlaying}
                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                title={t.listen}
              >
                {isPlaying ? <Loader2 className="animate-spin" size={20}/> : <Play size={20} />}
              </button>
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-gray-700 dark:text-gray-300">
              {summary}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summarizer;
