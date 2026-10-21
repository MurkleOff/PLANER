import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Minus, 
  Trash2, 
  Edit3, 
  Play, 
  Target, 
  Sparkles,
  Clock,
  Compass
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
  DAYS_FULL
} from '../utils/dateUtils';
import { sound } from '../utils/audio';

export default function PlanningHorizons({
  plans = [],
  onTogglePlan,
  onUpdatePlanProgress,
  onUpdatePlanTitle,
  onDeletePlan,
  onStartTimerForPlan,
  onOpenAddPlanModal,
  onOpenEditPlanModal,
}) {
  const [activeHorizon, setActiveHorizon] = useState('day'); // 'day' | 'week' | 'month' | 'year'

  // Current navigation states for each horizon
  const [dayDate, setDayDate] = useState(() => formatDateKey(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [yearNumber, setYearNumber] = useState(() => new Date().getFullYear());

  // Editing state for inline text edit
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

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

  // Period Navigation Handlers
  const handleDayShift = (deltaDays) => {
    const d = new Date(dayDate);
    d.setDate(d.getDate() + deltaDays);
    setDayDate(formatDateKey(d));
  };

  const handleMonthShift = (deltaMonths) => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + deltaMonths);
    setMonthDate(d);
  };

  const handleYearShift = (deltaYears) => {
    setYearNumber(prev => prev + deltaYears);
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

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm mb-6">
      
      {/* 1. Header & Horizon Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Горизонты планирования</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {currentPeriodPlans.length} планов
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Гибкие планы на день, неделю, месяц и год по 4 сферам
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
              
              {/* Native Calendar Picker for ANY date */}
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

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
              >
                К текущей неделе
              </button>
            )}
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
                {formatMonthLabel(currentMonthKey)}
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

      {/* 3. 4 Spheres Categorized Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(CATEGORIES).map(cat => {
          const spherePlans = currentPeriodPlans.filter(p => p.category === cat.id);

          return (
            <div
              key={cat.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Sphere Header */}
                <div className="flex items-start justify-between pb-2.5 border-b border-slate-800/80 mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.dotClass}`} />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        {cat.name}
                      </h3>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${cat.badgeClass}`}>
                        {spherePlans.length}
                      </span>
                    </div>
                    {cat.motto && (
                      <p className="text-[11px] text-slate-400 italic leading-snug">
                        «{cat.motto}»
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-all shrink-0 active:scale-95"
                    title={`Добавить цель или задачу в сферу «${cat.name}»`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Добавить</span>
                  </button>
                </div>

                {/* Sphere Plans List */}
                {spherePlans.length === 0 ? (
                  /* Empty state for this sphere */
                  <div className="py-6 px-3 text-center rounded-lg border border-dashed border-slate-800/70 bg-slate-900/30">
                    <p className="text-xs text-slate-500 mb-2.5">
                      В сфере «{cat.name}» пока нет планов на этот {activeHorizon === 'day' ? 'день' : activeHorizon === 'week' ? 'период недели' : activeHorizon === 'month' ? 'месяц' : 'год'}.
                    </p>
                    <button
                      onClick={() => onOpenAddPlanModal(cat.id, activeHorizon, activePeriodKey)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700/60"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Поставить план</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {spherePlans.map(plan => {
                      const isEditing = editingPlanId === plan.id;
                      const daysLeft = plan.deadline ? getDaysRemaining(plan.deadline) : null;

                      // A) Checkbox Task
                      if (plan.type === 'checkbox') {
                        return (
                          <div
                            key={plan.id}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                              plan.completed
                                ? 'bg-slate-900/40 border-emerald-500/30 text-slate-500'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <button
                              onClick={() => handleToggle(plan.id)}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                plan.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                  : 'border-slate-700 bg-slate-950 hover:border-indigo-400'
                              }`}
                            >
                              {plan.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineEdit(plan.id);
                                      if (e.key === 'Escape') setEditingPlanId(null);
                                    }}
                                    autoFocus
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white"
                                  />
                                  <button
                                    onClick={() => handleSaveInlineEdit(plan.id)}
                                    className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded"
                                  >
                                    ОК
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingPlanId(plan.id);
                                    setEditTitleValue(plan.title);
                                  }}
                                  className={`text-xs cursor-pointer truncate ${
                                    plan.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                  }`}
                                  title="Кликните для редактирования"
                                >
                                  {plan.title}
                                </div>
                              )}

                              {plan.deadline && (
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>до {formatDateRu(plan.deadline)}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onStartTimerForPlan(plan)}
                                className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                                title="Запустить таймер фокуса"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                              <button
                                onClick={() => onDeletePlan(plan.id)}
                                className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // B) Progress Goal (0-100%)
                      return (
                        <div
                          key={plan.id}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveInlineEdit(plan.id);
                                      if (e.key === 'Escape') setEditingPlanId(null);
                                    }}
                                    autoFocus
                                    className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white"
                                  />
                                  <button
                                    onClick={() => handleSaveInlineEdit(plan.id)}
                                    className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded"
                                  >
                                    ОК
                                  </button>
                                </div>
                              ) : (
                                <h4
                                  onClick={() => {
                                    setEditingPlanId(plan.id);
                                    setEditTitleValue(plan.title);
                                  }}
                                  className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-indigo-300"
                                  title="Кликните для редактирования"
                                >
                                  {plan.title}
                                </h4>
                              )}

                              {plan.deadline && (
                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  {daysLeft > 0 ? (
                                    <span>Осталось {daysLeft} дн.</span>
                                  ) : daysLeft === 0 ? (
                                    <span className="text-amber-400">Дедлайн сегодня</span>
                                  ) : (
                                    <span className="text-rose-400">Просрочено</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onDeletePlan(plan.id)}
                                className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                                title="Удалить цель"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Progress slider / buttons */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                            <span>Готовность:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onUpdatePlanProgress(plan.id, Math.max(0, plan.progress - 5))}
                                className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                                title="-5%"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-bold text-slate-200 min-w-[32px] text-center text-xs">
                                {plan.progress}%
                              </span>
                              <button
                                onClick={() => onUpdatePlanProgress(plan.id, Math.min(100, plan.progress + 5))}
                                className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                                title="+5%"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.2 border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${cat.barClass}`}
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
