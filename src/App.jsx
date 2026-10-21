import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';

import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import FocusTimer from './components/FocusTimer';
import TodayFocusRoutine from './components/TodayFocusRoutine';
import PlanningHorizons from './components/PlanningHorizons';
import WeekChart from './components/WeekChart';
import WeeklyMatrix from './components/WeeklyMatrix';

import CloudSyncModal from './components/modals/CloudSyncModal';
import BackupModal from './components/modals/BackupModal';
import HabitModal from './components/modals/HabitModal';
import PlanModal from './components/modals/PlanModal';

import { 
  INITIAL_HABITS, 
  INITIAL_PLANS, 
  INITIAL_TOP_TASKS, 
  INITIAL_INBOX 
} from './constants/initialData';

import { 
  getMondayOfWeek, 
  getWeekDays, 
  formatDateKey 
} from './utils/dateUtils';

import { 
  calculateDailyCharge, 
  calculateDisciplineIndex, 
  calculateWeekDynamics,
  calculateSmartStreak 
} from './utils/metrics';

import { sound } from './utils/audio';
import { pushToSupabase, pullFromSupabase } from './services/supabaseSync';

const STORAGE_KEY = 'discipline_panel_state_v3';

export default function App() {
  // --- 1. Load initial state from LocalStorage ---
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          habits: parsed.habits || INITIAL_HABITS,
          plans: parsed.plans || INITIAL_PLANS,
          tasksByDate: parsed.tasksByDate || {},
          inboxTasks: parsed.inboxTasks || INITIAL_INBOX,
          habitLogs: parsed.habitLogs || {},
          focusMinutesByDate: parsed.focusMinutesByDate || {},
          supabaseConfig: parsed.supabaseConfig || {
            supabaseUrl: '',
            supabaseAnonKey: '',
            syncId: '',
          },
          historyArchive: parsed.historyArchive || {},
          theme: parsed.theme || 'dark',
        };
      }
    } catch (e) {
      console.warn('Failed to parse localStorage:', e);
    }

    return {
      habits: INITIAL_HABITS,
      plans: INITIAL_PLANS,
      tasksByDate: {},
      inboxTasks: INITIAL_INBOX,
      habitLogs: {},
      focusMinutesByDate: {},
      supabaseConfig: {
        supabaseUrl: '',
        supabaseAnonKey: '',
        syncId: '',
      },
      historyArchive: {},
      theme: 'dark',
    };
  });

  // --- 2. Persist state to LocalStorage & Debounced Cloud Sync ---
  const [syncStatus, setSyncStatus] = useState({
    connected: false,
    synced: false,
    isSyncing: false,
    lastSyncedAt: null,
  });

  const isInitialMount = useRef(true);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }

    // Auto-sync debounce to Supabase if configured
    const { supabaseUrl, supabaseAnonKey, syncId } = state.supabaseConfig || {};
    if (supabaseUrl && supabaseAnonKey && syncId) {
      setSyncStatus(prev => ({ ...prev, connected: true }));

      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          setSyncStatus(prev => ({ ...prev, isSyncing: true }));
          const res = await pushToSupabase(state.supabaseConfig, state);
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            synced: true,
            lastSyncedAt: res.updatedAt,
          }));
        } catch (err) {
          console.warn('Auto cloud sync failed:', err);
          setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        }
      }, 3000);
    } else {
      setSyncStatus(prev => ({ ...prev, connected: false }));
    }
  }, [state]);

  // --- 3. Calendar & Week Selection ---
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => {
    return getMondayOfWeek(new Date(), weekOffset);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return getWeekDays(monday);
  }, [monday]);

  // Default selected day: today (if in current week) or Monday
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // 0 = Mon, 6 = Sun
  });

  const activeDay = weekDays[selectedDayIndex] || weekDays[0];
  const activeDateKey = activeDay.dateKey;

  // --- 4. Daily Tasks for Active Date ---
  const topTasksForActiveDate = useMemo(() => {
    const existing = state.tasksByDate[activeDateKey];
    if (existing && existing.length === 3) return existing;
    return [
      { id: `top-${activeDateKey}-1`, text: '', completed: false },
      { id: `top-${activeDateKey}-2`, text: '', completed: false },
      { id: `top-${activeDateKey}-3`, text: '', completed: false },
    ];
  }, [state.tasksByDate, activeDateKey]);

  // --- 5. Metrics Calculations ---
  const dailyChargeMetrics = useMemo(() => {
    return calculateDailyCharge(
      state.habits,
      weekDays,
      selectedDayIndex,
      activeDateKey,
      state.habitLogs,
      topTasksForActiveDate
    );
  }, [state.habits, weekDays, selectedDayIndex, activeDateKey, state.habitLogs, topTasksForActiveDate]);

  const disciplineMetrics = useMemo(() => {
    return calculateDisciplineIndex(state.habits, weekDays, state.habitLogs);
  }, [state.habits, weekDays, state.habitLogs]);

  const weekDynamics = useMemo(() => {
    return calculateWeekDynamics(state.habits, weekDays, state.habitLogs, state.tasksByDate);
  }, [state.habits, weekDays, state.habitLogs, state.tasksByDate]);

  const totalStreakCount = useMemo(() => {
    return state.habits.reduce((acc, h) => {
      const s = calculateSmartStreak(h, weekDays, selectedDayIndex, state.habitLogs);
      return acc + s;
    }, 0);
  }, [state.habits, weekDays, selectedDayIndex, state.habitLogs]);

  const todayFocusMinutes = state.focusMinutesByDate[activeDateKey] || 0;

  // --- 6. Celebratory Confetti on 100% Daily Charge ---
  const prevChargeRef = useRef(dailyChargeMetrics.dailyCharge);
  useEffect(() => {
    if (dailyChargeMetrics.dailyCharge === 100 && prevChargeRef.current < 100 && (state.habits.length > 0 || topTasksForActiveDate.some(t => t.completed))) {
      sound.playCelebrationChime();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
        });
      } catch (e) {
        // Confetti fallback
      }
    }
    prevChargeRef.current = dailyChargeMetrics.dailyCharge;
  }, [dailyChargeMetrics.dailyCharge, state.habits.length, topTasksForActiveDate]);

  // --- 7. Modals State ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  
  const [habitModalData, setHabitModalData] = useState({ 
    isOpen: false, 
    habit: null, 
    defaultCategory: 'personality' 
  });
  
  const [planModalData, setPlanModalData] = useState({ 
    isOpen: false, 
    plan: null, 
    defaultCategory: 'personality', 
    defaultHorizon: 'day', 
    defaultPeriod: '',
    defaultType: 'progress' 
  });

  // --- 8. Theme State ---
  const [isDark, setIsDark] = useState(state.theme !== 'light');
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      setState(prev => ({ ...prev, theme: 'dark' }));
    } else {
      document.documentElement.classList.remove('dark');
      setState(prev => ({ ...prev, theme: 'light' }));
    }
  }, [isDark]);

  // --- 9. Handlers & Actions ---

  // Habit Toggle
  const handleToggleHabit = (habitId, dateKey) => {
    const key = `${habitId}_${dateKey}`;
    setState(prev => ({
      ...prev,
      habitLogs: {
        ...prev.habitLogs,
        [key]: !prev.habitLogs[key],
      },
    }));
  };

  // Top Task Toggle
  const handleToggleTopTask = (taskId, dateKey) => {
    setState(prev => {
      const currentList = prev.tasksByDate[dateKey] || topTasksForActiveDate;
      const updated = currentList.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed };
        }
        return t;
      });
      return {
        ...prev,
        tasksByDate: {
          ...prev.tasksByDate,
          [dateKey]: updated,
        },
      };
    });
  };

  // Top Task Edit Text
  const handleUpdateTopTaskText = (taskId, newText, dateKey) => {
    setState(prev => {
      const currentList = prev.tasksByDate[dateKey] || topTasksForActiveDate;
      const updated = currentList.map(t => {
        if (t.id === taskId) {
          return { ...t, text: newText };
        }
        return t;
      });
      return {
        ...prev,
        tasksByDate: {
          ...prev.tasksByDate,
          [dateKey]: updated,
        },
      };
    });
  };

  // Inbox Task Actions
  const handleAddInboxTask = (text) => {
    setState(prev => ({
      ...prev,
      inboxTasks: [
        ...prev.inboxTasks,
        { id: `inbox-${Date.now()}`, text },
      ],
    }));
  };

  const handleDeleteInboxTask = (id) => {
    setState(prev => ({
      ...prev,
      inboxTasks: prev.inboxTasks.filter(item => item.id !== id),
    }));
  };

  const handlePromoteInboxToTopTask = (inboxId, dateKey) => {
    const item = state.inboxTasks.find(x => x.id === inboxId);
    if (!item) return;

    setState(prev => {
      const currentList = prev.tasksByDate[dateKey] || topTasksForActiveDate;
      let slotIndex = currentList.findIndex(t => !t.text.trim());
      if (slotIndex === -1) slotIndex = 0;

      const updated = [...currentList];
      updated[slotIndex] = {
        ...updated[slotIndex],
        text: item.text,
        completed: false,
      };

      return {
        ...prev,
        inboxTasks: prev.inboxTasks.filter(x => x.id !== inboxId),
        tasksByDate: {
          ...prev.tasksByDate,
          [dateKey]: updated,
        },
      };
    });
  };

  // Habit Add / Edit / Delete
  const handleSaveHabit = (habitData) => {
    setState(prev => {
      const exists = prev.habits.some(h => h.id === habitData.id);
      let updatedHabits;
      if (exists) {
        updatedHabits = prev.habits.map(h => (h.id === habitData.id ? { ...h, ...habitData } : h));
      } else {
        updatedHabits = [...prev.habits, habitData];
      }
      return { ...prev, habits: updatedHabits };
    });
  };

  const handleDeleteHabit = (habitId) => {
    if (!window.confirm('Удалить эту привычку из панели?')) return;
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== habitId),
    }));
  };

  // Plans Handlers (Multi-Horizon)
  const handleSavePlan = (planData) => {
    setState(prev => {
      const exists = prev.plans.some(p => p.id === planData.id);
      let updatedPlans;
      if (exists) {
        updatedPlans = prev.plans.map(p => (p.id === planData.id ? { ...p, ...planData } : p));
      } else {
        updatedPlans = [...prev.plans, planData];
      }
      return { ...prev, plans: updatedPlans };
    });
  };

  const handleTogglePlan = (planId) => {
    setState(prev => ({
      ...prev,
      plans: prev.plans.map(p => {
        if (p.id === planId) {
          const nextCompleted = !p.completed;
          return {
            ...p,
            completed: nextCompleted,
            progress: nextCompleted ? 100 : 0,
          };
        }
        return p;
      }),
    }));
  };

  const handleUpdatePlanProgress = (planId, newProgress) => {
    setState(prev => ({
      ...prev,
      plans: prev.plans.map(p => {
        if (p.id === planId) {
          return {
            ...p,
            progress: newProgress,
            completed: newProgress === 100,
          };
        }
        return p;
      }),
    }));
  };

  const handleUpdatePlanTitle = (planId, newTitle) => {
    setState(prev => ({
      ...prev,
      plans: prev.plans.map(p => {
        if (p.id === planId) {
          return { ...p, title: newTitle };
        }
        return p;
      }),
    }));
  };

  const handleDeletePlan = (planId) => {
    if (!window.confirm('Удалить этот план?')) return;
    setState(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== planId),
    }));
  };

  const handleQuickAddTask = (category, horizon, targetPeriod, text) => {
    if (!text || !text.trim()) return;
    const newPlan = {
      id: `plan-${Date.now()}`,
      title: text.trim(),
      category,
      horizon,
      targetPeriod,
      type: 'checkbox',
      completed: false,
      progress: 0,
      deadline: null,
    };
    setState(prev => ({
      ...prev,
      plans: [...prev.plans, newPlan],
    }));
  };

  const handlePromotePlanToTopTask = (taskTitle, dateKey) => {
    if (!taskTitle) return;
    sound.playCheckmarkClick();
    setState(prev => {
      const currentList = prev.tasksByDate[dateKey] || topTasksForActiveDate;
      let slotIndex = currentList.findIndex(t => !t.text.trim());
      if (slotIndex === -1) slotIndex = 0;

      const updated = [...currentList];
      updated[slotIndex] = {
        ...updated[slotIndex],
        text: taskTitle,
        completed: false,
      };

      return {
        ...prev,
        tasksByDate: {
          ...prev.tasksByDate,
          [dateKey]: updated,
        },
      };
    });
  };

  // Timer complete hook
  const handleCompleteHabitOrTask = ({ type, id, dateKey }) => {
    if (type === 'habit') {
      const key = `${id}_${dateKey}`;
      setState(prev => ({
        ...prev,
        habitLogs: {
          ...prev.habitLogs,
          [key]: true,
        },
      }));
    } else if (type === 'task') {
      setState(prev => {
        const currentList = prev.tasksByDate[dateKey] || topTasksForActiveDate;
        const updated = currentList.map(t => (t.id === id ? { ...t, completed: true } : t));
        return {
          ...prev,
          tasksByDate: {
            ...prev.tasksByDate,
            [dateKey]: updated,
          },
        };
      });
    } else if (type === 'plan') {
      handleTogglePlan(id);
    }
  };

  const handleAddFocusMinutes = (mins) => {
    setState(prev => ({
      ...prev,
      focusMinutesByDate: {
        ...prev.focusMinutesByDate,
        [activeDateKey]: (prev.focusMinutesByDate[activeDateKey] || 0) + mins,
      },
    }));
  };

  const handleStartTimerForHabit = (habit) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTimerForTask = (task) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTimerForPlan = (plan) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // New Week Reset & Archive
  const handleStartNewWeek = () => {
    if (!window.confirm('Зафиксировать текущую неделю в архив и обнулить отметки для старта новой недели?')) {
      return;
    }

    setState(prev => {
      const updatedHabits = prev.habits.map(habit => {
        const currentStreak = calculateSmartStreak(habit, weekDays, 6, prev.habitLogs);
        return {
          ...habit,
          baseStreak: currentStreak,
        };
      });

      setWeekOffset(prevOffset => prevOffset + 1);

      return {
        ...prev,
        habits: updatedHabits,
      };
    });
  };

  // Cloud Sync Actions
  const handleSaveSyncConfig = (config) => {
    setState(prev => ({ ...prev, supabaseConfig: config }));
  };

  const handleManualPushSync = async (config) => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const res = await pushToSupabase(config, state);
      setSyncStatus({
        connected: true,
        synced: true,
        isSyncing: false,
        lastSyncedAt: res.updatedAt,
      });
      alert('Данные успешно выгружены в Supabase!');
    } catch (e) {
      alert(e.message);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleManualPullSync = async (config) => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const res = await pullFromSupabase(config);
      if (res.found && res.payload) {
        setState(res.payload);
        setSyncStatus({
          connected: true,
          synced: true,
          isSyncing: false,
          lastSyncedAt: res.updatedAt,
        });
        alert('Данные успешно загружены из Supabase!');
      } else {
        alert('В облаке пока нет сохранённых данных с таким Sync ID.');
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      }
    } catch (e) {
      alert(e.message);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Full State Restore from Backup
  const handleRestoreState = (restoredState) => {
    setState(restoredState);
  };

  // Reset all progress to clean 0%
  const handleResetAllProgress = () => {
    if (!window.confirm('Сбросить весь прогресс к 0% (обнулить все отметки за дни, серии и прогресс целей)? Названия ваших привычек и задач останутся.')) {
      return;
    }
    const todayKey = formatDateKey(new Date());
    setState(prev => ({
      ...prev,
      habitLogs: {},
      focusMinutesByDate: {},
      habits: prev.habits.map(h => ({ ...h, baseStreak: 0 })),
      plans: prev.plans.map(p => ({ ...p, completed: false, progress: 0 })),
      tasksByDate: {
        ...prev.tasksByDate,
        [todayKey]: (prev.tasksByDate[todayKey] || topTasksForActiveDate).map(t => ({ ...t, completed: false })),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* 1. Header */}
      <Header
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
        monday={monday}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onStartNewWeek={handleStartNewWeek}
        syncStatus={syncStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* 2. Top Metrics Bar */}
        <MetricsBar
          dailyChargeMetrics={dailyChargeMetrics}
          disciplineMetrics={disciplineMetrics}
          totalStreakCount={totalStreakCount}
          todayFocusMinutes={todayFocusMinutes}
        />

        {/* 3. Middle 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
          
          {/* Left Column: Today's Focus & Routine (7 cols) */}
          <div className="lg:col-span-7">
            <TodayFocusRoutine
              weekDays={weekDays}
              selectedDayIndex={selectedDayIndex}
              setSelectedDayIndex={setSelectedDayIndex}
              habits={state.habits}
              habitLogs={state.habitLogs}
              onToggleHabit={handleToggleHabit}
              topTasks={topTasksForActiveDate}
              onToggleTopTask={handleToggleTopTask}
              onUpdateTopTaskText={handleUpdateTopTaskText}
              inboxTasks={state.inboxTasks}
              onAddInboxTask={handleAddInboxTask}
              onDeleteInboxTask={handleDeleteInboxTask}
              onPromoteInboxToTopTask={handlePromoteInboxToTopTask}
              onStartTimerForHabit={handleStartTimerForHabit}
              onStartTimerForTask={handleStartTimerForTask}
              onOpenAddHabitModal={(catId) => setHabitModalData({ isOpen: true, habit: null, defaultCategory: catId || 'personality' })}
            />
          </div>

          {/* Right Column: Deep Work Timer & Week Dynamics Chart (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <FocusTimer
              habits={state.habits}
              topTasks={topTasksForActiveDate}
              activeDateKey={activeDateKey}
              onCompleteHabitOrTask={handleCompleteHabitOrTask}
              onAddFocusMinutes={handleAddFocusMinutes}
            />

            <WeekChart
              weekDynamics={weekDynamics}
              selectedDayIndex={selectedDayIndex}
              setSelectedDayIndex={setSelectedDayIndex}
            />
          </div>

        </div>

        {/* 4. Multi-Horizon Planning Section (Day / Week / Month / Year by 4 Spheres) */}
        <PlanningHorizons
          plans={state.plans}
          onTogglePlan={handleTogglePlan}
          onUpdatePlanProgress={handleUpdatePlanProgress}
          onUpdatePlanTitle={handleUpdatePlanTitle}
          onDeletePlan={handleDeletePlan}
          onStartTimerForPlan={handleStartTimerForPlan}
          onQuickAddTask={handleQuickAddTask}
          onPromotePlanToTopTask={handlePromotePlanToTopTask}
          onOpenAddPlanModal={(catId, horizon, period, type = 'progress') => {
            setPlanModalData({
              isOpen: true,
              plan: null,
              defaultCategory: catId,
              defaultHorizon: horizon,
              defaultPeriod: period,
              defaultType: type,
            });
          }}
          onOpenEditPlanModal={(plan) => {
            setPlanModalData({
              isOpen: true,
              plan,
              defaultCategory: plan.category,
              defaultHorizon: plan.horizon,
              defaultPeriod: plan.targetPeriod,
              defaultType: plan.type || 'progress',
            });
          }}
        />

        {/* 5. Bottom Full-Width Weekly Matrix */}
        <WeeklyMatrix
          weekDays={weekDays}
          habits={state.habits}
          habitLogs={state.habitLogs}
          onToggleHabit={handleToggleHabit}
          onOpenAddHabitModal={(catId) => setHabitModalData({ isOpen: true, habit: null, defaultCategory: catId || 'personality' })}
          onOpenEditHabitModal={(habit) => setHabitModalData({ isOpen: true, habit, defaultCategory: habit.category })}
          onDeleteHabit={handleDeleteHabit}
          onStartNewWeek={handleStartNewWeek}
          selectedDayIndex={selectedDayIndex}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Дисциплина & Фокус &bull; Offline-First + Supabase Sync &bull; PWA Ready
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Настройки облака
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              JSON Бэкап
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={state.supabaseConfig}
        onSaveConfig={handleSaveSyncConfig}
        onPushSync={handleManualPushSync}
        onPullSync={handleManualPullSync}
        syncStatus={syncStatus}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        fullState={state}
        onRestoreState={handleRestoreState}
        onResetAllProgress={handleResetAllProgress}
      />

      <HabitModal
        isOpen={habitModalData.isOpen}
        onClose={() => setHabitModalData({ isOpen: false, habit: null, defaultCategory: 'personality' })}
        habitToEdit={habitModalData.habit}
        defaultCategory={habitModalData.defaultCategory}
        onSaveHabit={handleSaveHabit}
      />

      <PlanModal
        isOpen={planModalData.isOpen}
        onClose={() => setPlanModalData(prev => ({ ...prev, isOpen: false, plan: null }))}
        planToEdit={planModalData.plan}
        defaultCategory={planModalData.defaultCategory}
        defaultHorizon={planModalData.defaultHorizon}
        defaultPeriod={planModalData.defaultPeriod}
        defaultType={planModalData.defaultType || 'progress'}
        onSavePlan={handleSavePlan}
      />
    </div>
  );
}
