import React from 'react';
import { Zap, Target, Flame, Award } from 'lucide-react';

export default function CompactMetricsBar({
  dailyChargeMetrics,
  disciplineMetrics,
  totalStreakCount,
}) {
  const { dailyCharge, completedTasks, doneCount, requiredHabits, isMaximized } = dailyChargeMetrics;
  const { overallIndex, basePercent, cyclicPercent } = disciplineMetrics;

  return (
    <div className={`p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/90 border transition-all duration-300 mb-5 shadow-sm ${
      isMaximized 
        ? 'border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/20' 
        : 'border-slate-800/90'
    }`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
        
        {/* 1. Заряд дня */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isMaximized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/15 text-indigo-400'
          }`}>
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 leading-none mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                Заряд дня
              </span>
              <span className={`text-xs font-mono font-bold ${
                isMaximized ? 'text-emerald-400' : 'text-white'
              }`}>
                {dailyCharge}%
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMaximized
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                    : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${dailyCharge}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Индекс дисциплины */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                Дисциплина
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {overallIndex}%
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              баз. {basePercent}% · цикл. {cyclicPercent}%
            </div>
          </div>
        </div>

        {/* 3. Серии */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                Серии
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {totalStreakCount} дн.
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              умный учёт отдыха
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
