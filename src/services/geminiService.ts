import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { EducationLevel, QuizResult, Language, Message, StudyPlan, ChatMode } from '../types';

// Helper to get AI instance ensures fresh config if env changes
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key is missing. Please ensure GEMINI_API_KEY is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Robust retry wrapper for API calls to handle transient 500/network errors
const callAI = async <T>(apiCall: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const isRetryable = error.status === 500 || 
                        error.status === 503 || 
                        error.message?.includes('xhr error') || 
                        error.message?.includes('fetch failed') ||
                        error.message?.includes('Load failed');
                        
    if (retries > 0 && isRetryable) {
      console.warn(`API call failed (Status: ${error.status || 'Network'}), retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAI(apiCall, retries - 1, delay * 2);
    }
    throw error;
  }
};

const cleanJsonString = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  return cleaned.trim();
};

export const generateSummary = async (
  content: string,
  level: EducationLevel,
  language: Language,
  mode: 'standard' | 'exam_review',
  file?: { data: string, mimeType: string }
): Promise<string> => {
  let prompt = "";
  if (mode === 'exam_review') {
    prompt = `Create a comprehensive Exam Review. Target audience: ${level} student. Language: ${language}.
    Structure: 
    1. Key Concepts
    2. Critical Definitions
    3. Common Pitfalls
    4. Quick Revision Checklist.
    Use Markdown formatting.`;
  } else {
    prompt = `Summarize the following content for a ${level} student in ${language}. 
    Focus on key concepts, definitions, and actionable takeaways. Use Markdown.`;
  }

  const parts: any[] = [];
  if (file) {
    parts.push({ 
      inlineData: { 
        mimeType: file.mimeType, 
        data: file.data 
      } 
    });
  }
  parts.push({ text: `${prompt}\n\nContent:\n${content}` });

  try {
    const ai = getAI();
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }
    }));
    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Summary generation error:", error);
    throw error;
  }
};

export const quickSearch = async (query: string, language: Language): Promise<{text: string, links: any[]}> => {
  try {
    const ai = getAI();
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a concise explanation and summary for: "${query}" in ${language}. Use grounded information if possible.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }));

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { 
      text: response.text || "No results found.", 
      links: links 
    };
  } catch (error: any) {
    console.warn("Search grounding failed (403/503/Other). Falling back to standard generation.", error);
    try {
      const ai = getAI();
      const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a concise explanation and summary for: "${query}" in ${language}.`,
      }));
      return {
        text: response.text || "No results found (Fallback).",
        links: []
      };
    } catch (fallbackError) {
       console.error("Fallback search error:", fallbackError);
       const errorMsg = language === Language.AR 
         ? "عذراً، حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً." 
         : "Sorry, an error occurred while searching. Please try again later.";
       return {
         text: errorMsg,
         links: []
       };
    }
  }
};

export const generateQuiz = async (
  topic: string,
  level: EducationLevel,
  count: number,
  language: Language
): Promise<QuizResult> => {
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            type: { 
              type: Type.STRING, 
              enum: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'matching', 'table'] 
            },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            matchingPairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { left: { type: Type.STRING }, right: { type: Type.STRING } }
              }
            },
            tableHeaders: { type: Type.ARRAY, items: { type: Type.STRING } },
            tableRows: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              } 
            },
            explanation: { type: Type.STRING }
          },
          required: ['question', 'type']
        }
      }
    },
    required: ['title', 'questions']
  };

  const prompt = `Create a diverse quiz about "${topic}" for ${level} level students in ${language}. 
  Generate ${count} questions. 
  Rules:
  1. Mix question types: multiple_choice, true_false, fill_blank, matching, and table.
  2. For 'matching', provide 'matchingPairs'.
  3. For 'table', provide 'tableHeaders' and 'tableRows' (full correct content). The user will fill in blanks.
  4. For 'true_false' in Arabic, use options ["صحيح", "خطأ"].
  5. Ensure strict JSON format matching the schema.`;

  try {
    const ai = getAI();
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No quiz generated");
    
    const cleanText = cleanJsonString(text);
    return JSON.parse(cleanText) as QuizResult;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

export const evaluateQuiz = async (
  topic: string,
  level: EducationLevel,
  score: number,
  total: number,
  incorrectQuestions: string[],
  language: Language
): Promise<{ note: string, reviewTopics: string[] }> => {
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      note: { type: Type.STRING, description: "A encouraging note and general observation about the performance." },
      reviewTopics: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of specific topics the student needs to review based on mistakes."
      }
    },
    required: ['note', 'reviewTopics']
  };

  const prompt = `The student took a quiz on "${topic}" (Level: ${level}).
  Score: ${score}/${total}.
  The student made mistakes on these questions: ${JSON.stringify(incorrectQuestions)}.
  
  Provide:
  1. A constructive, encouraging note in ${language}.
  2. A list of 3-5 specific topics they should review to improve.`;

  try {
    const ai = getAI();
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const text = response.text;
    if (!text) return { note: "Good effort!", reviewTopics: [] };
    
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Evaluation error:", error);
    return { note: "Error generating feedback.", reviewTopics: [] };
  }
};

export const generateStudyPlan = async (
  subjects: string,
  hoursPerDay: number,
  goal: string,
  language: Language
): Promise<StudyPlan> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      schedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ['time', 'subject', 'activity']
              }
            }
          },
          required: ['day', 'sessions']
        }
      }
    },
    required: ['title', 'schedule']
  };

  const prompt = `Create a 1-week structured study plan.
  Subjects: ${subjects}.
  Available hours per day: ${hoursPerDay}.
  Goal: ${goal}.
  Language: ${language}.
  Return valid JSON matching the schema.`;

  try {
    const ai = getAI();
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No plan generated");
    
    const data = JSON.parse(cleanJsonString(text));
    return { ...data, createdAt: Date.now(), id: Date.now().toString() };
  } catch (error) {
    console.error("Plan generation error:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  history: Message[], 
  newMessage: string, 
  language: Language,
  attachment?: { data: string, mimeType: string },
  mode: ChatMode = 'normal'
): Promise<string> => {
  const ai = getAI();
  
  const previousHistory = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.attachment) {
       parts.unshift({
         inlineData: {
           data: msg.attachment.data,
           mimeType: msg.attachment.mimeType
         }
       });
    }
    return {
      role: msg.role,
      parts: parts
    };
  });

  let systemInstruction = `You are an intelligent educational tutor designed by Mohammed Amin Khodari.
      
  IDENTITY INFORMATION (Use this if asked about your creator):
  - Designer Name: Mohammed Amin Khodari (محمد امين خضري).
  - Designer Age: 14 years old (14 سنة).
  - Designer School: Isbanen Middle School (الثانوية الإعدادية إصبانن).

  Current Language: ${language}.`;

  let tools: any[] | undefined = undefined;
  let thinkingConfig: any | undefined = undefined;
  let model = 'gemini-2.5-flash';

  switch (mode) {
    case 'thinking':
      systemInstruction += `\nMODE: DEEP THINKING. Think step-by-step. Provide a very thorough, reasoned answer. Explain your logic clearly.`;
      thinkingConfig = { thinkingBudget: 2048 }; 
      break;
    
    case 'research':
      systemInstruction += `\nMODE: DEEP RESEARCH. Provide a detailed, report-style response. Include structure, headings, and comprehensive details.`;
      model = 'gemini-2.0-pro-exp-02-05'; 
      break;
    
    case 'study':
      systemInstruction += `\nMODE: STUDY & LEARN. Act as a Socratic tutor. Explain concepts clearly, give examples, and verify understanding. Break down complex topics into digestable parts.`;
      break;
    
    case 'search':
      tools = [{ googleSearch: {} }];
      model = 'gemini-2.5-flash';
      systemInstruction += `\nMODE: WEB SEARCH. Use the Google Search tool to find the latest real-time information.`;
      break;

    default:
      systemInstruction += `\nBe encouraging, clear, and concise.`;
  }

  const createChat = (modelName: string, configOverrides: any = {}) => {
    return ai.chats.create({
      model: modelName,
      history: previousHistory,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        thinkingConfig: thinkingConfig,
        ...configOverrides
      }
    });
  };

  const msgParts: any[] = [{ text: newMessage }];
  if (attachment) {
    msgParts.unshift({
      inlineData: {
        data: attachment.data,
        mimeType: attachment.mimeType
      }
    });
  }

  try {
    const chat = createChat(model);
    const response = await callAI<GenerateContentResponse>(() => chat.sendMessage({ message: msgParts as any }));
    
    let finalText = response.text || "";

    if (mode === 'search') {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        finalText += "\n\n**Sources:**\n";
        chunks.forEach((chunk: any) => {
           if (chunk.web?.uri && chunk.web?.title) {
             finalText += `- [${chunk.web.title}](${chunk.web.uri})\n`;
           }
        });
      }
    }

    return finalText;

  } catch (error: any) {
    console.error("Chat error:", error);
    
    const isErrorRecoverable = 
        error.status === 403 || 
        error.status === 503 || 
        error.status === 404 || 
        error.message?.includes('Permission') || 
        error.message?.includes('Unavailable') || 
        error.message?.includes('quota');

    if (isErrorRecoverable) {
       console.warn(`Model/tool unavailable (Error ${error.status}). Falling back to standard model.`);
       try {
         const fallbackChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: previousHistory,
            config: {
                systemInstruction: systemInstruction,
            }
         });
         
         const fallbackResponse = await callAI<GenerateContentResponse>(() => fallbackChat.sendMessage({ message: msgParts as any }));
         const note = language === Language.AR 
            ? `\n\n*(ملاحظة: الميزات المتقدمة غير متوفرة حالياً، تم استخدام النموذج القياسي.)*`
            : `\n\n*(Note: Advanced features were unavailable. Falling back to standard AI.)*`;
            
         return (fallbackResponse.text || "") + note;
       } catch (retryError) {
         console.error("Fallback chat failed:", retryError);
         throw retryError; 
       }
    }
    
    throw error;
  }
};

export const speakText = async (text: string, language: Language): Promise<AudioBuffer | null> => {
  try {
    const ai = getAI();
    const voiceName = 'Kore'; 

    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from Gemini TTS");

    const decodePCM = (
      data: Uint8Array,
      ctx: AudioContext,
      sampleRate: number,
      numChannels: number
    ): AudioBuffer => {
       const dataInt16 = new Int16Array(data.buffer);
       const frameCount = dataInt16.length / numChannels;
       const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

       for (let channel = 0; channel < numChannels; channel++) {
         const channelData = buffer.getChannelData(channel);
         for (let i = 0; i < frameCount; i++) {
           channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
         }
       }
       return buffer;
    };

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    return decodePCM(bytes, outputAudioContext, 24000, 1);

  } catch (error) {
    console.warn("Gemini TTS failed, using browser fallback:", error);
    
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0; 

      utterance.onend = () => resolve(null);
      utterance.onerror = () => resolve(null);

      window.speechSynthesis.speak(utterance);
    });
  }
};
