import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, TrendingUp } from 'lucide-react';
import { CATEGORIES } from '../../constants/initialData';

export default function PlanModal({
  isOpen,
  onClose,
  planToEdit,
  defaultCategory = 'personality',
  defaultHorizon = 'day',
  defaultPeriod = '',
  onSavePlan,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [horizon, setHorizon] = useState(defaultHorizon);
  const [targetPeriod, setTargetPeriod] = useState(defaultPeriod);
  const [type, setType] = useState('checkbox'); // 'checkbox' | 'progress'
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (planToEdit) {
      setTitle(planToEdit.title || '');
      setCategory(planToEdit.category || defaultCategory);
      setHorizon(planToEdit.horizon || defaultHorizon);
      setTargetPeriod(planToEdit.targetPeriod || defaultPeriod);
      setType(planToEdit.type || 'checkbox');
      setProgress(planToEdit.progress || 0);
      setDeadline(planToEdit.deadline || '');
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setHorizon(defaultHorizon);
      setTargetPeriod(defaultPeriod);
      setType(defaultHorizon === 'year' ? 'progress' : 'checkbox');
      setProgress(0);
      setDeadline('');
    }
  }, [planToEdit, isOpen, defaultCategory, defaultHorizon, defaultPeriod]);

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
      completed: planToEdit ? planToEdit.completed : false,
      progress: type === 'progress' ? Number(progress) : (planToEdit?.completed ? 100 : 0),
      deadline: deadline || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {planToEdit ? 'Редактировать план / цель' : 'Создать план или цель'}
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
              Название задачи / цели
            </label>
            <input
              type="text"
              required
              placeholder="например: Пробежать 10 км или Сдать проект"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Сфера трекинга
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

          {/* Horizon selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Горизонт плана
              </label>
              <select
                value={horizon}
                onChange={(e) => {
                  setHorizon(e.target.value);
                  if (e.target.value === 'year') setType('progress');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="day">План на день</option>
                <option value="week">План на неделю</option>
                <option value="month">План на месяц</option>
                <option value="year">План на год</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Тип отслеживания
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('checkbox')}
                  className={`py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 transition-all ${
                    type === 'checkbox'
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Чекбокс (Сделано / Не сделано)"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Галочка</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('progress')}
                  className={`py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 transition-all ${
                    type === 'progress'
                      ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Шкала прогресса (0-100%)"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Прогресс %</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress slider (if progress type) */}
          {type === 'progress' && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Текущий прогресс готовности:</span>
                <span className="text-cyan-400 font-mono">{progress}%</span>
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
            </div>
          )}

          {/* Exact deadline date (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Точная дата дедлайна (необязательно)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Submit */}
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
