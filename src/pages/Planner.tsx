import React, { useState } from 'react';
import { Language, StudyPlan } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { addXP, checkAchievements } from '../services/gamificationService';
import { Calendar, Clock, Target, Loader2, Save, Check } from 'lucide-react';

interface Props {
  lang: Language;
}

const Planner: React.FC<Props> = ({ lang }) => {
  const [subjects, setSubjects] = useState('');
  const [hours, setHours] = useState(2);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  const t = {
    [Language.AR]: { title: 'منظم الدراسة الذكي', subtitle: 'أنشئ جدولاً دراسياً مخصصاً باستخدام الذكاء الاصطناعي', subjectsLabel: 'المواد التي تدرسها (افصل بفاصلة)', subjectsPlaceholder: 'مثال: الرياضيات، الفيزياء، اللغة العربية...', hoursLabel: 'ساعات الدراسة يومياً', goalLabel: 'هدفك (مثال: الاستعداد للامتحان، مراجعة عامة)', generateBtn: 'إنشاء الجدول', savedPlans: 'الخطط المحفوظة', day: 'اليوم', activity: 'النشاط', notes: 'ملاحظات' },
    [Language.EN]: { title: 'Smart Study Planner', subtitle: 'Create a custom study schedule using AI', subjectsLabel: 'Subjects (comma separated)', subjectsPlaceholder: 'e.g. Math, Physics, History...', hoursLabel: 'Study hours per day', goalLabel: 'Your Goal (e.g. Exam Prep, General Review)', generateBtn: 'Generate Plan', savedPlans: 'Saved Plans', day: 'Day', activity: 'Activity', notes: 'Notes' },
    [Language.FR]: { title: 'Planificateur Intelligent', subtitle: 'Créez un emploi du temps personnalisé avec l\'IA', subjectsLabel: 'Matières (séparées par virgule)', subjectsPlaceholder: 'ex: Maths, Physique...', hoursLabel: 'Heures d\'étude par jour', goalLabel: 'Votre objectif', generateBtn: 'Générer le Plan', savedPlans: 'Plans Enregistrés', day: 'Jour', activity: 'Activité', notes: 'Notes' },
    [Language.ES]: { title: 'Planificador de Estudio', subtitle: 'Crea un horario personalizado con IA', subjectsLabel: 'Asignaturas', subjectsPlaceholder: 'ej: Matemáticas, Historia...', hoursLabel: 'Horas al día', goalLabel: 'Tu Objetivo', generateBtn: 'Generar Plan', savedPlans: 'Planes Guardados', day: 'Día', activity: 'Actividad', notes: 'Notas' }
  }[lang];

  const handleGenerate = async () => {
    if (!subjects || !goal) return;
    setLoading(true);
    try {
      const result = await generateStudyPlan(subjects, hours, goal, lang);
      setPlan(result);
      addXP(75);
      checkAchievements('plan');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-8 rounded-2xl text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Calendar size={32} /> {t.title}</h2>
        <p className="opacity-90">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.subjectsLabel}</label><textarea value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder={t.subjectsPlaceholder} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white h-24 resize-none focus:ring-2 focus:ring-teal-500 outline-none" /></div>
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Clock size={16} /> {t.hoursLabel} ({hours})</label><input type="range" min="1" max="12" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500" /></div>
            <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Target size={16} /> {t.goalLabel}</label><input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" /></div>
            <button onClick={handleGenerate} disabled={loading || !subjects} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : t.generateBtn}</button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {plan ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="text-xl font-bold dark:text-white mb-4 text-teal-700 dark:text-teal-400">{plan.title}</h3>
                 <div className="space-y-4">
                    {plan.schedule.map((dayPlan, idx) => (
                      <div key={idx} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded w-fit px-4">{dayPlan.day}</h4>
                        <div className="grid gap-3 pl-2">
                          {dayPlan.sessions.map((session, sIdx) => (
                            <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-teal-200 transition-colors">
                               <div className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-bold px-3 py-1 rounded text-sm w-fit shrink-0">{session.time}</div>
                               <div className="flex-1"><div className="font-bold text-gray-800 dark:text-gray-200">{session.subject}</div><div className="text-sm text-gray-500 dark:text-gray-400">{session.activity}</div></div>
                               {session.notes && (<div className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-2 rounded max-w-xs">{session.notes}</div>)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400"><Calendar size={48} className="mb-4 opacity-50" /><p>{lang === Language.AR ? 'املأ النموذج لإنشاء جدولك' : 'Fill the form to generate your schedule'}</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planner;
