import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Activity, Globe, AlertCircle, Key } from 'lucide-react';
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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

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
      title: 'المعلم الصوتي الذكي',
      ready: 'جاهز للبدء',
      requesting: 'جاري طلب الميكروفون...',
      connecting: 'جاري الاتصال...',
      listening: 'متصل - استمع إليك',
      disconnected: 'تم قطع الاتصال',
      error: 'حدث خطأ',
      permissionDenied: 'تم رفض إذن الميكروفون',
      connectionFailed: 'فشل الاتصال',
      start: 'ابدأ التحدث',
      end: 'إنهاء الجلسة',
      microError: 'يرجى السماح بصلاحية الميكروفون.',
      connError: 'فشل الاتصال. تحقق من الإنترنت.',
      apiKeyMissing: 'مفتاح API مفقود'
    },
    [Language.EN]: {
      title: 'AI Voice Tutor',
      ready: 'Ready to start',
      requesting: 'Requesting microphone...',
      connecting: 'Connecting...',
      listening: 'Connected - Listening',
      disconnected: 'Disconnected',
      error: 'Error',
      permissionDenied: 'Permission Denied',
      connectionFailed: 'Connection Failed',
      start: 'Start Talking',
      end: 'End Session',
      microError: 'Microphone permission denied.',
      connError: 'Failed to connect. Check internet.',
      apiKeyMissing: 'API Key Missing'
    },
    [Language.FR]: {
      title: 'Tuteur Vocal IA',
      ready: 'Prêt à commencer',
      requesting: 'Demande du microphone...',
      connecting: 'Connexion en cours...',
      listening: 'Connecté - Écoute',
      disconnected: 'Déconnecté',
      error: 'Erreur',
      permissionDenied: 'Permission refusée',
      connectionFailed: 'Échec de connexion',
      start: 'Commencer à parler',
      end: 'Terminer la session',
      microError: 'Permission du microphone refusée.',
      connError: 'Échec de connexion. Vérifiez Internet.',
      apiKeyMissing: 'Clé API manquante'
    },
    [Language.ES]: {
      title: 'Tutor de Voz IA',
      ready: 'Listo para comenzar',
      requesting: 'Solicitando micrófono...',
      connecting: 'Conectando...',
      listening: 'Conectado - Escuchando',
      disconnected: 'Desconectado',
      error: 'Error',
      permissionDenied: 'Permiso denegado',
      connectionFailed: 'Conexión fallida',
      start: 'Empezar a hablar',
      end: 'Terminar sesión',
      microError: 'Permiso de micrófono denegado.',
      connError: 'Error de conexión. Verifique Internet.',
      apiKeyMissing: 'Falta la clave API'
    }
  };

  const t = translations[selectedLang];
  const langLabels = {
    [Language.AR]: 'العربية',
    [Language.EN]: 'English',
    [Language.FR]: 'Français',
    [Language.ES]: 'Español',
  };

  const startSession = async () => {
    setErrorMsg(null);
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setErrorMsg(t.apiKeyMissing);
      return;
    }

    let stream: MediaStream;

    try {
      setStatusKey('requesting');
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission error:", err);
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
        [Language.AR]: 'أنت معلم ذكي ومساعد تعليمي، تم تصميمك بواسطة "محمد امين خضري" (عمره 14 سنة، يدرس في الثانوية الإعدادية إصبانن). تحدث باللغة العربية الفصحى بوضوح. ساعد الطالب في فهم الدروس والإجابة على الأسئلة.',
        [Language.EN]: 'You are a helpful educational tutor designed by "Mohammed Amin Khodari" (14 years old, student at Isbanen Middle School). Speak in clear English. Help the student understand lessons and answer questions.',
        [Language.FR]: 'Vous êtes un tuteur IA intelligent conçu par "Mohammed Amin Khodari" (14 ans, étudiant au collège Isbanen). Parlez clairement en français. Aidez l\'étudiant à comprendre les leçons.',
        [Language.ES]: 'Eres un tutor inteligente de IA diseñado por "Mohammed Amin Khodari" (14 años, estudiante en la escuela secundaria Isbanen). Habla en español claro. Ayuda al estudiante a comprender las lecciones.'
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatusKey('listening');
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              setVolume(Math.min((sum / inputData.length) * 500, 100));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio, outputCtx);
            }
            
            if (msg.serverContent?.interrupted) {
              cancelAudio();
            }
          },
          onclose: () => {
            setStatusKey('disconnected');
            setIsActive(false);
            setVolume(0);
          },
          onerror: (e) => {
            setErrorMsg(t.connError);
            setStatusKey('error');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: instructions[selectedLang]
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to start live session", err);
      setIsActive(false);
      setErrorMsg(t.connError);
      setStatusKey('connectionFailed');
    }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setStatusKey('ready');
    setVolume(0);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000'
    };
  };

  const playAudio = async (base64: string, ctx: AudioContext) => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for(let i=0; i<len; i++) bytes[i] = binary.charCodeAt(i);
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for(let i=0; i<dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    if (nextStartTimeRef.current < ctx.currentTime) {
      nextStartTimeRef.current = ctx.currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    
    sourcesRef.current.add(source);
    source.onended = () => sourcesRef.current.delete(source);
  };

  const cancelAudio = () => {
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    if (audioContextRef.current) {
       nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const statusText = (t as any)[statusKey] || statusKey;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
      <div className="mb-4 relative h-24 w-24 mx-auto flex items-center justify-center bg-primary/10 rounded-full">
        {isActive ? (
           <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping" style={{ transform: `scale(${1 + volume/50})`}}></div>
        ) : null}
        <Activity className={`w-10 h-10 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
      </div>
      
      <h3 className="text-xl font-bold mb-2 dark:text-white">{t.title}</h3>
      <p className={`text-sm mb-4 ${errorMsg ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
        {statusText}
      </p>
      
      {errorMsg && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
         {Object.values(Language).map((l) => (
           <button
             key={l}
             onClick={() => setSelectedLang(l)}
             disabled={isActive}
             className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
               selectedLang === l 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
             } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {selectedLang === l && <Globe size={12} />}
             {langLabels[l]}
           </button>
         ))}
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`px-8 py-3 rounded-full font-semibold flex items-center justify-center mx-auto gap-2 transition-all w-full md:w-auto ${
          isActive 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isActive ? <><MicOff size={20} /> {t.end}</> : <><Mic size={20} /> {t.start}</>}
      </button>
    </div>
  );
};

export default LiveTutor;
