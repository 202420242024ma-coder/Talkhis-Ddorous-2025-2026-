import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Activity, Globe, AlertCircle, Send, Paperclip, X, Image as ImageIcon, Music, FileText, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface Props {
  initialLang?: Language;
}

const LiveTutor: React.FC<Props> = ({ initialLang = Language.AR }) => {
  const [isActive, setIsActive] = useState(false);
  const [statusKey, setStatusKey] = useState<string>('ready'); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [selectedLang, setSelectedLang] = useState<Language>(initialLang);
  
  // Multimodal Input State
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedLang(initialLang);
  }, [initialLang]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const translations = {
    [Language.AR]: {
      title: 'المعلم الصوتي الذكي (Live)',
      ready: 'جاهز للبدء',
      requesting: 'جاري طلب الميكروفون...',
      connecting: 'جاري الاتصال بالخادم...',
      listening: 'متصل - استمع إليك',
      disconnected: 'تم قطع الاتصال',
      error: 'حدث خطأ',
      permissionDenied: 'تم رفض إذن الميكروفون',
      connectionFailed: 'فشل الاتصال',
      start: 'ابدأ المحادثة الحية',
      end: 'إنهاء الجلسة',
      microError: 'يرجى السماح بصلاحية الميكروفون.',
      connError: 'فشل الاتصال. تأكد من الإنترنت أو المفتاح.',
      apiKeyMissing: 'مفتاح API مفقود',
      send: 'إرسال',
      attach: 'إرفاق',
      placeholder: 'أرسل نصاً أثناء الحديث...',
    },
    [Language.EN]: {
      title: 'Live AI Voice Tutor',
      ready: 'Ready to start',
      requesting: 'Requesting microphone...',
      connecting: 'Connecting...',
      listening: 'Connected - Listening',
      disconnected: 'Disconnected',
      error: 'Error',
      permissionDenied: 'Permission Denied',
      connectionFailed: 'Connection Failed',
      start: 'Start Live Chat',
      end: 'End Session',
      microError: 'Microphone permission denied.',
      connError: 'Connection failed.',
      apiKeyMissing: 'API Key Missing',
      send: 'Send',
      attach: 'Attach',
      placeholder: 'Type while talking...',
    },
    [Language.FR]: {
      title: 'Tuteur Vocal En Direct',
      ready: 'Prêt',
      requesting: 'Microphone...',
      connecting: 'Connexion...',
      listening: 'Connecté',
      disconnected: 'Déconnecté',
      error: 'Erreur',
      permissionDenied: 'Refusé',
      connectionFailed: 'Échec',
      start: 'Commencer',
      end: 'Terminer',
      microError: 'Micro refusé.',
      connError: 'Erreur connexion.',
      apiKeyMissing: 'Clé manquante',
      send: 'Envoyer',
      attach: 'Joindre',
      placeholder: 'Écrire...',
    },
    [Language.ES]: {
      title: 'Tutor en Vivo',
      ready: 'Listo',
      requesting: 'Micrófono...',
      connecting: 'Conectando...',
      listening: 'Escuchando',
      disconnected: 'Desconectado',
      error: 'Error',
      permissionDenied: 'Denegado',
      connectionFailed: 'Fallo',
      start: 'Comenzar',
      end: 'Terminar',
      microError: 'Permiso denegado.',
      connError: 'Error conexión.',
      apiKeyMissing: 'Falta clave',
      send: 'Enviar',
      attach: 'Adjuntar',
      placeholder: 'Escribir...',
    }
  };

  const t = translations[selectedLang];

  const startSession = async () => {
    setErrorMsg(null);
    // Use the correctly set environment variable
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
      setErrorMsg(t.apiKeyMissing);
      return;
    }

    let stream: MediaStream;

    try {
      setStatusKey('requesting');
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMsg(t.microError);
      setStatusKey('permissionDenied');
      return;
    }

    try {
      setStatusKey('connecting');
      const ai = new GoogleGenAI({ apiKey });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      await outputCtx.resume();
      await inputCtx.resume();

      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      const instructions = {
        [Language.AR]: 'أنت معلم ذكي ومساعد تعليمي. اسمك "المعلم الذكي". تحدث باللغة العربية بوضوح. كن ودوداً ومشجعاً. أجب باختصار ومباشرة لأن هذه محادثة صوتية.',
        [Language.EN]: 'You are a helpful AI Tutor. Speak clearly and concisely. Be encouraging.',
        [Language.FR]: 'Vous êtes un tuteur IA utile. Parlez clairement et soyez concis.',
        [Language.ES]: 'Eres un tutor de IA útil. Habla claro y sé conciso.'
      };

      // Connect to Live API using the correct Experimental Model
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp', // UPDATED MODEL NAME
        callbacks: {
          onopen: () => {
            setStatusKey('listening');
            setIsActive(true);
            
            // Setup Audio Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Volume visualization logic
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              setVolume(Math.min((sum / inputData.length) * 500, 100));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput([{ mimeType: pcmBlob.mimeType, data: pcmBlob.data }]);
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inline
