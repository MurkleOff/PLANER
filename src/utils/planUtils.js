/**
 * Plan & Task management utilities: ID generation, self-healing deduplication, and sanitization
 */

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

    const cleanPlan = {
      ...p,
      id,
      title,
      category: p.category || 'work',
      horizon: p.horizon || 'day',
      targetPeriod: p.targetPeriod || p.period || '',
      type: p.type || 'checkbox',
      completed: !!p.completed,
      progress: typeof p.progress === 'number'
        ? Math.max(0, Math.min(100, p.progress))
        : (p.completed ? 100 : 0),
      deadline: p.deadline || null,
    };

    if (cleanPlan.id !== p.id) {
      hasChanges = true;
    }

    sanitized.push(cleanPlan);
  }

  return { sanitized, hasChanges };
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
