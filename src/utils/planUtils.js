/**
 * Plan & Task management utilities: ID generation, self-healing deduplication, and sanitization
 */

import {
  getMonthKey,
  getWeekKey,
  getWeekLabel,
  formatMonthLabel,
  getMondayOfDateKey,
  getMondayOfWeekKey
} from './dateUtils.js';

let idCounter = 0;

/**
 * Generate a guaranteed unique collision-proof ID.
 * Incorporates prefix, high-res timestamp, two random entropy strings, and an incremental counter.
 */
export function generateUniqueId(prefix = 'plan') {
  idCounter = (idCounter + 1) % 100000;
  const time = Date.now();
  const rand1 = Math.random().toString(36).slice(2, 8);
  const rand2 = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${time}-${rand1}${rand2}-${idCounter}`;
}

/**
 * Deduplicate and sanitize plans array.
 * Ensures every plan is an object, has a strictly unique string ID, valid horizon, targetPeriod, etc.
 * Returns { sanitized: Plan[], hasChanges: boolean }
 */
export function sanitizePlans(plans) {
  if (!Array.isArray(plans)) return { sanitized: [], hasChanges: true };

  const seenIds = new Set();
  const seenKeyGoals = new Set();
  let hasChanges = false;

  const sanitized = [];

  for (let i = 0; i < plans.length; i++) {
    const p = plans[i];
    if (!p || typeof p !== 'object') {
      hasChanges = true;
      continue;
    }

    let id = p.id;
    // Check if ID is missing, not a string, or already seen in another item
    if (!id || typeof id !== 'string' || id.trim() === '' || seenIds.has(id)) {
      id = generateUniqueId('plan');
      hasChanges = true;
    }
    seenIds.add(id);

    const title = (p.title || p.text || '').trim();
    if (title !== p.title) {
      hasChanges = true;
    }

    const category = p.category || 'work';
    const horizon = p.horizon || 'day';
    const targetPeriod = p.targetPeriod || p.period || '';
    const type = p.type || 'checkbox';

    let isKeyGoal = !!p.isKeyGoal && (type === 'progress' || !p.type);
    if (isKeyGoal) {
      const groupKey = `${category}_${horizon}_${targetPeriod}`;
      if (seenKeyGoals.has(groupKey)) {
        // Enforce max 1 key goal per sphere per period
        isKeyGoal = false;
        hasChanges = true;
      } else {
        seenKeyGoals.add(groupKey);
      }
    }

    const cleanPlan = {
      ...p,
      id,
      title,
      category,
      horizon,
      targetPeriod,
      type,
      isKeyGoal,
      completed: !!p.completed,
      progress: typeof p.progress === 'number'
        ? Math.max(0, Math.min(100, p.progress))
        : (p.completed ? 100 : 0),
      deadline: p.deadline || null,
    };

    if (cleanPlan.id !== p.id || cleanPlan.isKeyGoal !== p.isKeyGoal) {
      hasChanges = true;
    }

    sanitized.push(cleanPlan);
  }

  return { sanitized, hasChanges };
}

/**
 * Get information about the parent planning period in the cascade:
 * Day -> Week
 * Week -> Month
 * Month -> Year
 * Year -> null
 */
export function getParentPeriodInfo(currentHorizon, currentPeriodKey, options = {}) {
  if (!currentHorizon || !currentPeriodKey) return null;

  if (currentHorizon === 'month') {
    // Current is Month (YYYY-MM), Parent is Year (YYYY)
    const yearKey = String(currentPeriodKey).split('-')[0];
    return {
      parentHorizon: 'year',
      parentPeriodKey: yearKey,
      parentLabel: `${yearKey} года`,
      parentHorizonName: 'год',
    };
  }

  if (currentHorizon === 'week') {
    // Current is Week (YYYY-Www), Parent is Month (YYYY-MM)
    const monday = options.monday || getMondayOfWeekKey(currentPeriodKey);
    const monthKey = getMonthKey(monday);
    return {
      parentHorizon: 'month',
      parentPeriodKey: monthKey,
      parentLabel: formatMonthLabel(monday),
      parentHorizonName: 'месяц',
      monday,
    };
  }

  if (currentHorizon === 'day') {
    // Current is Day (YYYY-MM-DD), Parent is Week (YYYY-Www)
    const monday = options.monday || getMondayOfDateKey(currentPeriodKey);
    const weekKey = getWeekKey(monday);
    return {
      parentHorizon: 'week',
      parentPeriodKey: weekKey,
      parentLabel: getWeekLabel(monday),
      parentHorizonName: 'неделю',
      monday,
    };
  }

  return null;
}

/**
 * Find the designated North Star (main) goal in the parent period for a specific sphere.
 */
export function getParentKeyGoal(plans, currentHorizon, currentPeriodKey, categoryId, options = {}) {
  const parentInfo = getParentPeriodInfo(currentHorizon, currentPeriodKey, options);
  if (!parentInfo || !Array.isArray(plans)) return null;

  const goal = plans.find(p => 
    p.horizon === parentInfo.parentHorizon &&
    p.targetPeriod === parentInfo.parentPeriodKey &&
    p.category === categoryId &&
    p.isKeyGoal &&
    (p.type === 'progress' || !p.type)
  );

  return {
    parentInfo,
    goal: goal || null,
  };
}

/**
 * Deduplicate and sanitize habits array.
 * Returns { sanitized: Habit[], hasChanges: boolean }
 */
export function sanitizeHabits(habits) {
  if (!Array.isArray(habits)) return { sanitized: [], hasChanges: true };

  const seenIds = new Set();
  let hasChanges = false;

  const sanitized = [];

  for (let i = 0; i < habits.length; i++) {
    const h = habits[i];
    if (!h || typeof h !== 'object') {
      hasChanges = true;
      continue;
    }

    let id = h.id;
    if (!id || typeof id !== 'string' || id.trim() === '' || seenIds.has(id)) {
      id = generateUniqueId('habit');
      hasChanges = true;
    }
    seenIds.add(id);

    const cleanHabit = {
      ...h,
      id,
      name: (h.name || '').trim(),
      category: h.category || 'personality',
    };

    if (cleanHabit.id !== h.id) {
      hasChanges = true;
    }

    sanitized.push(cleanHabit);
  }

  return { sanitized, hasChanges };
}
