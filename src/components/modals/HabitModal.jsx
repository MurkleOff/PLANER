import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Calendar, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../constants/initialData';
import { DAYS_SHORT, DAYS_FULL } from '../../utils/dateUtils';

export default function HabitModal({
  isOpen,
  onClose,
  habitToEdit,
  defaultCategory = 'personality',
  onSaveHabit,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [targetPerWeek, setTargetPerWeek] = useState(4);
  const [scheduledDays, setScheduledDays] = useState([0, 2, 4]); // 0=Пн..6=Вс
  const [timerMinutes, setTimerMinutes] = useState(45);
  const [baseStreak, setBaseStreak] = useState(0);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title || '');
      setCategory(habitToEdit.category || defaultCategory);
      const quota = habitToEdit.targetPerWeek || 7;
      setTargetPerWeek(quota);
      setScheduledDays(
        habitToEdit.scheduledDays && habitToEdit.scheduledDays.length > 0
          ? habitToEdit.scheduledDays
          : quota === 7 
            ? [0, 1, 2, 3, 4, 5, 6] 
            : [0, 2, 4].slice(0, quota)
      );
      setTimerMinutes(habitToEdit.timerMinutes || 45);
      setBaseStreak(habitToEdit.baseStreak || 0);
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setTargetPerWeek(3);
      setScheduledDays([0, 2, 4]); // default Mon-Wed-Fri
      setTimerMinutes(45);
      setBaseStreak(0);
    }
  }, [habitToEdit, isOpen, defaultCategory]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex) => {
    setScheduledDays(prev => {
      let next;
      if (prev.includes(dayIndex)) {
        next = prev.filter(d => d !== dayIndex);
      } else {
        next = [...prev, dayIndex].sort((a, b) => a - b);
      }
      setTargetPerWeek(Math.max(1, next.length));
      return next;
    });
  };

  const applyPreset = (days) => {
    setScheduledDays(days);
    setTargetPerWeek(days.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveHabit({
      id: habitToEdit ? habitToEdit.id : `habit-${Date.now()}`,
      title: title.trim(),
      category,
      targetPerWeek: Number(targetPerWeek),
      scheduledDays: scheduledDays.length > 0 ? scheduledDays : [0, 1, 2, 3, 4, 5, 6].slice(0, targetPerWeek),
      timerMinutes: Number(timerMinutes),
      baseStreak: Number(baseStreak),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {habitToEdit ? 'Редактировать привычку' : 'Новая привычка'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Название привычки
            </label>
            <input
              type="text"
              required
              placeholder="например: Силовая тренировка или Чтение"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Сфера деятельности
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CATEGORIES).map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    category === cat.id
                      ? `${cat.badgeClass} ring-1 ring-current font-bold`
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                    <span className="font-semibold text-slate-200">{cat.name}</span>
                  </div>
                  {cat.motto && (
                    <div className="text-[10px] text-slate-400 italic line-clamp-2">
                      «{cat.motto}»
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Desired / Scheduled Days */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Желаемые дни выполнения (Расписание):</span>
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {scheduledDays.length} из 7 дней
              </span>
            </div>

            {/* 7 Days Buttons */}
            <div className="grid grid-cols-7 gap-1.5 mb-2.5">
              {DAYS_SHORT.map((short, idx) => {
                const isSelected = scheduledDays.includes(idx);
                return (
                  <button
                    type="button"
                    key={short}
                    onClick={() => toggleDay(idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                    title={`${DAYS_FULL[idx]}: ${isSelected ? 'Запланировано' : 'День отдыха'}`}
                  >
                    <span>{short}</span>
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-cyan-300' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 mr-1">Быстрый выбор:</span>
              <button
                type="button"
                onClick={() => applyPreset([0, 1, 2, 3, 4, 5, 6])}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Каждый день (7)
              </button>
              <button
                type="button"
                onClick={() => applyPreset([0, 2, 4])}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Пн, Ср, Пт (3)
              </button>
              <button
                type="button"
                onClick={() => applyPreset([1, 3, 5])}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Вт, Чт, Сб (3)
              </button>
              <button
                type="button"
                onClick={() => applyPreset([0, 1, 2, 3, 4])}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Будни (5)
              </button>
              <button
                type="button"
                onClick={() => applyPreset([5, 6])}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Выходные (2)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Квота в неделю (дней)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Таймер фокуса (мин)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Базовая накопленная серия (дней)</span>
            </label>
            <input
              type="number"
              min="0"
              value={baseStreak}
              onChange={(e) => setBaseStreak(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Учитывается при умном расчёте серий.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-indigo-600/30"
            >
              Сохранить
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
