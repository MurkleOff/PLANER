/**
 * Utility functions for smart streak calculations, daily charge, and discipline index
 */

/**
 * Check if a habit is completed on a specific dateKey
 */
export function isHabitDoneOnDate(habit, dateKey, habitLogs = {}) {
  return !!habitLogs[`${habit.id}_${dateKey}`];
}

/**
 * Count how many days a habit was completed in a given week
 */
export function getHabitWeekCompletedCount(habit, weekDays, habitLogs = {}) {
  return weekDays.reduce((count, day) => {
    return isHabitDoneOnDate(habit, day.dateKey, habitLogs) ? count + 1 : count;
  }, 0);
}

/**
 * Smart Streak calculation:
 * - 7/7 quota: consecutive daily streak.
 * - N/7 quota: rest days do not break streak while mathematically achievable this week.
 */
export function calculateSmartStreak(habit, weekDays, currentDayIndex, habitLogs = {}) {
  const base = habit.baseStreak || 0;
  const completedThisWeek = getHabitWeekCompletedCount(habit, weekDays, habitLogs);
  const target = habit.targetPerWeek || 7;

  // Case A: 7/7 daily habit
  if (target === 7) {
    let currentWeekConsecutive = 0;
    // count backwards from today (or latest day)
    for (let i = currentDayIndex; i >= 0; i--) {
      if (isHabitDoneOnDate(habit, weekDays[i].dateKey, habitLogs)) {
        currentWeekConsecutive++;
      } else {
        break;
      }
    }
    return base + currentWeekConsecutive;
  }

  // Case B: Cyclic habit N/7
  // Remaining days in the week after current day
  const remainingDays = Math.max(0, 6 - currentDayIndex);

  if (completedThisWeek >= target) {
    // Quota fully reached!
    return base + 1;
  }

  if (completedThisWeek + remainingDays >= target) {
    // Still mathematically possible to close quota before Sunday!
    return base;
  }

  // Mathematically impossible to meet quota this week
  return 0;
}

/**
 * Calculate Daily Charge (Заряд дня: 0 - 100%)
 * Habits: 60% weight
 * Top 3 Tasks: 40% weight
 */
export function calculateDailyCharge(habits, weekDays, currentDayIndex, dateKey, habitLogs = {}, topTasksForDate = []) {
  // 1. Top Tasks (40%)
  const totalTasks = 3;
  const completedTasks = topTasksForDate.filter(t => t.completed).length;
  const taskPercent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));

  // 2. Habits (60%)
  // Denominator: 7/7 habits + N/7 habits that haven't reached quota yet this week
  let requiredHabits = 0;
  let doneCount = 0;

  habits.forEach(habit => {
    const isDoneToday = isHabitDoneOnDate(habit, dateKey, habitLogs);
    const completedThisWeek = getHabitWeekCompletedCount(habit, weekDays, habitLogs);
    const target = habit.targetPerWeek || 7;

    const isScheduledToday = Array.isArray(habit.scheduledDays) && habit.scheduledDays.length > 0
      ? habit.scheduledDays.includes(currentDayIndex)
      : target === 7;

    if (isScheduledToday) {
      requiredHabits++;
      if (isDoneToday) doneCount++;
    } else {
      // Rest day for this habit
      // If completed on rest day, count as bonus progress
      if (isDoneToday) {
        doneCount++;
        requiredHabits++;
      }
    }
  });

  const habitRatio = requiredHabits > 0 ? Math.min(1, doneCount / requiredHabits) : 1;
  const habitPercent = Math.round(habitRatio * 100);

  const dailyCharge = Math.min(100, Math.round((habitPercent * 0.6) + (taskPercent * 0.4)));

  return {
    dailyCharge,
    habitPercent,
    taskPercent,
    completedTasks,
    doneCount,
    requiredHabits,
    isMaximized: dailyCharge === 100,
  };
}

/**
 * Calculate Discipline Index for the whole week (%)
 * Separates Base Regime (7/7) and Cyclic Plan (N/7)
 */
export function calculateDisciplineIndex(habits, weekDays, habitLogs = {}) {
  let baseTargetTotal = 0;
  let baseDoneTotal = 0;

  let cyclicTargetTotal = 0;
  let cyclicDoneTotal = 0;

  habits.forEach(habit => {
    const completed = getHabitWeekCompletedCount(habit, weekDays, habitLogs);
    const target = habit.targetPerWeek || 7;

    if (target === 7) {
      baseTargetTotal += 7;
      baseDoneTotal += completed;
    } else {
      cyclicTargetTotal += target;
      cyclicDoneTotal += Math.min(completed, target);
    }
  });

  const basePercent = baseTargetTotal > 0 ? Math.round((baseDoneTotal / baseTargetTotal) * 100) : 100;
  const cyclicPercent = cyclicTargetTotal > 0 ? Math.round((cyclicDoneTotal / cyclicTargetTotal) * 100) : 100;

  const totalTarget = baseTargetTotal + cyclicTargetTotal;
  const totalDone = baseDoneTotal + cyclicDoneTotal;
  const overallIndex = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 100;

  return {
    overallIndex,
    basePercent,
    cyclicPercent,
    baseDoneTotal,
    baseTargetTotal,
    cyclicDoneTotal,
    cyclicTargetTotal,
  };
}

/**
 * Generate daily completion percentages for the 7 days of the week (for SVG chart)
 */
export function calculateWeekDynamics(habits, weekDays, habitLogs = {}, tasksByDate = {}) {
  return weekDays.map((day, idx) => {
    const dateKey = day.dateKey;
    const tasks = tasksByDate[dateKey] || [];
    const charge = calculateDailyCharge(habits, weekDays, idx, dateKey, habitLogs, tasks);
    return {
      dayShort: day.dayShort,
      dayFull: day.dayFull,
      dayOfMonth: day.dayOfMonth,
      dateKey,
      isToday: day.isToday,
      percentage: charge.dailyCharge,
      habitsDone: charge.doneCount,
      tasksDone: charge.completedTasks,
    };
  });
}
