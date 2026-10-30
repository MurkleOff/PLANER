// Russian day and month names
export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const DAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date key to readable Russian string e.g. "19 октября 2026"
 */
export function formatDateRu(dateStr) {
  if (!dateStr) return '';
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = dateStr.getMonth() + 1;
    const d = dateStr.getDate();
    return `${d} ${MONTHS_RU[m - 1]} ${y}`;
  }
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const [y, m, d] = parts.map(Number);
      if (y && m && d && m >= 1 && m <= 12) {
        return `${d} ${MONTHS_RU[m - 1]} ${y}`;
      }
    }
    return dateStr;
  }
  return String(dateStr);
}

/**
 * Get month key YYYY-MM
 */
export function getMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format YYYY-MM or Date to readable Russian e.g. "Октябрь 2026"
 */
export function formatMonthLabel(monthInput) {
  if (!monthInput) return '';
  if (monthInput instanceof Date) {
    const m = monthInput.getMonth();
    const y = monthInput.getFullYear();
    return `${MONTHS_NOMINATIVE[m]} ${y}`;
  }
  if (typeof monthInput === 'string') {
    const parts = monthInput.split('-');
    if (parts.length >= 2) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (y && m && m >= 1 && m <= 12) {
        return `${MONTHS_NOMINATIVE[m - 1]} ${y}`;
      }
    }
    return monthInput;
  }
  return String(monthInput);
}

/**
 * Get year key YYYY
 */
export function getYearKey(date = new Date()) {
  return String(date.getFullYear());
}

/**
 * Get ISO week number and key YYYY-Www
 */
export function getWeekKey(monday) {
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get the Monday of the week containing the given date, adjusted by weekOffset
 */
export function getMondayOfWeek(baseDate = new Date(), weekOffset = 0) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + weekOffset * 7);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
  const diff = day === 0 ? -6 : 1 - day; // adjust when day is sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all 7 days of the week starting from Monday
 */
export function getWeekDays(monday) {
  const days = [];
  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d);

    days.push({
      date: d,
      dateKey,
      dayIndex: i, // 0 to 6 (Mon to Sun)
      dayShort: DAYS_SHORT[i],
      dayFull: DAYS_FULL[i],
      dayOfMonth: d.getDate(),
      monthName: MONTHS_RU[d.getMonth()],
      isToday: dateKey === todayKey,
    });
  }
  return days;
}

/**
 * Format Russian header date e.g. "Четверг, 16 октября"
 */
export function formatDisplayDate(date = new Date()) {
  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const dayFull = DAYS_FULL[dayIndex];
  const dayNum = date.getDate();
  const month = MONTHS_RU[date.getMonth()];
  return `${dayFull}, ${dayNum} ${month}`;
}

/**
 * Get ISO week label e.g. "13 – 19 октября 2026"
 */
export function getWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonth = MONTHS_RU[monday.getMonth()];
  const endMonth = MONTHS_RU[sunday.getMonth()];
  const year = sunday.getFullYear();

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay} – ${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

/**
 * Calculate days remaining until a deadline
 */
export function getDaysRemaining(targetDateStr) {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  target.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Add or subtract days from a date string (YYYY-MM-DD) or Date object, returning YYYY-MM-DD
 */
export function addDays(dateStrOrDate, n = 1) {
  let d;
  if (typeof dateStrOrDate === 'string') {
    const parts = dateStrOrDate.split('-').map(Number);
    d = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    d = new Date(dateStrOrDate);
  }
  d.setDate(d.getDate() + n);
  return formatDateKey(d);
}

/**
 * Get yesterday's date key YYYY-MM-DD
 */
export function getYesterdayKey(date = new Date()) {
  return addDays(date, -1);
}

/**
 * Get tomorrow's date key YYYY-MM-DD
 */
export function getTomorrowKey(date = new Date()) {
  return addDays(date, 1);
}

/**
 * Get the Monday of a given YYYY-MM-DD date key
 */
export function getMondayOfDateKey(dateKey) {
  if (!dateKey) return getMondayOfWeek(new Date(), 0);
  const parts = String(dateKey).split('-');
  if (parts.length >= 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    return getMondayOfWeek(dateObj, 0);
  }
  return getMondayOfWeek(new Date(), 0);
}

/**
 * Get the Monday of an ISO week key YYYY-Www
 */
export function getMondayOfWeekKey(weekKey) {
  if (!weekKey || typeof weekKey !== 'string') return getMondayOfWeek(new Date(), 0);
  const match = weekKey.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return getMondayOfWeek(new Date(), 0);
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4.getTime() - (dayNum - 1) * 86400000);
  const targetMonday = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
  return new Date(targetMonday.getUTCFullYear(), targetMonday.getUTCMonth(), targetMonday.getUTCDate(), 12, 0, 0);
}
