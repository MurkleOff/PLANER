import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Trash2, 
  Play, 
  Target, 
  Clock, 
  Compass, 
  CheckSquare,
  ArrowRight,
  Star,
  Edit3
} from 'lucide-react';
import { CATEGORIES } from '../constants/initialData';
import { 
  formatDateKey, 
  formatDateRu, 
  formatMonthLabel, 
  getDaysRemaining, 
  getMondayOfWeek, 
  getWeekDays, 
  getWeekLabel, 
  getWeekKey, 
  getMonthKey, 
  getYearKey, 
  addDays, 
  DAYS_FULL,
  getMondayOfDateKey 
} from '../utils/dateUtils';
import { getParentKeyGoal } from '../utils/planUtils';
import { sound } from '../utils/audio';

export default function PlanningHorizons({
  plans = [],
  onTogglePlan,
  onUpdatePlanProgress,
  onUpdatePlanTitle,
  onReschedulePlan,
  onDeletePlan,
  onToggleKeyPlan,
  onStartTimerForPlan,
  onOpenAddPlanModal,
  onOpenEditPlanModal,
  onQuickAddTask,
}) {
  const [activeHorizon, setActiveHorizon] = useState('day'); // 'day' | 'week' | 'month' | 'year'
  const [dayViewMode, setDayViewMode] = useState('spheres'); // 'spheres' | 'all'
  const [activeSphereFilter, setActiveSphereFilter] = useState('all'); // 'all' | 'training' | 'work' | 'study' | 'personality'

  const SPHERE_KEYS = ['training', 'work', 'study', 'personality'];

  const handlePrevSphere = () => {
    const idx = SPHERE_KEYS.indexOf(activeSphereFilter);
    if (idx === -1) {
      setActiveSphereFilter(SPHERE_KEYS[SPHERE_KEYS.length - 1]);
    } else {
      const prevIdx = (idx - 1 + SPHERE_KEYS.length) % SPHERE_KEYS.length;
      setActiveSphereFilter(SPHERE_KEYS[prevIdx]);
    }
  };

  const handleNextSphere = () => {
    const idx = SPHERE_KEYS.indexOf(activeSphereFilter);
    if (idx === -1) {
      setActiveSphereFilter(SPHERE_KEYS[0]);
    } else {
      const nextIdx = (idx + 1) % SPHERE_KEYS.length;
      setActiveSphereFilter(SPHERE_KEYS[nextIdx]);
    }
  };

  // Current navigation states for each horizon
  const [dayDate, setDayDate] = useState(() => formatDateKey(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [yearNumber, setYearNumber] = useState(() => new Date().getFullYear());

  // Editing state for inline text edit
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Quick task input state for each sphere: { [catId]: string }
  const [quickTaskTexts, setQuickTaskTexts] = useState({});

  // Computed period keys
  const mondayOfWeek = getMondayOfWeek(new Date(), weekOffset);
  const currentWeekKey = getWeekKey(mondayOfWeek);
  const currentMonthKey = getMonthKey(monthDate);
  const currentYearKey = String(yearNumber);

  // Active target period key based on active horizon
  const activePeriodKey = activeHorizon === 'day' 
    ? dayDate 
    : activeHorizon === 'week' 
      ? currentWeekKey 
      : activeHorizon === 'month' 
        ? currentMonthKey 
        : currentYearKey;

  // Filter plans for the active horizon and period
  const currentPeriodPlans = plans.filter(p => {
    return p.horizon === activeHorizon && p.targetPeriod === activePeriodKey;
  });

  const currentPeriodGoals = currentPeriodPlans.filter(p => p.type === 'progress');
  const currentPeriodTasks = currentPeriodPlans.filter(p => p.type === 'checkbox' || !p.type);

  const totalGoalsCount = currentPeriodGoals.length;
  const completedGoalsCount = currentPeriodGoals.filter(g => g.progress === 100).length;

  const totalTasksCount = currentPeriodTasks.length;
  const completedTasksCount = currentPeriodTasks.filter(t => t.completed).length;

  const realTodayKey = formatDateKey(new Date());
  const getSmartNextDay = (dateStr) => {
    if (dateStr < realTodayKey) {
      return realTodayKey;
    }
    return addDays(dateStr, 1);
  };

  // Period Navigation Handlers
  const handleDayShift = (deltaDays) => {
    const d = new Date(dayDate);
    d.setDate(d.getDate() + deltaDays);
    setDayDate(formatDateKey(d));
  };

  const handleMonthShift = (deltaMonths) => {
    const d = new Date(monthDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + deltaMonths);
    setMonthDate(d);
  };

  const handleYearShift = (deltaYears) => {
    setYearNumber(prev => prev + deltaYears);
  };

  const handleJumpToParentHorizon = (parentHorizon, parentPeriodKey) => {
    if (!parentHorizon || !parentPeriodKey) return;
    setActiveHorizon(parentHorizon);
    if (parentHorizon === 'year') {
      setYearNumber(Number(parentPeriodKey));
    } else if (parentHorizon === 'month') {
      const parts = String(parentPeriodKey).split('-').map(Number);
      if (parts.length >= 2) {
        setMonthDate(new Date(parts[0], parts[1] - 1, 1));
      }
    } else if (parentHorizon === 'week') {
      const todayMonday = getMondayOfWeek(new Date(), 0);
      const targetMonday = getMondayOfDateKey(dayDate);
      const diffMs = targetMonday.getTime() - todayMonday.getTime();
      const diffWeeks = Math.round(diffMs / (7 * 86400000));
      setWeekOffset(diffWeeks);
    }
  };

  const handleSaveInlineEdit = (planId) => {
    if (editTitleValue.trim()) {
      onUpdatePlanTitle(planId, editTitleValue.trim());
    }
    setEditingPlanId(null);
  };

  const handleToggle = (planId) => {
    sound.playCheckmarkClick();
    onTogglePlan(planId);
  };

  const handleTaskInputChange = (catId, val) => {
    setQuickTaskTexts(prev => ({ ...prev, [catId]: val }));
  };

  const handleQuickTaskSubmit = (e, catId) => {
    e.preventDefault();
    const text = (quickTaskTexts[catId] || '').trim();
    if (!text || !onQuickAddTask) return;
    onQuickAddTask(catId, activeHorizon, activePeriodKey, text);
    setQuickTaskTexts(prev => ({ ...prev, [catId]: '' }));
  };

  // Day label
  const getDayFormattedTitle = () => {
    const d = new Date(dayDate);
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const isToday = dayDate === formatDateKey(new Date());
    return (
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-white">{DAYS_FULL[dayIndex]}, {formatDateRu(dayDate)}</span>
        {isToday && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Сегодня
          </span>
        )}
      </span>
    );
  };

  // --- North Star Beacon Render Helper ---
  const renderParentBeacon = (parentBeacon, catId) => {
    if (!parentBeacon) return null;

    if (parentBeacon.goal) {
      return (
        <div 
          onClick={() => onOpenEditPlanModal && onOpenEditPlanModal(parentBeacon.goal)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-slate-900 border border-amber-500/35 hover:border-amber-400/60 transition-all cursor-pointer group shadow-sm mb-3.5"
          title={`Главная цель (${parentBeacon.parentInfo.parentLabel}) — кликните для редактирования`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 truncate">
                Главная цель на {parentBeacon.parentInfo.parentLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-amber-300">
                {parentBeacon.goal.progress || 0}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpToParentHorizon(parentBeacon.parentInfo.parentHorizon, parentBeacon.parentInfo.parentPeriodKey);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors flex items-center gap-0.5 font-medium"
                title={`Перейти к горизонту «${parentBeacon.parentInfo.parentHorizonName}»`}
              >
                <span>К горизонту</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="text-xs font-semibold text-slate-100 group-hover:text-amber-200 transition-colors truncate">
              {parentBeacon.goal.title}
            </div>
          </div>

          <div className="w-full bg-slate-950/80 rounded-full h-1 overflow-hidden border border-amber-500/20">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${parentBeacon.goal.progress || 0}%` }}
            />
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onOpenAddPlanModal(catId, parentBeacon.parentInfo.parentHorizon, parentBeacon.parentInfo.parentPeriodKey, 'progress', true)}
        className="w-full p-2 rounded-xl bg-slate-950/40 hover:bg-amber-500/5 border border-dashed border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between gap-2 mb-3.5"
        title={`Задать главную цель на ${parentBeacon.parentInfo.parentLabel}`}
      >
        <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-amber-300 transition-colors">
          <Star className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-[11px]">
            Главная цель на {parentBeacon.parentInfo.parentLabel} не задана
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-400/90 group-hover:text-amber-300 flex items-center gap-0.5">
          <span>+ Задать</span>
        </span>
      </button>
    );
  };

  // --- Goal Card Render Helper ---
  const renderGoalCard = (goal, cat) => {
    const isEditing = editingPlanId === goal.id;
    const isCompleted = goal.progress === 100;
    const isKey = !!goal.isKeyGoal;
    const daysLeft = goal.deadline ? getDaysRemaining(goal.deadline) : null;

    return (
      <div
        key={goal.id}
        className={`p-3 rounded-xl border transition-all ${
          isKey
            ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
            : isCompleted
              ? 'bg-slate-900/60 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              {/* Star Key Goal Toggle */}
              <button
                type="button"
                onClick={() => onToggleKeyPlan && onToggleKeyPlan(goal.id)}
                className={`p-1 rounded-md transition-colors ${
                  isKey
                    ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10'
                    : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title={isKey ? 'Главная цель периода (кликните, чтобы снять)' : 'Сделать главной целью периода (North Star)'}
              >
                <Star className={`w-3.5 h-3.5 ${isKey ? 'fill-amber-400' : ''}`} />
              </button>

              {isKey && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                  ★ Главная
                </span>
              )}

              {isCompleted ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Достигнута
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {goal.progress}%
                </span>
              )}

              {goal.deadline && (
                <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-slate-500" />
                  {daysLeft > 0 ? (
                    <span>до {formatDateRu(goal.deadline)} ({daysLeft} дн.)</span>
                  ) : daysLeft === 0 ? (
                    <span className="text-amber-400">Дедлайн сегодня</span>
                  ) : (
                    <span className="text-rose-400">Просрочено</span>
                  )}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveInlineEdit(goal.id);
                    if (e.key === 'Escape') setEditingPlanId(null);
                  }}
                  autoFocus
                  className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white"
                />
                <button
                  onClick={() => handleSaveInlineEdit(goal.id)}
                  className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded"
                >
                  ОК
                </button>
              </div>
            ) : (
              <h4
                onClick={() => {
                  setEditingPlanId(goal.id);
                  setEditTitleValue(goal.title);
                }}
                className={`text-xs font-semibold cursor-pointer truncate ${
                  isKey 
                    ? 'text-amber-200 hover:text-amber-100 font-bold'
                    : isCompleted 
                      ? 'text-emerald-300' 
                      : 'text-slate-100 hover:text-cyan-300'
                }`}
                title="Кликните для редактирования названия цели"
              >
                {goal.title}
              </h4>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onOpenEditPlanModal && onOpenEditPlanModal(goal)}
              className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
              title="Редактировать цель и дедлайн"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onStartTimerForPlan(goal)}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
              title="Запустить Deep Work таймер на эту цель"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
            <button
              onClick={() => onDeletePlan(goal.id)}
              className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
              title="Удалить цель"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.2 border border-slate-800 mb-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-emerald-400' : cat.barClass
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>

        {/* Quick Adjustment Buttons */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdatePlanProgress(goal.id, Math.max(0, goal.progress - 10))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="-10%"
            >
              -10%
            </button>
            <button
              onClick={() => onUpdatePlanProgress(goal.id, Math.min(100, goal.progress + 10))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="+10%"
            >
              +10%
            </button>
            <button
              onClick={() => onUpdatePlanProgress(goal.id, Math.min(100, goal.progress + 25))}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="+25%"
            >
              +25%
            </button>
          </div>

          <button
            onClick={() => onUpdatePlanProgress(goal.id, isCompleted ? 0 : 100)}
            className={`px-2 py-0.5 rounded font-semibold transition-all ${
              isCompleted
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30'
            }`}
            title={isCompleted ? 'Сбросить готовность' : 'Отметить как выполненную (100%)'}
          >
            {isCompleted ? 'Сброс' : '100% ✓'}
          </button>
        </div>
      </div>
    );
  };

  // --- Task Item Render Helper ---
  const renderTaskItem = (task, cat) => {
    const isEditing = editingPlanId === task.id;

    return (
      <div
        key={task.id}
        className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
          task.completed
            ? 'bg-slate-900/30 border-slate-800/40 text-slate-500'
            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggle(task.id)}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
              : 'border-slate-700 bg-slate-950 hover:border-indigo-400'
          }`}
          title={task.completed ? 'Снять отметку' : 'Отметить выполненной'}
        >
          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Title or Inline edit */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveInlineEdit(task.id);
                  if (e.key === 'Escape') setEditingPlanId(null);
                }}
                autoFocus
                className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
              />
              <button
                onClick={() => handleSaveInlineEdit(task.id)}
                className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded"
              >
                ОК
              </button>
            </div>
          ) : (
            <span
              onClick={() => {
                setEditingPlanId(task.id);
                setEditTitleValue(task.title);
              }}
              className={`text-xs cursor-pointer truncate block ${
                task.completed ? 'line-through text-slate-500' : 'text-slate-200'
              }`}
              title="Кликните для редактирования текста задачи"
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {activeHorizon === 'day' && onReschedulePlan && (
            <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onReschedulePlan && task?.id) onReschedulePlan(task.id, getSmartNextDay(dayDate));
                }}
                className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                title={`Перенести на ${dayDate < realTodayKey ? 'сегодня' : 'завтра'} (${formatDateRu(getSmartNextDay(dayDate))})`}
              >
                <ArrowRight className="w-3 h-3" />
              </button>
              <label
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-slate-600 hover:text-cyan-400 cursor-pointer relative"
                title="Выбрать другую дату"
              >
                <Calendar className="w-2.5 h-2.5" />
                <input
                  type="date"
                  value={task.targetPeriod || getSmartNextDay(dayDate)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.value && onReschedulePlan && task?.id) {
                      onReschedulePlan(task.id, e.target.value);
                    }
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          )}

          <button
            onClick={() => onStartTimerForPlan(task)}
            className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            title="Запустить Deep Work таймер на эту задачу"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>

          <button
            onClick={() => onDeletePlan(task.id)}
            className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
            title="Удалить задачу"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm mb-6">
      
      {/* 1. Header & Horizon Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>Горизонты планирования</span>
              
              {/* Separate counters for Goals and Tasks */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" />
                  <span>{completedGoalsCount}/{totalGoalsCount} целей</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                  <CheckSquare className="w-2.5 h-2.5" />
                  <span>{completedTasksCount}/{totalTasksCount} задач</span>
                </span>
              </div>
            </h2>
            <p className="text-[11px] text-slate-400">
              Чёткое разделение стратегических целей и практических задач по 4 сферам
            </p>
          </div>
        </div>

        {/* Horizon tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'day', label: 'День' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'year', label: 'Год' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveHorizon(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeHorizon === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Period Navigator & Custom Date Picker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-5">
        
        {/* DAY NAVIGATOR */}
        {activeHorizon === 'day' && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDayShift(-1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Предыдущий день"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs">
                {getDayFormattedTitle()}
              </div>
              <button
                onClick={() => handleDayShift(1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Следующий день"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick date jumps & custom date picker */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDayDate(formatDateKey(new Date()))}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Сегодня
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDayDate(formatDateKey(tomorrow));
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Завтра
              </button>
              
              {/* Native Calendar Picker */}
              <label className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs cursor-pointer transition-colors" title="Выбрать любую календарную дату">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">Выбрать дату</span>
                <input
                  type="date"
                  value={dayDate}
                  onChange={(e) => {
                    if (e.target.value) setDayDate(e.target.value);
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </>
        )}

        {/* WEEK NAVIGATOR */}
        {activeHorizon === 'week' && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Предыдущая неделя"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold text-white">
                {getWeekLabel(mondayOfWeek)}
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Следующая неделя"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Текущая неделя
            </button>
          </>
        )}

        {/* MONTH NAVIGATOR */}
        {activeHorizon === 'month' && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMonthShift(-1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold text-white">
                {formatMonthLabel(monthDate)}
              </div>
              <button
                onClick={() => handleMonthShift(1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setMonthDate(new Date())}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Текущий месяц
            </button>
          </>
        )}

        {/* YEAR NAVIGATOR */}
        {activeHorizon === 'year' && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleYearShift(-1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Предыдущий год"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-white font-mono">
                {yearNumber} ГОД
              </div>
              <button
                onClick={() => handleYearShift(1)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                title="Следующий год"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setYearNumber(new Date().getFullYear())}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Текущий год
            </button>
          </>
        )}

      </div>

      {/* 2.5 Sphere Selector Tabs */}
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* All spheres tab */}
          <button
            type="button"
            onClick={() => setActiveSphereFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border flex items-center gap-1.5 ${
              activeSphereFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Все 4 сферы</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSphereFilter === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {currentPeriodPlans.length}
            </span>
          </button>

          <div className="w-[1px] h-5 bg-slate-800 mx-1 shrink-0 hidden sm:block" />

          {/* Individual sphere tabs */}
          {Object.values(CATEGORIES).map(cat => {
            const catPlans = currentPeriodPlans.filter(p => p.category === cat.id);
            const isSelected = activeSphereFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveSphereFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? `${cat.badgeClass} ring-1 ring-current font-bold scale-102 shadow-sm`
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-black/30' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  {catPlans.length}
                </span>
              </button>
            );
          })}
        </div>

        {activeSphereFilter !== 'all' && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Фокус: <strong>{CATEGORIES[activeSphereFilter]?.name}</strong></span>
          </div>
        )}
      </div>

      {/* 3. Plans Display: Single Sphere Deep Focus OR All Spheres Grid / Day List */}
      {activeSphereFilter !== 'all' ? (
        /* SINGLE SPHERE DEEP FOCUS VIEW */
        (() => {
          const cat = CATEGORIES[activeSphereFilter] || CATEGORIES.work;
          const spherePlans = currentPeriodPlans.filter(p => p.category === cat.id);
          const sphereGoals = spherePlans.filter(p => p.type === 'progress');
          const sphereTasks = spherePlans.filter(p => p.type === 'checkbox' || !p.type);
          const parentBeacon = getParentKeyGoal(plans, activeHorizon, activePeriodKey, cat.id, { 
            monday: activeHorizon === 'week' ? mondayOfWeek : undefined 
          });

          const closedGoalsCount = sphereGoals.filter(g => g.progress === 100).length;
          const closedTasksCount = sphereTasks.filter(t => t.completed).length;

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-md space-y-5 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${cat.badgeClass}`}>
                    <span className={`w-3.5 h-3.5 rounded-full ${cat.dotClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-wide uppercase">
                        Сфера «{cat.name}»
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-mono border ${cat.badgeClass}`}>
                        {closedGoalsCount}/{sphereGoals.length} целей • {closedTasksCount}/{sphereTasks.length} задач
                      </span>
                    </div>
                    {cat.motto && (
                      <p className="text-xs text-slate-400 italic mt-0.5">
                        «{cat.motto}»
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation: Prev / Next / Exit */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevSphere}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Предыдущая сфера"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden md:inline text-[11px]">Пред. сфера</span>
                    </button>
                    <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={handleNextSphere}
                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Следующая сфера"
                    >
                      <span className="hidden md:inline text-[11px]">След. сфера</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSphereFilter('all')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
                    title="Вернуться ко всем сферам"
                  >
                    Все сферы ✕
                  </button>
                </div>
              </div>

              {/* 2-Column Balanced Layout: Strategy (Left) vs Actions (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* LEFT COLUMN: STRATEGY & GOALS */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Стратегия & Цели
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {closedGoalsCount} из {sphereGoals.length} достигнуто
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey, 'progress')}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        title={`Поставить новую цель в сферу «${cat.name}»`}
                      >
                        <Target className="w-3 h-3" />
                        <span>+ Поставить цель</span>
                      </button>
                    </div>

                    {/* North Star Beacon */}
                    {renderParentBeacon(parentBeacon, cat.id)}

                    {/* Goals List */}
                    {sphereGoals.length === 0 ? (
                      <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/30">
                        <p className="text-xs text-slate-400 mb-1">
                          В сфере «{cat.name}» на этот период пока нет целей.
                        </p>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Поставьте цель с измеримым прогрессом (0-100%).
                        </p>
                        <button
                          onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey, 'progress')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                        >
                          + Поставить первую цель
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {sphereGoals.map(goal => renderGoalCard(goal, cat))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIONS & TASKS */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <CheckSquare className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Действия & Задачи
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {closedTasksCount} из {sphereTasks.length} выполнено
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Task Input Form */}
                    <form onSubmit={(e) => handleQuickTaskSubmit(e, cat.id)} className="flex items-center gap-2 mb-3.5">
                      <input
                        type="text"
                        placeholder={`Новая задача в «${cat.name}» на этот период...`}
                        value={quickTaskTexts[cat.id] || ''}
                        onChange={(e) => handleTaskInputChange(cat.id, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/70 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shrink-0 active:scale-95 shadow-sm shadow-indigo-600/30"
                        title="Добавить задачу (Enter)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </button>
                    </form>

                    {/* Tasks List */}
                    {sphereTasks.length === 0 ? (
                      <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/30">
                        <p className="text-xs text-slate-400 mb-1">
                          Задач в сфере «{cat.name}» на этот период пока нет.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Введите задачу в поле выше и нажмите Enter.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {sphereTasks.map(task => renderTaskItem(task, cat))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })()
      ) : activeHorizon === 'day' && dayViewMode === 'all' ? (
        /* DAY UNIFIED TASKS VIEW */
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Все задачи и цели на {getDayFormattedTitle()}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Сводный список задач по всем 4 сферам жизни на выбранный день
              </p>
            </div>
            <button
              onClick={() => setDayViewMode('spheres')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Режим 4 сфер
            </button>
          </div>

          {currentPeriodPlans.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-900/20">
              <p className="text-xs text-slate-400 mb-1">
                На эту дату пока нет задач и целей.
              </p>
              <p className="text-[11px] text-slate-500">
                Переключитесь на «4 сферы карточками», чтобы добавить задачу в нужную категорию.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(CATEGORIES).map(cat => {
                const spherePlans = currentPeriodPlans.filter(p => p.category === cat.id);
                if (spherePlans.length === 0) return null;

                const sphereGoals = spherePlans.filter(p => p.type === 'progress');
                const sphereTasks = spherePlans.filter(p => p.type === 'checkbox' || !p.type);
                const parentBeacon = getParentKeyGoal(plans, activeHorizon, activePeriodKey, cat.id, { 
                  monday: activeHorizon === 'week' ? mondayOfWeek : undefined 
                });

                return (
                  <div key={cat.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.dotClass}`} />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                          {cat.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${cat.badgeClass}`}>
                          {sphereGoals.length} целей • {sphereTasks.length} задач
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenAddPlanModal(cat.id, 'day', dayDate, 'checkbox')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        + Добавить в «{cat.name}»
                      </button>
                    </div>

                    {/* Parent North Star Beacon */}
                    {parentBeacon && (
                      <div>
                        {parentBeacon.goal ? (
                          <div 
                            onClick={() => onOpenEditPlanModal && onOpenEditPlanModal(parentBeacon.goal)}
                            className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/50 transition-all cursor-pointer group flex items-center justify-between gap-2"
                            title={`Главная цель (${parentBeacon.parentInfo.parentLabel}) — кликните для редактирования`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              <span className="text-[11px] text-amber-200 truncate group-hover:text-amber-100 font-medium">
                                <span className="text-[10px] uppercase font-bold text-amber-400 mr-1">Ориентир недели:</span>
                                {parentBeacon.goal.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0 bg-amber-500/20 px-1.5 py-0.5 rounded">
                              {parentBeacon.goal.progress || 0}%
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenAddPlanModal(cat.id, parentBeacon.parentInfo.parentHorizon, parentBeacon.parentInfo.parentPeriodKey, 'progress', true)}
                            className="w-full p-1.5 rounded-lg border border-dashed border-slate-800 hover:border-amber-500/40 text-left transition-colors flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-300"
                          >
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-slate-500" />
                              <span>Главная цель недели не задана</span>
                            </span>
                            <span className="text-[10px] font-semibold text-amber-400">+ Задать</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Goals */}
                    {sphereGoals.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Цели</span>
                        {sphereGoals.map(goal => (
                          <div key={goal.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/70 flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-200 font-medium">{goal.title}</span>
                            <span className="text-cyan-400 font-mono text-[11px]">{goal.progress || 0}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {sphereTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Задачи</span>
                        {sphereTasks.map(task => renderTaskItem(task, cat))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 4 SPHERES GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(CATEGORIES).map(cat => {
            const spherePlans = currentPeriodPlans.filter(p => p.category === cat.id);
            const sphereGoals = spherePlans.filter(p => p.type === 'progress');
            const sphereTasks = spherePlans.filter(p => p.type === 'checkbox' || !p.type);
            const parentBeacon = getParentKeyGoal(plans, activeHorizon, activePeriodKey, cat.id, { 
              monday: activeHorizon === 'week' ? mondayOfWeek : undefined 
            });

            const closedGoalsCount = sphereGoals.filter(g => g.progress === 100).length;
            const closedTasksCount = sphereTasks.filter(t => t.completed).length;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Sphere Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800/80 mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.dotClass}`} />
                        <h3 
                          onClick={() => setActiveSphereFilter(cat.id)}
                          className="text-xs font-bold text-slate-200 uppercase tracking-wide cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-1"
                          title="Кликните, чтобы сфокусироваться только на этой сфере"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-indigo-400 opacity-80">→</span>
                        </h3>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${cat.badgeClass}`}>
                          {sphereGoals.length} целей • {sphereTasks.length} задач
                        </span>
                      </div>
                      {cat.motto && (
                        <p className="text-[11px] text-slate-400 italic leading-snug">
                          «{cat.motto}»
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveSphereFilter(cat.id)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition-colors"
                        title="Открыть сферу в отдельном фокусе"
                      >
                        Фокус
                      </button>
                      <button
                        onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey, 'progress')}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                        title={`Добавить цель в сферу «${cat.name}»`}
                      >
                        <Target className="w-3 h-3" />
                        <span>+ Цель</span>
                      </button>
                    </div>
                  </div>

                  {/* North Star Beacon */}
                  {renderParentBeacon(parentBeacon, cat.id)}

                  {/* Goals */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-200 tracking-wide">Цели периода</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                          {closedGoalsCount} из {sphereGoals.length}
                        </span>
                      </div>
                    </div>

                    {sphereGoals.length === 0 ? (
                      <div className="py-3 px-3 text-center rounded-xl border border-dashed border-slate-800/60 bg-slate-900/20 mb-2">
                        <p className="text-[11px] text-slate-500 mb-1.5">
                          Стратегических целей на этот период пока нет.
                        </p>
                        <button
                          onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey, 'progress')}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
                        >
                          + Поставить первую цель
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-2">
                        {sphereGoals.map(goal => renderGoalCard(goal, cat))}
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200 tracking-wide">Задачи периода</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                          {closedTasksCount} из {sphereTasks.length}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleQuickTaskSubmit(e, cat.id)} className="flex items-center gap-1.5 mb-2.5">
                      <input
                        type="text"
                        placeholder={`Добавить задачу в ${cat.name}...`}
                        value={quickTaskTexts[cat.id] || ''}
                        onChange={(e) => handleTaskInputChange(cat.id, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/70 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shrink-0 active:scale-95 shadow-sm"
                        title="Добавить задачу (Enter)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {sphereTasks.length === 0 ? (
                      <div className="py-2.5 px-3 text-center rounded-xl border border-dashed border-slate-800/60 bg-slate-900/20">
                        <p className="text-[11px] text-slate-500">
                          Задач пока нет. Введите задачу выше и нажмите Enter.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                        {sphereTasks.map(task => renderTaskItem(task, cat))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
