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
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${MONTHS_RU[m - 1]} ${y}`;
}

/**
 * Get month key YYYY-MM
 */
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format YYYY-MM to readable Russian e.g. "Октябрь 2026"
 */
export function formatMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${MONTHS_NOMINATIVE[m - 1]} ${y}`;
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
