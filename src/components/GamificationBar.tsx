import React, { useEffect, useState } from 'react';
import { UserProfile, Language } from '../types';
import { getUserProfile } from '../services/gamificationService';
import { Trophy, Star, Zap } from 'lucide-react';

interface Props {
  lang: Language;
}

const GamificationBar: React.FC<Props> = ({ lang }) => {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());

  useEffect(() => {
    const handleUpdate = () => setProfile(getUserProfile());
    window.addEventListener('profile-updated', handleUpdate);
    return () => window.removeEventListener('profile-updated', handleUpdate);
  }, []);

  const nextLevelXp = Math.pow(profile.level, 2) * 100;
  const prevLevelXp = Math.pow(profile.level - 1, 2) * 100;
  const progressPercent = Math.min(100, Math.max(0, ((profile.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                {profile.level}
            </div>
            <div className="hidden sm:block">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Level</p>
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
            <Zap size={16} className="fill-current" />
            <span>{profile.xp} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {profile.badges.slice(-3).map((badge, idx) => (
            <div key={idx} className="group relative" title={badge.name[lang]}>
                 <div className="w-8 h-8 flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-700 rounded-full cursor-help hover:scale-110 transition-transform">
                     {badge.icon}
                 </div>
            </div>
        ))}
        {profile.badges.length === 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
                <Trophy size={14} /> No badges yet
            </span>
        )}
      </div>
    </div>
  );
};

export default GamificationBar;
