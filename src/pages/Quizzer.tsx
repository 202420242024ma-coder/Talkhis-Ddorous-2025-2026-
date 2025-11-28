import React, { useState } from 'react';
import { Language, EducationLevel, QuizResult, QuizQuestion } from '../types';
import { generateQuiz, evaluateQuiz } from '../services/geminiService';
import { addXP, checkAchievements } from '../services/gamificationService';
import { CheckCircle, HelpCircle, Loader2, AlertCircle, Save, Check, XCircle, Sparkles, BookOpen, Grid3X3, Printer } from 'lucide-react';

interface Props {
  lang: Language;
}

const Quizzer: React.FC<Props> = ({ lang }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [level, setLevel] = useState<EducationLevel>(EducationLevel.HIGH);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ note: string, reviewTopics: string[] } | null>(null);

  const t = {
    [Language.AR]: { title: 'مولد الاختبارات الآلي', topicLabel: 'موضوع الاختبار', topicPlaceholder: 'مثال: الحرب العالمية الثانية، الجبر...', levelLabel: 'المستوى الدراسي', countLabel: 'عدد الأسئلة', generateBtn: 'إنشاء الاختبار', submitBtn: 'تأكيد الإجابات والحصول على النتيجة', matchSelect: 'اختر الإجابة...', correctMatches: 'الإجابات الصحيحة', writeAnswer: 'اكتب إجابتك هنا...', idealAnswer: 'الإجابة النموذجية', yourAnswer: 'إجابتك', correct: 'إجابة صحيحة', incorrect: 'إجابة خاطئة', matchItems: 'صل بين العناصر في القائمة اليمنى وما يناسبها في اليسرى', fillTable: 'أكمل البيانات الناقصة في الجدول', explanation: 'شرح', score: 'النتيجة النهائية', reset: 'اختبار جديد', save: 'حفظ الاختبار', print: 'طباعة / PDF', feedbackTitle: 'تحليل الأداء والمراجعة', reviewList: 'ما يجب عليك مراجعته:', analyzing: 'جاري تصحيح الاختبار وتحليل الإجابات...', saveError: 'فشل الحفظ. المساحة ممتلئة.', levels: { [EducationLevel.PRIMARY]: 'ابتدائي', [EducationLevel.MIDDLE]: 'إعدادي', [EducationLevel.HIGH]: 'ثانوي', [EducationLevel.UNIVERSITY]: 'جامعي' }, types: { multiple_choice: 'اختيار من متعدد', true_false: 'صحيح / خطأ', fill_blank: 'أكمل الفراغ', short_answer: 'سؤال مقالي', matching: 'مطابقة', table: 'جدول' } },
    [Language.EN]: { title: 'Automated Quiz Generator', topicLabel: 'Quiz Topic', topicPlaceholder: 'e.g., WWII, Algebra...', levelLabel: 'Education Level', countLabel: 'Question Count', generateBtn: 'Generate Quiz', submitBtn: 'Submit & Get Results', matchSelect: 'Select match...', correctMatches: 'Correct matches', writeAnswer: 'Write your answer here...', idealAnswer: 'Ideal Answer', yourAnswer: 'Your Answer', correct: 'Correct Answer', incorrect: 'Incorrect Answer', matchItems: 'Match the items on the left with the right', fillTable: 'Fill in the missing table data', explanation: 'Explanation', score: 'Final Score', reset: 'New Quiz', save: 'Save Quiz', print: 'Print / PDF', feedbackTitle: 'Performance Analysis', reviewList: 'Topics to Review:', analyzing: 'Grading and Analyzing...', saveError: 'Failed to save. Storage full.', levels: { [EducationLevel.PRIMARY]: 'Primary', [EducationLevel.MIDDLE]: 'Middle School', [EducationLevel.HIGH]: 'High School', [EducationLevel.UNIVERSITY]: 'University' }, types: { multiple_choice: 'Multiple Choice', true_false: 'True / False', fill_blank: 'Fill in the Blank', short_answer: 'Short Answer', matching: 'Matching', table: 'Table' } },
    [Language.FR]: { title: 'Générateur de Quiz Automatisé', topicLabel: 'Sujet du Quiz', topicPlaceholder: 'ex: Seconde Guerre mondiale...', levelLabel: 'Niveau d\'éducation', countLabel: 'Nombre de questions', generateBtn: 'Générer le Quiz', submitBtn: 'Soumettre et Voir Résultats', matchSelect: 'Sélectionnez...', correctMatches: 'Correspondances correctes', writeAnswer: 'Écrivez votre réponse ici...', idealAnswer: 'Réponse idéale', yourAnswer: 'Votre réponse', correct: 'Bonne réponse', incorrect: 'Mauvaise réponse', matchItems: 'Associez les éléments', fillTable: 'Remplir les données manquantes', explanation: 'Explication', score: 'Note Finale', reset: 'Nouveau Quiz', save: 'Sauvegarder', print: 'Imprimer / PDF', feedbackTitle: 'Analyse des Performances', reviewList: 'À réviser :', analyzing: 'Correction et Analyse...', saveError: 'Échec de sauvegarde.', levels: { [EducationLevel.PRIMARY]: 'Primaire', [EducationLevel.MIDDLE]: 'Collège', [EducationLevel.HIGH]: 'Lycée', [EducationLevel.UNIVERSITY]: 'Université' }, types: { multiple_choice: 'Choix multiple', true_false: 'Vrai / Faux', fill_blank: 'Remplir le blanc', short_answer: 'Réponse courte', matching: 'Correspondance', table: 'Tableau' } },
    [Language.ES]: { title: 'Generador de Cuestionarios', topicLabel: 'Tema', topicPlaceholder: 'ej: Historia...', levelLabel: 'Nivel', countLabel: 'Preguntas', generateBtn: 'Generar', submitBtn: 'Enviar y Ver Resultados', matchSelect: 'Seleccionar...', correctMatches: 'Correcto', writeAnswer: 'Escribe aquí...', idealAnswer: 'Respuesta ideal', yourAnswer: 'Tu respuesta', correct: 'Correcto', incorrect: 'Incorrecto', matchItems: 'Empareja los elementos', fillTable: 'Rellenar la tabla', explanation: 'Explicación', score: 'Nota Final', reset: 'Nuevo', save: 'Guardar', print: 'Imprimir / PDF', feedbackTitle: 'Análisis', reviewList: 'Para revisar:', analyzing: 'Analizando...', saveError: 'Error al guardar.', levels: { [EducationLevel.PRIMARY]: 'Primaria', [EducationLevel.MIDDLE]: 'Secundaria', [EducationLevel.HIGH]: 'Bachillerato', [EducationLevel.UNIVERSITY]: 'Universidad' }, types: { multiple_choice: 'Opción múltiple', true_false: 'Verdadero / Falso', fill_blank: 'Rellenar', short_answer: 'Respuesta corta', matching: 'Emparejamiento', table: 'Tabla' } }
  }[lang];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuiz(null);
    setShowResults(false);
    setFeedback(null);
    setAnswers({});
    setError(null);

    try {
      const result = await generateQuiz(topic, level, count, lang);
      setQuiz(result);
    } catch (e) {
      console.error(e);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (idx: number, val: any) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [idx]: val }));
  };

  const handleMatchingAnswerChange = (qIdx: number, leftItem: string, rightItem: string) => {
    if (showResults) return;
    setAnswers(prev => {
      const current = prev[qIdx] || {};
      return { ...prev, [qIdx]: { ...current, [leftItem]: rightItem } };
    });
  };

  const handleTableAnswerChange = (qIdx: number, rowIdx: number, colIdx: number, val: string) => {
    if (showResults) return;
    setAnswers(prev => {
      const current = prev[qIdx] || {};
      const key = `${rowIdx}-${colIdx}`;
      return { ...prev, [qIdx]: { ...current, [key]: val } };
    });
  };

  const calculateRawScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      
      if (q.type === 'matching') {
         let allCorrect = true;
         if (!q.matchingPairs || q.matchingPairs.length === 0) return;
         q.matchingPairs.forEach(pair => {
            if (userAnswer?.[pair.left] !== pair.right) allCorrect = false;
         });
         if (allCorrect) score++;
      } else if (q.type === 'table') {
         let allCorrect = true;
         q.tableRows?.forEach((row, rIdx) => {
           row.forEach((cell, cIdx) => {
             const isBlank = (rIdx + cIdx) % 3 === 1;
             if (isBlank) {
                const key = `${rIdx}-${cIdx}`;
                const userVal = userAnswer?.[key];
                if (String(userVal).toLowerCase().trim() !== String(cell).toLowerCase().trim()) {
                  allCorrect = false;
                }
             }
           });
         });
         if (allCorrect) score++;
      } else if (q.type === 'short_answer') {
        if (userAnswer && String(userAnswer).trim().length > 3) score++; 
      } else {
        if (String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()) {
          score++;
        }
      }
    });
    return score;
  };

  const getScaledScore = () => {
    if (!quiz) return { score: 0, total: 0 };
    const raw = calculateRawScore();
    const totalQuestions = quiz.questions.length;
    
    const maxScore = level === EducationLevel.PRIMARY ? 10 : 20;
    const scaled = Math.round((raw / totalQuestions) * maxScore * 10) / 10;

    return { score: scaled, max: maxScore, raw, totalQuestions };
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    setAnalyzing(true);
    setShowResults(true);
    
    addXP(100);
    checkAchievements('quiz');

    const incorrectQuestions: string[] = [];
    quiz.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      let isCorrect = false;
      
      if (q.type === 'matching') {
         isCorrect = q.matchingPairs?.every(p => userAnswer?.[p.left] === p.right) ?? false;
      } else if (q.type === 'table') {
         isCorrect = true; 
         q.tableRows?.forEach((row, rIdx) => {
           row.forEach((cell, cIdx) => {
             if ((rIdx + cIdx) % 3 === 1) {
                if (String(userAnswer?.[`${rIdx}-${cIdx}`]).toLowerCase().trim() !== String(cell).toLowerCase().trim()) isCorrect = false;
             }
           });
         });
      } else if (q.type === 'short_answer') {
         isCorrect = (userAnswer && String(userAnswer).length > 2); 
      } else {
         isCorrect = String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim();
      }

      if (!isCorrect) {
        incorrectQuestions.push(`Q: ${q.question} (Type: ${q.type})`);
      }
    });

    try {
      const { score, max } = getScaledScore();
      const aiFeedback = await evaluateQuiz(
        quiz.title,
        level,
        score,
        max,
        incorrectQuestions,
        lang
      );
      setFeedback(aiFeedback);
    } catch (e) {
      console.error("Feedback generation failed", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!quiz) return;
    try {
      const existing = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const toSave: QuizResult = { ...quiz, createdAt: Date.now() }; 
      
      const newHistory = [toSave, ...existing].slice(0, 20);
      
      localStorage.setItem('quizzes', JSON.stringify(newHistory));
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(t.saveError);
    }
  };

  const handlePrint = () => {
    if (!quiz) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      let contentHtml = '';

      if (showResults) {
          const score = getScaledScore();
          contentHtml += `
            <div class="score-box">
                <h2>${t.score}: ${score.score} / ${score.max}</h2>
            </div>
            ${feedback ? `<div class="feedback"><h3>${t.feedbackTitle}</h3><p>${feedback.note}</p></div>` : ''}
          `;
      }

      contentHtml += '<div class="questions">';
      quiz.questions.forEach((q, idx) => {
          contentHtml += `<div class="question-item">
            <h4>${idx + 1}. ${q.question} <span class="type-tag">(${t.types[q.type] || q.type})</span></h4>
          `;

          if (q.type === 'multiple_choice' || q.type === 'true_false') {
             contentHtml += '<ul>';
             q.options?.forEach(opt => {
                 const isSelected = answers[idx] === opt;
                 const isCorrect = showResults && opt === q.correctAnswer;
                 let style = '';
                 if (showResults) {
                     if (isCorrect) style = 'color: green; font-weight: bold;';
                     else if (isSelected && !isCorrect) style = 'color: red; text-decoration: line-through;';
                 }
                 contentHtml += `<li style="${style}">${isSelected ? '●' : '○'} ${opt}</li>`;
             });
             contentHtml += '</ul>';
          } else if (q.type === 'matching') {
              contentHtml += '<div class="matching-grid">';
              q.matchingPairs?.forEach(pair => {
                  const userVal = answers[idx]?.[pair.left] || '';
                  contentHtml += `<div>${pair.left} -> ________ ${showResults ? `(Correct: ${pair.right})` : ''} <span style="color:blue">${userVal ? `[Your Answer: ${userVal}]` : ''}</span></div>`;
              });
              contentHtml += '</div>';
          } else if (q.type === 'table') {
               contentHtml += '<table border="1" style="border-collapse: collapse; width: 100%; margin-top: 10px;"><thead><tr>';
               q.tableHeaders?.forEach(h => contentHtml += `<th style="padding: 5px;">${h}</th>`);
               contentHtml += '</tr></thead><tbody>';
               q.tableRows?.forEach((row, rIdx) => {
                   contentHtml += '<tr>';
                   row.forEach((cell, cIdx) => {
                        const isBlank = (rIdx + cIdx) % 3 === 1;
                        const userVal = answers[idx]?.[`${rIdx}-${cIdx}`] || '';
                        if (isBlank) {
                            contentHtml += `<td style="padding: 5px;">${showResults ? cell : '_______'} <br/><small style="color:gray">${userVal}</small></td>`;
                        } else {
                            contentHtml += `<td style="padding: 5px;">${cell}</td>`;
                        }
                   });
                   contentHtml += '</tr>';
               });
               contentHtml += '</tbody></table>';
          } else {
              const val = answers[idx] || '';
              contentHtml += `<div class="answer-box" style="margin-top:10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Answer: ${val}</div>`;
              if (showResults) {
                  contentHtml += `<div class="correct-answer" style="color:green; margin-top:5px;">Correct: ${q.correctAnswer}</div>`;
              }
          }

          contentHtml += '</div>';
      });
      contentHtml += '</div>';

      printWindow.document.write(`
        <html dir="${lang === Language.AR ? 'rtl' : 'ltr'}">
          <head>
            <title>${quiz.title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #4F46E5; text-align: center;}
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .question-item { margin-bottom: 20px; page-break-inside: avoid; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
              .type-tag { font-size: 0.8em; color: #888; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
              ul { list-style: none; padding-left: 0; }
              li { margin-bottom: 5px; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
              .score-box { text-align: center; border: 2px solid #4F46E5; padding: 10px; border-radius: 10px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
                <h1>${quiz.title}</h1>
                <p>${(t as any).levels[level]} | ${new Date().toLocaleDateString()}</p>
            </div>
            ${contentHtml}
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

  const renderQuestionInput = (q: QuizQuestion, idx: number) => {
    const userAnswer = answers[idx];
    const inputBaseClass = "w-full p-3 rounded-lg border-2 transition-all outline-none ";

    switch (q.type) {
      case 'multiple_choice':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options?.map((opt, optIdx) => (
              <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                userAnswer === opt 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${showResults && opt === q.correctAnswer ? '!border-green-500 !bg-green-100' : ''} 
                ${showResults && userAnswer === opt && userAnswer !== q.correctAnswer ? '!border-red-500 !bg-red-100' : ''}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${userAnswer === opt ? 'border-primary' : 'border-gray-300'}`}>
                  {userAnswer === opt && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                </div>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={opt}
                  checked={userAnswer === opt}
                  onChange={() => handleAnswerChange(idx, opt)}
                  disabled={showResults}
                  className="hidden"
                />
                <span className="font-medium dark:text-gray-200">{opt}</span>
                {showResults && opt === q.correctAnswer && <CheckCircle size={20} className="text-green-600 ml-auto" />}
                {showResults && userAnswer === opt && userAnswer !== q.correctAnswer && <XCircle size={20} className="text-red-500 ml-auto" />}
              </label>
            ))}
          </div>
        );

      case 'true_false':
        let tfOptions = q.options;
        if (!tfOptions || tfOptions.length === 0) {
           if (lang === Language.AR) tfOptions = ['صحيح', 'خطأ'];
           else if (lang === Language.FR) tfOptions = ['Vrai', 'Faux'];
           else if (lang === Language.ES) tfOptions = ['Verdadero', 'Falso'];
           else tfOptions = ['True', 'False'];
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {tfOptions.map((opt, optIdx) => (
              <label key={optIdx} className={`flex items-center justify-center gap-2 p-6 rounded-xl border-2 cursor-pointer transition-all text-lg font-bold ${
                userAnswer === opt 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${showResults && opt === q.correctAnswer ? '!border-green-500 !bg-green-50 !text-green-700' : ''} 
                ${showResults && userAnswer === opt && userAnswer !== q.correctAnswer ? '!border-red-500 !bg-red-50 !text-red-700' : ''}`}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={opt}
                  checked={userAnswer === opt}
                  onChange={() => handleAnswerChange(idx, opt)}
                  disabled={showResults}
                  className="hidden"
                />
                <span>{opt}</span>
                {showResults && opt === q.correctAnswer && <CheckCircle size={20} />}
                {showResults && userAnswer === opt && userAnswer !== q.correctAnswer && <XCircle size={20} />}
              </label>
            ))}
          </div>
        );

      case 'fill_blank':
        const isBlankCorrect = showResults && String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLower
