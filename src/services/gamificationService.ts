import { UserProfile, Badge, Language } from '../types';

const STORAGE_KEY = 'user_profile_v1';

const DEFAULT_BADGES: Badge[] = [
  {
    id: 'first_summary',
    icon: '📝',
    name: { [Language.AR]: 'بداية الكاتب', [Language.EN]: 'Writer Begins', [Language.FR]: 'Début de l\'écrivain', [Language.ES]: 'Escritor novato' },
    description: { [Language.AR]: 'أنشأت أول ملخص لك', [Language.EN]: 'Created your first summary', [Language.FR]: 'Premier résumé créé', [Language.ES]: 'Primer resumen creado' },
    condition: 'summary_count >= 1'
  },
  {
    id: 'quiz_master',
    icon: '🧠',
    name: { [Language.AR]: 'عبقري الاختبارات', [Language.EN]: 'Quiz Genius', [Language.FR]: 'Génie du Quiz', [Language.ES]: 'Genio del Quiz' },
    description: { [Language.AR]: 'أتممت 5 اختبارات', [Language.EN]: 'Completed 5 quizzes', [Language.FR]: '5 quiz terminés', [Language.ES]: '5 cuestionarios completados' },
    condition: 'quiz_count >= 5'
  },
  {
    id: 'planner_pro',
    icon: '📅',
    name: { [Language.AR]: 'مخطط محترف', [Language.EN]: 'Planner Pro', [Language.FR]: 'Pro du Planning', [Language.ES]: 'Experto en Planificación' },
    description: { [Language.AR]: 'أنشأت خطة دراسية', [Language.EN]: 'Created a study plan', [Language.FR]: 'Plan d\'étude créé', [Language.ES]: 'Plan de estudio creado' },
    condition: 'plan_created'
  }
];

const getProfile = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    xp: 0,
    level: 1,
    badges: [],
    streak: 0,
    lastActive: Date.now()
  };
};

const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('profile-updated'));
};

export const addXP = (amount: number) => {
  const profile = getProfile();
  profile.xp += amount;
  
  const newLevel = Math.floor(1 + Math.sqrt(profile.xp / 100));
  if (newLevel > profile.level) {
    profile.level = newLevel;
  }
  
  profile.lastActive = Date.now();
  saveProfile(profile);
};

export const unlockBadge = (badgeId: string) => {
  const profile = getProfile();
  if (profile.badges.find(b => b.id === badgeId)) return;

  const badgeDef = DEFAULT_BADGES.find(b => b.id === badgeId);
  if (badgeDef) {
    profile.badges.push({ ...badgeDef, unlockedAt: Date.now() });
    saveProfile(profile);
  }
};

export const getUserProfile = () => getProfile();

export const checkAchievements = (action: 'summary' | 'quiz' | 'plan') => {
  const stats = JSON.parse(localStorage.getItem('user_stats') || '{"summary":0, "quiz":0, "plan":0}');
  stats[action] = (stats[action] || 0) + 1;
  localStorage.setItem('user_stats', JSON.stringify(stats));

  if (action === 'summary' && stats['summary'] >= 1) unlockBadge('first_summary');
  if (action === 'quiz' && stats['quiz'] >= 5) unlockBadge('quiz_master');
  if (action === 'plan') unlockBadge('planner_pro');
};
