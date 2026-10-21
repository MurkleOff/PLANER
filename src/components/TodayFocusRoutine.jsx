import React, { useState } from 'react';
import { 
  Check, 
  Play, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Circle,
  Edit3
} from 'lucide-react';
import { CATEGORIES } from '../constants/initialData';
import { isHabitDoneOnDate, getHabitWeekCompletedCount, calculateSmartStreak } from '../utils/metrics';
import { sound } from '../utils/audio';

export default function TodayFocusRoutine({
  weekDays,
  selectedDayIndex,
  setSelectedDayIndex,
  habits,
  habitLogs,
  onToggleHabit,
  topTasks,
  onToggleTopTask,
  onUpdateTopTaskText,
  inboxTasks,
  onAddInboxTask,
  onDeleteInboxTask,
  onPromoteInboxToTopTask,
  onStartTimerForHabit,
  onStartTimerForTask,
  onOpenAddHabitModal,
}) {
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [newInboxText, setNewInboxText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskValue, setEditTaskValue] = useState('');

  const activeDay = weekDays[selectedDayIndex] || weekDays[0];
  const activeDateKey = activeDay.dateKey;

  const completedTopTasksCount = topTasks.filter(t => t.completed).length;

  const handleCheckboxClick = (habit) => {
    sound.playCheckmarkClick();
    onToggleHabit(habit.id, activeDateKey);
  };

  const handleTopTaskCheck = (taskId) => {
    sound.playCheckmarkClick();
    onToggleTopTask(taskId, activeDateKey);
  };

  const handleStartEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTaskValue(task.text);
  };

  const handleSaveEdit = (taskId) => {
    onUpdateTopTaskText(taskId, editTaskValue.trim(), activeDateKey);
    setEditingTaskId(null);
  };

  const handleAddInbox = (e) => {
    e.preventDefault();
    if (!newInboxText.trim()) return;
    onAddInboxTask(newInboxText.trim());
    setNewInboxText('');
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Day of Week Switcher */}
      <div className="p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-inner">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <button
                key={day.dateKey}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {day.isToday && (
                  <span className={`w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 ${
                    isSelected ? 'bg-emerald-300' : 'bg-emerald-400 animate-pulse'
                  }`} />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {day.dayShort}
                </span>
                <span className={`text-sm font-mono font-bold mt-0.5 ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}>
                  {day.dayOfMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Rule of 3 Top Tasks */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold">
              3
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Фокус дня: 3 Главные задачи
            </h2>
          </div>
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
            completedTopTasksCount === 3
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {completedTopTasksCount} из 3
          </span>
        </div>

        {/* Top 3 Task Slots */}
        <div className="space-y-2.5">
          {topTasks.map((task, idx) => {
            const isEditing = editingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Tactile Checkbox */}
                <button
                  onClick={() => handleTopTaskCheck(task.id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                      : 'border-slate-700 bg-slate-900 hover:border-indigo-400'
                  }`}
                  title={task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                >
                  {task.completed ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                </button>

                {/* Inline Edit or Text */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editTaskValue}
                        onChange={(e) => setEditTaskValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(task.id);
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        autoFocus
                        className="w-full bg-slate-900 border border-indigo-500/60 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shrink-0"
                      >
                        ОК
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEditing(task)}
                      className={`text-xs cursor-pointer group flex items-center justify-between gap-2 ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                      title="Кликните для редактирования задачи"
                    >
                      <span className="truncate">{task.text || `Главная задача №${idx + 1}`}</span>
                      <Edit3 className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  )}
                </div>

                {/* Launch Timer for this task */}
                <button
                  onClick={() => onStartTimerForTask(task)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors shrink-0"
                  title="Запустить Deep Work таймер на эту задачу"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Collapsible Inbox / Backlog */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setIsInboxOpen(!isInboxOpen)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>Быстрые задачи и Inbox</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                {inboxTasks.length}
              </span>
            </span>
            {isInboxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isInboxOpen && (
            <div className="mt-2.5 space-y-2">
              {/* Quick Add input */}
              <form onSubmit={handleAddInbox} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Добавить задачу в Inbox..."
                  value={newInboxText}
                  onChange={(e) => setNewInboxText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs transition-colors"
                  title="Добавить в Inbox"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Inbox list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {inboxTasks.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">
                    Входящих задач нет. Все задачи распределены!
                  </p>
                ) : (
                  inboxTasks.map(item => (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-slate-300 truncate">{item.text}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onPromoteInboxToTopTask(item.id, activeDateKey)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                          title="Сделать одной из 3 главных задач дня"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteInboxTask(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Удалить задачу"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Habits for the Selected Day */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Привычки на {activeDay.dayFull} ({activeDay.dayShort})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {activeDay.dayOfMonth} {activeDay.monthName}
            </span>
            <button
              onClick={() => onOpenAddHabitModal('personality')}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Привычка</span>
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="py-7 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center">
            <p className="text-xs text-slate-400 mb-3">
              Список привычек пока пуст. Добавьте свои первые привычки по сферам:
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {Object.values(CATEGORIES).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onOpenAddHabitModal(cat.id)}
                  className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${cat.badgeClass} hover:opacity-90`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {habits.map(habit => {
              const isDone = isHabitDoneOnDate(habit, activeDateKey, habitLogs);
              const category = CATEGORIES[habit.category] || CATEGORIES.personality || Object.values(CATEGORIES)[0];
              const weekCompletedCount = getHabitWeekCompletedCount(habit, weekDays, habitLogs);
              const target = habit.targetPerWeek || 7;
              const isQuotaClosed = weekCompletedCount >= target;
              const streak = calculateSmartStreak(habit, weekDays, selectedDayIndex, habitLogs);
              const isScheduled = Array.isArray(habit.scheduledDays) && habit.scheduledDays.length > 0
                ? habit.scheduledDays.includes(selectedDayIndex)
                : (target === 7);

              return (
                <div
                  key={habit.id}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-slate-950/90 border-emerald-500/30 shadow-sm'
                      : isScheduled
                        ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700/80'
                        : 'bg-slate-950/40 border-slate-900/80 hover:border-slate-800/70 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Tactile Checkbox */}
                  <button
                    onClick={() => handleCheckboxClick(habit)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                        : isScheduled
                          ? 'border-dashed border-cyan-500/70 bg-cyan-950/20 hover:border-cyan-400 text-cyan-400'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                    title={
                      isDone
                        ? 'Снять отметку'
                        : isScheduled
                          ? 'Отметить выполненной (запланировано на сегодня 🎯)'
                          : 'Отметить выполненной (бонус в день отдыха ☕)'
                    }
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isScheduled ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90" />
                    ) : null}
                  </button>

                  {/* Habit details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${category.badgeClass}`}>
                        {category.name}
                      </span>
                      
                      {/* Schedule status */}
                      {isScheduled ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>По плану</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800/70 text-slate-400 border border-slate-700/50 flex items-center gap-1" title="День отдыха по расписанию">
                          <span>☕ Отдых</span>
                        </span>
                      )}

                      {isQuotaClosed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Норма закрыта
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {weekCompletedCount}/{target} за нед.
                        </span>
                      )}

                      {streak > 0 && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{streak} дн.</span>
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xs font-medium truncate ${
                      isDone ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      {habit.title}
                    </h3>
                  </div>

                  {/* Quick Start Focus Timer Button */}
                  <button
                    onClick={() => onStartTimerForHabit(habit)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 text-[11px] font-mono flex items-center gap-1 transition-all shrink-0 active:scale-95"
                    title="Запустить таймер фокуса для этой привычки"
                  >
                    <Play className="w-3 h-3 fill-current text-cyan-400" />
                    <span>{habit.timerMinutes || 45}м</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
