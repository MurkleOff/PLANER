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
  Edit3,
  CheckSquare
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
  todayTasks = [],
  onToggleTodayTask,
  onUpdateTodayTaskText,
  onUpdateTodayTaskCategory,
  onDeleteTodayTask,
  onAddTodayTask,
  inboxTasks = [],
  onAddInboxTask,
  onDeleteInboxTask,
  onPromoteInboxToTodayTask,
  onStartTimerForHabit,
  onStartTimerForTask,
  onOpenAddHabitModal,
}) {
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [newInboxText, setNewInboxText] = useState('');
  
  // Category filter state: 'all' | 'training' | 'work' | 'study' | 'personality'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  // View mode when 'all' is active: 'flat' (unified list) | 'grouped' (grouped by spheres)
  const [allViewMode, setAllViewMode] = useState('flat');

  // Quick task input state for today
  const [newTodayTaskText, setNewTodayTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  
  // Inline edit state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskValue, setEditTaskValue] = useState('');

  const activeDay = weekDays[selectedDayIndex] || weekDays[0];
  const activeDateKey = activeDay.dateKey;

  const completedTasksCount = todayTasks.filter(t => t.completed).length;

  // Filter tasks based on activeCategoryFilter
  const visibleTasks = activeCategoryFilter === 'all'
    ? todayTasks
    : todayTasks.filter(t => t.category === activeCategoryFilter);

  const completedFilteredCount = visibleTasks.filter(t => t.completed).length;

  const handleCheckboxClick = (habit) => {
    sound.playCheckmarkClick();
    onToggleHabit(habit.id, activeDateKey);
  };

  const handleTodayTaskCheck = (taskId) => {
    sound.playCheckmarkClick();
    onToggleTodayTask(taskId);
  };

  const handleStartEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTaskValue(task.title || task.text || '');
  };

  const handleSaveEdit = (taskId) => {
    if (editTaskValue.trim()) {
      onUpdateTodayTaskText(taskId, editTaskValue.trim());
    }
    setEditingTaskId(null);
  };

  const handleAddTodayTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTodayTaskText.trim()) return;
    onAddTodayTask(newTodayTaskText.trim(), selectedCategory);
    setNewTodayTaskText('');
  };

  const handleAddInbox = (e) => {
    e.preventDefault();
    if (!newInboxText.trim()) return;
    onAddInboxTask(newInboxText.trim());
    setNewInboxText('');
  };

  const renderTaskItem = (task) => {
    const isEditing = editingTaskId === task.id;
    const category = CATEGORIES[task.category] || CATEGORIES.work || Object.values(CATEGORIES)[0];

    return (
      <div
        key={task.id}
        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
          task.completed
            ? 'bg-slate-950/40 border-slate-800/60 text-slate-500'
            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Tactile Checkbox */}
        <button
          onClick={() => handleTodayTaskCheck(task.id)}
          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'border-slate-700 bg-slate-900 hover:border-indigo-400'
          }`}
          title={task.completed ? 'Снять отметку' : 'Отметить выполненной'}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details & Inline Edit */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {/* Interactive Category Selector Badge */}
            <select
              value={task.category || 'work'}
              onChange={(e) => {
                if (onUpdateTodayTaskCategory) {
                  onUpdateTodayTaskCategory(task.id, e.target.value);
                }
              }}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border bg-slate-950 cursor-pointer focus:outline-none transition-colors ${category.badgeClass}`}
              title="Кликните, чтобы изменить сферу задачи"
            >
              {Object.values(CATEGORIES).map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

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
                className="w-full bg-slate-900 border border-indigo-500/60 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={() => handleSaveEdit(task.id)}
                className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shrink-0 font-medium"
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
              <span className="truncate">{task.title || task.text}</span>
              <Edit3 className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStartTimerForTask(task)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
            title="Запустить Deep Work таймер на эту задачу"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={() => onDeleteTodayTask(task.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Удалить задачу"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
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

      {/* 2. Real Tasks of the Day */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Актуальные задачи на {activeDay.dayShort} ({activeDay.dayOfMonth} {activeDay.monthName})
              </h2>
            </div>
          </div>
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
            (activeCategoryFilter === 'all' ? todayTasks.length : visibleTasks.length) > 0 &&
            (activeCategoryFilter === 'all' ? completedTasksCount === todayTasks.length : completedFilteredCount === visibleTasks.length)
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {activeCategoryFilter === 'all' 
              ? `${completedTasksCount} из ${todayTasks.length} выполнено`
              : `${completedFilteredCount} из ${visibleTasks.length} выполнено`}
          </span>
        </div>

        {/* Category Filter Tabs with live counters */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {/* Tab: Все сферы (все задачи дня) */}
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border flex items-center gap-1.5 ${
                activeCategoryFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>Все сферы</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeCategoryFilter === 'all' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {todayTasks.length}
              </span>
            </button>

            {/* Individual Sphere Filter Tabs */}
            {Object.values(CATEGORIES).map(cat => {
              const count = todayTasks.filter(t => t.category === cat.id).length;
              const isSelected = activeCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter(cat.id);
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? `${cat.badgeClass} ring-1 ring-current font-bold scale-102 shadow-sm`
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-black/30' : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle View Mode (Flat / Grouped) when 'all' is active */}
          {activeCategoryFilter === 'all' && todayTasks.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setAllViewMode('flat')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  allViewMode === 'flat' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Показать единым списком"
              >
                Списком
              </button>
              <button
                type="button"
                onClick={() => setAllViewMode('grouped')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  allViewMode === 'grouped' ? 'bg-slate-800 text-slate-200 font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Разбить по 4 сферам"
              >
                По сферам
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Form directly in this block */}
        <form onSubmit={handleAddTodayTaskSubmit} className="mb-3.5 space-y-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
          {/* If "Все сферы" is selected, choose which sphere to add to */}
          {activeCategoryFilter === 'all' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Куда добавить:
              </span>
              {Object.values(CATEGORIES).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all shrink-0 border flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? `${cat.badgeClass} ring-1 ring-current font-bold scale-102`
                      : 'border-slate-800/80 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text Input + Add Button */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder={`Новая задача в сферу «${CATEGORIES[selectedCategory]?.name || 'Дело'}» на ${activeDay.dayShort}...`}
              value={newTodayTaskText}
              onChange={(e) => setNewTodayTaskText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/70 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shrink-0 active:scale-95 shadow-sm shadow-indigo-600/30"
              title="Добавить задачу (Enter)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>
        </form>

        {/* Real Task List */}
        {todayTasks.length === 0 ? (
          <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 text-center mb-3">
            <p className="text-xs text-slate-400 mb-1">
              На этот день задач пока нет.
            </p>
            <p className="text-[11px] text-slate-500">
              Введите задачу в поле выше или перенесите дело из Inbox.
            </p>
          </div>
        ) : activeCategoryFilter === 'all' && allViewMode === 'grouped' ? (
          <div className="space-y-3 mb-3 max-h-96 overflow-y-auto pr-0.5">
            {Object.values(CATEGORIES).map(cat => {
              const sphereTasks = todayTasks.filter(t => t.category === cat.id);
              if (sphereTasks.length === 0) return null;

              return (
                <div key={cat.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        {cat.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${cat.badgeClass}`}>
                        {sphereTasks.filter(t => t.completed).length}/{sphereTasks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategoryFilter(cat.id);
                        setSelectedCategory(cat.id);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Только {cat.name} →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {sphereTasks.map(task => renderTaskItem(task))}
                  </div>
                </div>
              );
            })}

            {/* Hint for spheres without tasks */}
            {Object.values(CATEGORIES).filter(cat => todayTasks.every(t => t.category !== cat.id)).length > 0 && (
              <div className="text-[11px] text-slate-500 px-1 pt-1 flex items-center gap-2 flex-wrap">
                <span>Без задач сегодня:</span>
                {Object.values(CATEGORIES)
                  .filter(cat => todayTasks.every(t => t.category !== cat.id))
                  .map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategoryFilter(cat.id);
                        setSelectedCategory(cat.id);
                      }}
                      className="text-slate-400 hover:text-slate-200 underline underline-offset-2 flex items-center gap-1"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.dotClass}`} />
                      <span>{cat.name} (+ добавить)</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mb-3 max-h-80 overflow-y-auto pr-0.5">
            {visibleTasks.length === 0 ? (
              <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 text-center">
                <p className="text-xs text-slate-300 mb-1">
                  В сфере «{CATEGORIES[activeCategoryFilter]?.name || 'выбранной'}» на этот день задач нет.
                </p>
                <p className="text-[11px] text-slate-500">
                  Введите задачу в поле выше, чтобы добавить её в эту сферу.
                </p>
              </div>
            ) : (
              visibleTasks.map(task => renderTaskItem(task))
            )}
          </div>
        )}

        {/* Collapsible Inbox / Backlog */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setIsInboxOpen(!isInboxOpen)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>Быстрые заметки и Inbox</span>
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
                  placeholder="Добавить в Inbox..."
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
                    Входящих заметок нет.
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
                          onClick={() => onPromoteInboxToTodayTask(item.id, selectedCategory)}
                          className="px-2 py-0.5 text-[10px] bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1"
                          title="Перенести в задачи сегодняшнего дня"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>В задачи дня</span>
                        </button>
                        <button
                          onClick={() => onDeleteInboxTask(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Удалить"
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
