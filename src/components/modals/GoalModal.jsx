import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { CATEGORIES } from '../../constants/initialData';

export default function GoalModal({
  isOpen,
  onClose,
  goalToEdit,
  onSaveGoal,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('personality');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setCategory(goalToEdit.category || 'personality');
      setTargetDate(goalToEdit.targetDate || '');
      setProgress(goalToEdit.progress || 0);
    } else {
      setTitle('');
      setCategory('personality');
      // Default deadline ~3 months ahead
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      setTargetDate(d.toISOString().split('T')[0]);
      setProgress(0);
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    onSaveGoal({
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      title: title.trim(),
      category,
      targetDate,
      progress: Number(progress),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {goalToEdit ? 'Редактировать большую цель' : 'Новая глобальная цель'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Название цели или норматива
            </label>
            <input
              type="text"
              required
              placeholder="например: Сдача нормативов ГТО на золото"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Категория
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CATEGORIES).map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all ${
                    category === cat.id
                      ? `${cat.badgeClass} ring-1 ring-current font-bold`
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cat.dotClass}`} />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Дата дедлайна
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

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
