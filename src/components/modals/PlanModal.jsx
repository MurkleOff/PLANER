import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Target } from 'lucide-react';
import { CATEGORIES } from '../../constants/initialData';

export default function PlanModal({
  isOpen,
  onClose,
  planToEdit,
  defaultCategory = 'personality',
  defaultHorizon = 'day',
  defaultPeriod = '',
  defaultType = 'progress',
  onSavePlan,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [horizon, setHorizon] = useState(defaultHorizon);
  const [targetPeriod, setTargetPeriod] = useState(defaultPeriod);
  const [type, setType] = useState(defaultType); // 'checkbox' | 'progress'
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (planToEdit) {
      setTitle(planToEdit.title || '');
      setCategory(planToEdit.category || defaultCategory);
      setHorizon(planToEdit.horizon || defaultHorizon);
      setTargetPeriod(planToEdit.targetPeriod || defaultPeriod);
      setType(planToEdit.type || 'progress');
      setProgress(planToEdit.progress || 0);
      setDeadline(planToEdit.deadline || '');
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setHorizon(defaultHorizon);
      setTargetPeriod(defaultPeriod);
      setType(defaultType || (defaultHorizon === 'year' ? 'progress' : 'progress'));
      setProgress(0);
      setDeadline('');
    }
  }, [planToEdit, isOpen, defaultCategory, defaultHorizon, defaultPeriod, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSavePlan({
      id: planToEdit ? planToEdit.id : `plan-${Date.now()}`,
      title: title.trim(),
      category,
      horizon,
      targetPeriod: targetPeriod || defaultPeriod,
      type,
      completed: type === 'progress' ? Number(progress) === 100 : (planToEdit ? planToEdit.completed : false),
      progress: type === 'progress' ? Number(progress) : (planToEdit?.completed ? 100 : 0),
      deadline: deadline || null,
    });
    onClose();
  };

  const isGoal = type === 'progress';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isGoal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {isGoal ? <Target className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
            </div>
            <h2 className="text-sm font-bold text-white">
              {planToEdit 
                ? (isGoal ? 'Редактировать цель' : 'Редактировать задачу')
                : (isGoal ? 'Новая цель периода' : 'Новая задача периода')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Тип сущности
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('progress')}
                className={`py-2 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  isGoal
                    ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>🎯 Цель (шкала %)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('checkbox')}
                className={`py-2 px-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  !isGoal
                    ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>☑️ Задача (чекбокс)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isGoal ? 'Формулировка цели' : 'Название задачи'}
            </label>
            <input
              type="text"
              required
              placeholder={isGoal ? "например: Сдать проект или пробежать 50 км за месяц" : "например: Подготовить отчёт в Excel"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category selection */}
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
                  className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
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
                    <div className="text-[10px] text-slate-400 italic line-clamp-1">
                      «{cat.motto}»
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Горизонт планирования
            </label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="day">План на день</option>
              <option value="week">План на неделю</option>
              <option value="month">План на месяц</option>
              <option value="year">План на год</option>
            </select>
          </div>

          {/* Progress slider (if goal) */}
          {isGoal && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Прогресс готовности цели:</span>
                <span className="text-cyan-400 font-mono text-sm font-bold">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setProgress(0)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(25)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(50)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(75)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => setProgress(100)}
                  className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold"
                >
                  100% ✓
                </button>
              </div>
            </div>
          )}

          {/* Exact deadline date (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Целевой дедлайн (необязательно)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
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
