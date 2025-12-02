import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { EducationLevel, QuizResult, Language, Message, StudyPlan, ChatMode } from '../types';

// Helper to get AI instance ensures fresh config if env changes
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key is missing. Please ensure GEMINI_API_KEY is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Robust retry wrapper for API calls
const callAI = async <T>(apiCall: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const isRetryable = error.status === 500 || 
                        error.status === 503 || 
                        error.message?.includes('xhr error') || 
                        error.message?.includes('fetch failed');
                        
    if (retries > 0 && isRetryable) {
      console.warn(`API call failed, retrying... (${retries} attempts left)`);
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

// --- Summary Generation ---
export const generateSummary = async (
  content: string,
  level: EducationLevel,
  language: Language,
  mode: 'standard' | 'exam_review',
  file?: { data: string, mimeType: string }
): Promise<string> => {
  let prompt = "";
  if (mode === 'exam_review') {
    prompt = `Create a comprehensive Exam Review. Target audience: ${level} student. Language: ${language}. Structure: 1. Key Concepts 2. Critical Definitions 3. Common Pitfalls 4. Quick Revision Checklist. Use Markdown formatting.`;
  } else {
    prompt = `Summarize the following content for a ${level} student in ${language}. Focus on key concepts, definitions, and actionable takeaways. Use Markdown.`;
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
    // FIXED MODEL NAME
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: { parts }
    }));
    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Summary generation error:", error);
    throw error;
  }
};

// --- Quick Search ---
export const quickSearch = async (query: string, language: Language): Promise<{text: string, links: any[]}> => {
  try {
    const ai = getAI();
    // FIXED MODEL NAME
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Provide a concise explanation and summary for: "${query}" in ${language}. Use grounded information if possible.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }));

    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "No results found.", links: links };
  } catch (error: any) {
    console.warn("Search grounding failed, fallback to standard.", error);
    try {
      const ai = getAI();
      // FIXED MODEL NAME
      const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Provide a concise explanation and summary for: "${query}" in ${language}.`,
      }));
      return { text: response.text || "No results found (Fallback).", links: [] };
    } catch (fallbackError) {
       return { text: "Error searching.", links: [] };
    }
  }
};

// --- Quiz Generation ---
export const generateQuiz = async (topic: string, level: EducationLevel, count: number, language: Language): Promise<QuizResult> => {
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
            type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'matching', 'table'] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            matchingPairs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { left: { type: Type.STRING }, right: { type: Type.STRING } } } },
            tableHeaders: { type: Type.ARRAY, items: { type: Type.STRING } },
            tableRows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
            explanation: { type: Type.STRING }
          },
          required: ['question', 'type']
        }
      }
    },
    required: ['title', 'questions']
  };

  const prompt = `Create a quiz about "${topic}" for ${level} level in ${language}. Generate ${count} questions. Return JSON.`;

  try {
    const ai = getAI();
    // FIXED MODEL NAME
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    }));

    const text = response.text;
    if (!text) throw new Error("No quiz generated");
    return JSON.parse(cleanJsonString(text)) as QuizResult;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

// --- Evaluate Quiz ---
export const evaluateQuiz = async (topic: string, level: EducationLevel, score: number, total: number, incorrectQuestions: string[], language: Language): Promise<{ note: string, reviewTopics: string[] }> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      note: { type: Type.STRING },
      reviewTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['note', 'reviewTopics']
  };

  const prompt = `Student took quiz on "${topic}". Score: ${score}/${total}. Mistakes: ${JSON.stringify(incorrectQuestions)}. Provide encouraging note in ${language} and review topics.`;

  try {
    const ai = getAI();
    // FIXED MODEL NAME
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    }));
    const text = response.text;
    if (!text) return { note: "Good effort!", reviewTopics: [] };
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    return { note: "Error generating feedback.", reviewTopics: [] };
  }
};

// --- Study Plan ---
export const generateStudyPlan = async (subjects: string, hoursPerDay: number, goal: string, language: Language): Promise<StudyPlan> => {
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
                properties: { time: { type: Type.STRING }, subject: { type: Type.STRING }, activity: { type: Type.STRING }, notes: { type: Type.STRING } },
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

  const prompt = `Create 1-week study plan. Subjects: ${subjects}. Hours/day: ${hoursPerDay}. Goal: ${goal}. Language: ${language}. Return JSON.`;

  try {
    const ai = getAI();
    // FIXED MODEL NAME
    const response = await callAI<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema }
    }));
    const text = response.text;
    if (!text) throw new Error("No plan generated");
    const data = JSON.parse(cleanJsonString(text));
    return { ...data, createdAt: Date.now(), id: Date.now().toString() };
  } catch (error) {
    console.error("Plan error:", error);
    throw error;
  }
};

// --- Text Chat ---
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
       parts.unshift({ inlineData: { data: msg.attachment.data, mimeType: msg.attachment.mimeType } });
    }
    return { role: msg.role, parts: parts };
  });

  let systemInstruction = `You are an AI Tutor. Language: ${language}.`;
  let model = 'gemini-1.5-flash'; // FIXED MODEL

  if (mode === 'research') model = 'gemini-1.5-pro'; // FIXED MODEL FOR RESEARCH
  if (mode === 'thinking') systemInstruction += ` Think step-by-step.`;

  const msgParts: any[] = [{ text: newMessage }];
  if (attachment) {
    msgParts.unshift({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
  }

  try {
    const chat = ai.chats.create({
      model: model,
      history: previousHistory,
      config: { systemInstruction }
    });
    const response = await callAI<GenerateContentResponse>(() => chat.sendMessage({ message: msgParts as any }));
    return response.text || "";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

// --- Text to Speech ---
export const speakText = async (text: string, language: Language): Promise<AudioBuffer | null> => {
    // Basic browser fallback since 2.5-flash-tts is not public yet
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(null); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onend = () => resolve(null);
      utterance.onerror = () => resolve(null);
      window.speechSynthesis.speak(utterance);
    });
};
