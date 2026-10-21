import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Volume2, Bell, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

export default function FocusTimer({
  habits,
  topTasks,
  activeDateKey,
  onCompleteHabitOrTask,
  onAddFocusMinutes,
}) {
  const [targetType, setTargetType] = useState('habit'); // 'habit' | 'task' | 'custom'
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [customTargetTitle, setCustomTargetTitle] = useState('');
  const [selectedMinutes, setSelectedMinutes] = useState(45);
  
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState(null);

  const initialTotalSecondsRef = useRef(45 * 60);

  // Set default selected target when habits or topTasks load
  useEffect(() => {
    if (!selectedTargetId && habits.length > 0) {
      setSelectedTargetId(habits[0].id);
      setSelectedMinutes(habits[0].timerMinutes || 45);
      setTimeLeft((habits[0].timerMinutes || 45) * 60);
      initialTotalSecondsRef.current = (habits[0].timerMinutes || 45) * 60;
    }
  }, [habits]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // System time accurate countdown
  useEffect(() => {
    let interval = null;

    if (isRunning && endTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);

        // Update document title for background tabs
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        const activeName = getTargetName();
        document.title = `(${timeFormatted}) ${activeName} — Дисциплина`;

        if (remaining <= 0) {
          clearInterval(interval);
          handleFinish(true);
        }
      }, 500);
    } else {
      document.title = 'Дисциплина & Фокус — Панель управления';
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, endTime]);

  const getTargetName = () => {
    if (targetType === 'habit') {
      const h = habits.find(x => x.id === selectedTargetId);
      return h ? h.title : 'Привычка';
    }
    if (targetType === 'task') {
      const t = topTasks.find(x => x.id === selectedTargetId);
      return t ? t.text : 'Главная задача';
    }
    return customTargetTitle || 'Фокус сессия';
  };

  const handleSelectPreset = (mins) => {
    if (isRunning) return;
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    initialTotalSecondsRef.current = mins * 60;
  };

  const handleTargetChange = (e) => {
    const val = e.target.value;
    setSelectedTargetId(val);

    if (targetType === 'habit') {
      const h = habits.find(x => x.id === val);
      if (h && h.timerMinutes) {
        setSelectedMinutes(h.timerMinutes);
        setTimeLeft(h.timerMinutes * 60);
        initialTotalSecondsRef.current = h.timerMinutes * 60;
      }
    }
  };

  const toggleStartPause = () => {
    sound.init(); // warm up Web Audio API

    if (!isRunning) {
      const now = Date.now();
      setEndTime(now + timeLeft * 1000);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setEndTime(null);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(initialTotalSecondsRef.current);
    document.title = 'Дисциплина & Фокус — Панель управления';
  };

  const handleFinish = (wasFullCompletion = true) => {
    setIsRunning(false);
    setEndTime(null);
    setTimeLeft(initialTotalSecondsRef.current);
    document.title = 'Дисциплина & Фокус — Панель управления';

    // 1. Play Meditative Focus Sound (Tibetan bowl gong)
    sound.playCompletionGong();

    // 2. Browser push notification
    const targetName = getTargetName();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎯 Сессия фокуса завершена!', {
          body: `Отличная работа! Задача «${targetName}» зафиксирована и отмечена выполненной.`,
          icon: '/icon.svg',
        });
      } catch (err) {
        // Notification failed or blocked in iframe
      }
    }

    // 3. Mark habit or task as completed for today
    if (targetType === 'habit' && selectedTargetId) {
      onCompleteHabitOrTask({ type: 'habit', id: selectedTargetId, dateKey: activeDateKey });
    } else if (targetType === 'task' && selectedTargetId) {
      onCompleteHabitOrTask({ type: 'task', id: selectedTargetId, dateKey: activeDateKey });
    }

    // 4. Add minutes to focus analytics
    const minutesToAdd = wasFullCompletion 
      ? selectedMinutes 
      : Math.max(1, Math.round((initialTotalSecondsRef.current - timeLeft) / 60));
    onAddFocusMinutes(minutesToAdd);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round(((initialTotalSecondsRef.current - timeLeft) / initialTotalSecondsRef.current) * 100));

  return (
    <div className={`p-4 rounded-2xl bg-slate-900/90 border transition-all relative overflow-hidden ${
      isRunning 
        ? 'border-cyan-500/50 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30' 
        : 'border-slate-800/90 hover:border-slate-700/80'
    }`}>
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Deep Work Таймер
          </h2>
        </div>
        <button
          onClick={() => sound.playCompletionGong()}
          className="text-slate-500 hover:text-cyan-400 p-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
          title="Проверить гонг завершения"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Гонг</span>
        </button>
      </div>

      {/* Target selector pills */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2.5">
        <button
          onClick={() => { setTargetType('habit'); }}
          className={`py-1 text-xs font-medium rounded-lg transition-all ${
            targetType === 'habit'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Привычка
        </button>
        <button
          onClick={() => { setTargetType('task'); }}
          className={`py-1 text-xs font-medium rounded-lg transition-all ${
            targetType === 'task'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Топ-3 дня
        </button>
        <button
          onClick={() => { setTargetType('custom'); }}
          className={`py-1 text-xs font-medium rounded-lg transition-all ${
            targetType === 'custom'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Свой фокус
        </button>
      </div>

      {/* Target Dropdown / Input */}
      <div className="mb-3">
        {targetType === 'habit' ? (
          habits.length === 0 ? (
            <div className="text-xs text-slate-500 py-1.5 px-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              Нет добавленных привычек. Добавьте привычку или выберите «Свой фокус».
            </div>
          ) : (
            <select
              value={selectedTargetId}
              onChange={handleTargetChange}
              disabled={isRunning}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              {habits.map(h => (
                <option key={h.id} value={h.id}>
                  {h.title} ({h.timerMinutes || 45}м)
                </option>
              ))}
            </select>
          )
        ) : targetType === 'task' ? (
          topTasks.filter(t => t.text.trim()).length === 0 ? (
            <div className="text-xs text-slate-500 py-1.5 px-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              Задачи на день не заданы. Введите задачу в Топ-3 или выберите «Свой фокус».
            </div>
          ) : (
            <select
              value={selectedTargetId}
              onChange={handleTargetChange}
              disabled={isRunning}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              {topTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.text || `Слот задачи`} {t.completed ? '✓' : ''}
                </option>
              ))}
            </select>
          )
        ) : (
          <input
            type="text"
            placeholder="Введите название сессии фокуса..."
            value={customTargetTitle}
            onChange={(e) => setCustomTargetTitle(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        )}
      </div>

      {/* Presets */}
      <div className="flex items-center gap-1.5 mb-4">
        {[15, 30, 45, 60].map(mins => (
          <button
            key={mins}
            onClick={() => handleSelectPreset(mins)}
            disabled={isRunning}
            className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedMinutes === mins
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            {mins}м
          </button>
        ))}
      </div>

      {/* Digital Timer Display */}
      <div className="text-center py-2 mb-3 bg-slate-950/60 rounded-xl border border-slate-800/60 relative">
        <div className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-wider transition-colors ${
          isRunning ? 'text-cyan-400' : 'text-slate-100'
        }`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-1">
          {progressPercent}% выполнено · {getTargetName()}
        </div>
        {/* Sub progress line */}
        <div className="w-full h-1 bg-slate-800 rounded-b-xl overflow-hidden absolute bottom-0 left-0">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleStartPause}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Пауза</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Старт фокуса</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 transition-all active:scale-95"
          title="Сбросить таймер"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleFinish(false)}
          className="py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          title="Завершить и отметить выполненным прямо сейчас"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">Засчитать</span>
        </button>
      </div>

    </div>
  );
}
