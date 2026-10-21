import React from 'react';
import { Zap, Target, Flame, Clock, Award, Info } from 'lucide-react';

export default function MetricsBar({
  dailyChargeMetrics,
  disciplineMetrics,
  totalStreakCount,
  todayFocusMinutes,
}) {
  const { dailyCharge, habitPercent, taskPercent, completedTasks, doneCount, requiredHabits, isMaximized } = dailyChargeMetrics;
  const { overallIndex, basePercent, cyclicPercent } = disciplineMetrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* 1. Заряд дня (0–100%) */}
      <div className={`p-4 rounded-2xl bg-slate-900/80 border transition-all duration-300 relative overflow-hidden ${
        isMaximized 
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30' 
          : 'border-slate-800/90 hover:border-slate-700/80'
      }`}>
        {isMaximized && (
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        )}
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isMaximized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Заряд дня
              </span>
              <div className="text-[10px] text-slate-500">Привычки 60% + Топ-3 40%</div>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${
              isMaximized ? 'text-emerald-400' : 'text-white'
            }`}>
              {dailyCharge}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMaximized
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 animate-glow'
                : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
            }`}
            style={{ width: `${dailyCharge}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            {isMaximized ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> День закрыт по максимуму! 🔥
              </span>
            ) : dailyCharge >= 70 ? (
              <span className="text-cyan-400 font-medium">Отличный темп</span>
            ) : (
              <span className="text-slate-400">В процессе закрытия</span>
            )}
          </span>
          <span className="text-slate-500 font-mono">
            {doneCount}/{requiredHabits} прив. · {completedTasks}/3 задач
          </span>
        </div>
      </div>

      {/* 2. Индекс дисциплины (%) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Индекс дисциплины
              </span>
              <div className="text-[10px] text-slate-500">План за неделю</div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-white">
              {overallIndex}%
            </span>
          </div>
        </div>

        {/* Split progress bar: Base (7/7) vs Cyclic (N/7) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Базовый режим (7/7):</span>
            <span className="font-mono text-slate-200 font-medium">{basePercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${basePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Циклический план (N/7):</span>
            <span className="font-mono text-slate-200 font-medium">{cyclicPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${cyclicPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Умные серии (Smart Streak) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Суммарные серии
              </span>
              <div className="text-[10px] text-slate-500">Умный учёт дней отдыха</div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-amber-400">
              {totalStreakCount}
            </span>
            <span className="text-xs text-slate-400 ml-1">дн.</span>
          </div>
        </div>

        <div className="mt-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
          <span>Для квот N/7 дни отдыха не обнуляют накопленную серию.</span>
        </div>
      </div>

      {/* 4. Глубокий фокус сегодня */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Глубокий фокус
              </span>
              <div className="text-[10px] text-slate-500">За сегодня</div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-extrabold font-mono tracking-tight text-cyan-400">
              {todayFocusMinutes}
            </span>
            <span className="text-xs text-slate-400 ml-1">мин</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Сессий таймера:</span>
          <span className="font-mono text-slate-200 font-semibold">
            {Math.round(todayFocusMinutes / 25)} спринт(ов)
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (todayFocusMinutes / 120) * 100)}%` }}
          />
        </div>
      </div>

    </div>
  );
}
