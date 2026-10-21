import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Flame, 
  RotateCcw, 
  Edit2, 
  Trash2, 
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { CATEGORIES } from '../constants/initialData';
import { isHabitDoneOnDate, getHabitWeekCompletedCount, calculateSmartStreak } from '../utils/metrics';
import { sound } from '../utils/audio';

export default function WeeklyMatrix({
  weekDays,
  habits,
  habitLogs,
  onToggleHabit,
  onOpenAddHabitModal,
  onOpenEditHabitModal,
  onDeleteHabit,
  onStartNewWeek,
  selectedDayIndex,
}) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const filteredHabits = habits.filter(h => {
    if (activeCategoryFilter === 'all') return true;
    return h.category === activeCategoryFilter;
  });

  const handleCellClick = (habitId, dateKey) => {
    sound.playCheckmarkClick();
    onToggleHabit(habitId, dateKey);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
      
      {/* Header and Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Полная матрица привычек на неделю
          </h2>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 ${
              activeCategoryFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Все ({habits.length})
          </button>
          {Object.values(CATEGORIES).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 border ${
                activeCategoryFilter === cat.id
                  ? `${cat.badgeClass} ring-1 ring-current font-semibold`
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Add Habit button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAddHabitModal}
            className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить привычку</span>
          </button>
        </div>
      </div>

      {/* Category Motto Bar if filtered */}
      {activeCategoryFilter !== 'all' && CATEGORIES[activeCategoryFilter]?.motto && (
        <div className="mb-3.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${CATEGORIES[activeCategoryFilter].dotClass}`} />
          <span className="font-semibold text-slate-200">{CATEGORIES[activeCategoryFilter].name}:</span>
          <span className="text-slate-400 italic">«{CATEGORIES[activeCategoryFilter].motto}»</span>
        </div>
      )}

      {/* Table (with horizontal scroll on small devices) */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-mono">
                <th className="py-2.5 px-3 text-left font-semibold w-64">
                  Привычка / Категория
                </th>
                {weekDays.map((day, idx) => {
                  const isCurrentDay = idx === selectedDayIndex;
                  return (
                    <th
                      key={day.dateKey}
                      className={`py-2.5 px-2 text-center font-semibold min-w-[44px] transition-colors ${
                        isCurrentDay ? 'text-indigo-400 bg-indigo-500/5 rounded-t-xl' : ''
                      }`}
                    >
                      <div className="text-[11px] font-bold">{day.dayShort}</div>
                      <div className="text-[10px] text-slate-500">{day.dayOfMonth}</div>
                    </th>
                  );
                })}
                <th className="py-2.5 px-3 text-center font-semibold min-w-[110px]">
                  Квота
                </th>
                <th className="py-2.5 px-3 text-center font-semibold min-w-[80px]">
                  Серия
                </th>
                <th className="py-2.5 px-3 text-right font-semibold w-16">
                  Опции
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredHabits.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-xs text-slate-400">
                        {activeCategoryFilter === 'all' 
                          ? 'Привычек пока нет. Нажмите кнопку ниже, чтобы добавить первую привычку в любую из сфер.'
                          : `В сфере «${CATEGORIES[activeCategoryFilter]?.name || ''}» пока нет привычек.`}
                      </p>
                      <button
                        onClick={() => onOpenAddHabitModal(activeCategoryFilter === 'all' ? 'personality' : activeCategoryFilter)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Добавить первую привычку</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHabits.map(habit => {
                const category = CATEGORIES[habit.category] || CATEGORIES.personality || Object.values(CATEGORIES)[0];
                const completedThisWeek = getHabitWeekCompletedCount(habit, weekDays, habitLogs);
                const target = habit.targetPerWeek || 7;
                const isQuotaClosed = completedThisWeek >= target;
                const streak = calculateSmartStreak(habit, weekDays, selectedDayIndex, habitLogs);

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Habit Title & Category */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${category.dotClass}`} />
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${category.badgeClass}`}>
                          {category.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {habit.timerMinutes || 45}м
                        </span>
                      </div>
                      <div className="font-medium text-slate-200">
                        {habit.title}
                      </div>
                    </td>

                    {/* 7 Days Checkboxes */}
                    {weekDays.map((day, idx) => {
                      const isDone = isHabitDoneOnDate(habit, day.dateKey, habitLogs);
                      const isCurrentDay = idx === selectedDayIndex;
                      const isScheduled = habit.scheduledDays ? habit.scheduledDays.includes(idx) : habit.targetPerWeek === 7;

                      return (
                        <td
                          key={day.dateKey}
                          className={`py-3 px-2 text-center transition-colors ${
                            isCurrentDay ? 'bg-indigo-500/5' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleCellClick(habit.id, day.dateKey)}
                            className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 scale-105'
                                : isScheduled
                                  ? 'border-dashed border-cyan-500/70 bg-cyan-950/20 hover:border-cyan-400 text-cyan-400'
                                  : 'border-slate-800/60 bg-slate-950/40 hover:border-slate-700 text-transparent'
                            }`}
                            title={`${habit.title} — ${day.dayFull} (${day.dateKey}): ${
                              isDone ? 'Выполнено ✓' : isScheduled ? 'Запланировано по плану 🎯' : 'День отдыха ☕ (кликните, если выполнили)'
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : isScheduled ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
                            ) : null}
                          </button>
                        </td>
                      );
                    })}

                    {/* Quota Progress */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 font-mono text-[11px] mb-1">
                          <span className={isQuotaClosed ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                            {completedThisWeek}
                          </span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{target}</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isQuotaClosed ? 'bg-emerald-400' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, (completedThisWeek / target) * 100)}%` }}
                          />
                        </div>
                        {isQuotaClosed && (
                          <span className="text-[9px] text-emerald-400 font-semibold mt-1">
                            Закрыта ✓
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="py-3 px-3 text-center font-mono">
                      {streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{streak}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions: Edit / Delete */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenEditHabitModal(habit)}
                          className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
                          title="Редактировать привычку"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Удалить привычку"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info & Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
            <span>Выполнено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-cyan-400 bg-cyan-950/30 inline-flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
            </span>
            <span>Запланировано</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-slate-800 bg-slate-950/40 inline-block" />
            <span>День отдыха</span>
          </div>
        </div>
        <button
          onClick={onStartNewWeek}
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Завершить текущую неделю и начать новую</span>
        </button>
      </div>

    </div>
  );
}
