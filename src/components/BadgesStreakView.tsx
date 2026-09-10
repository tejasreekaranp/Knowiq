import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Award, 
  Trophy, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Star 
} from 'lucide-react';
import { Badge, StudentState } from '../types';

interface BadgesStreakViewProps {
  student: StudentState;
}

export const BadgesStreakView: React.FC<BadgesStreakViewProps> = ({ student }) => {
  const daysOfWeek = [
    { day: 'Mon', completed: true, date: 'Oct 14' },
    { day: 'Tue', completed: true, date: 'Oct 15' },
    { day: 'Wed', completed: true, date: 'Oct 16' },
    { day: 'Thu', completed: true, date: 'Oct 17' },
    { day: 'Fri', completed: true, date: 'Oct 18' },
    { day: 'Sat', completed: true, date: 'Oct 19' },
    { day: 'Sun', completed: true, date: 'Today' },
  ];

  const nextLevelXp = 2000;
  const currentLevelXp = 1000;
  const progressPercent = Math.min(100, Math.round(((student.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      {/* Top Banner: Level & Streak Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
              Daily Streak Multiplier: 1.5x XP
            </span>
            <Flame className="w-7 h-7 text-amber-200 fill-amber-200 animate-pulse" />
          </div>

          <div>
            <div className="text-4xl sm:text-5xl font-extrabold font-display leading-none">
              {student.streakDays} Days
            </div>
            <div className="text-xs sm:text-sm text-orange-100 mt-1 font-medium">
              Unbroken daily consistency! You have completed your goal every day this week.
            </div>
          </div>

          {/* 7-Day Visual Calendar */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {daysOfWeek.map((d, i) => (
              <div 
                key={i} 
                className="bg-white/20 backdrop-blur-xs rounded-xl p-2 text-center border border-white/20"
              >
                <div className="text-[10px] uppercase font-bold text-amber-100">{d.day}</div>
                <div className="mt-1 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white fill-white/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XP & Level Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-indigo-800/40 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-full">
              Current Rank: Tier 3
            </span>
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Student Level 4
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-0.5">
              Relational Schema Architect
            </div>
            <div className="text-sm font-bold text-indigo-400 mt-1">
              {student.xp.toLocaleString()} XP <span className="text-xs text-slate-400 font-normal">/ {nextLevelXp} XP to Level 5</span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Level 4</span>
              <span>{progressPercent}% Complete</span>
              <span>Level 5 (DBMS Specialist)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 font-display">Academic Badges & Milestones</h2>
            <p className="text-xs text-slate-500">
              Earn specialized badges through diagnostic clarity scores and continuous revision streaks.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {student.badges.filter(b => b.unlockedAt).length} / {student.badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {student.badges.map((b) => {
            const isUnlocked = !!b.unlockedAt;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border transition-all flex items-start space-x-3.5 ${
                  isUnlocked
                    ? 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  isUnlocked ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isUnlocked ? b.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-display">
                      {b.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {b.description}
                  </p>

                  <div className="pt-1">
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked • {new Date(b.unlockedAt!).toLocaleDateString()}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
