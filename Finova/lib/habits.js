import { startOfWeek, subDays, subWeeks } from "date-fns";

const APP_TIMEZONE = "Asia/Kolkata";

export function indiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  return new Date(`${key}T12:00:00+05:30`);
}

function uniqueSortedDates(logs = []) {
  return [...new Set(logs.filter((log) => log.completed !== false).map((log) => log.logDate))].sort();
}

function currentWeekStart(key) {
  return startOfWeek(dateFromKey(key), { weekStartsOn: 1 });
}

function maxConsecutiveDays(dates = []) {
  if (!dates.length) return 0;
  let best = 1;
  let current = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const prev = dateFromKey(dates[index - 1]).getTime();
    const next = dateFromKey(dates[index]).getTime();
    const diffDays = Math.round((next - prev) / 86400000);
    if (diffDays === 1) current += 1;
    else current = 1;
    if (current > best) best = current;
  }
  return best;
}

function trailingConsecutiveDays(dates = [], referenceKey = indiaDateKey()) {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let cursor = set.has(referenceKey) ? dateFromKey(referenceKey) : subDays(dateFromKey(referenceKey), 1);
  let streak = 0;
  while (set.has(indiaDateKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function weekKeys(dates = []) {
  return [...new Set(dates.map((dateKey) => indiaDateKey(currentWeekStart(dateKey))))].sort();
}

function maxConsecutiveWeeks(dates = []) {
  const keys = weekKeys(dates);
  if (!keys.length) return 0;
  let best = 1;
  let current = 1;
  for (let index = 1; index < keys.length; index += 1) {
    const prev = currentWeekStart(keys[index - 1]).getTime();
    const next = currentWeekStart(keys[index]).getTime();
    const diffWeeks = Math.round((next - prev) / (86400000 * 7));
    if (diffWeeks === 1) current += 1;
    else current = 1;
    if (current > best) best = current;
  }
  return best;
}

function trailingConsecutiveWeeks(dates = [], referenceKey = indiaDateKey()) {
  const set = new Set(weekKeys(dates));
  let cursor = currentWeekStart(referenceKey);
  let key = indiaDateKey(cursor);
  if (!set.has(key)) {
    cursor = subWeeks(cursor, 1);
    key = indiaDateKey(cursor);
  }
  let streak = 0;
  while (set.has(indiaDateKey(cursor))) {
    streak += 1;
    cursor = subWeeks(cursor, 1);
  }
  return streak;
}

export function computeHabitMetrics(habit, logs = [], referenceKey = indiaDateKey()) {
  const cadence = habit.cadence || "daily";
  const dates = uniqueSortedDates(logs);
  const completedToday = dates.includes(referenceKey);
  const streak = cadence === "weekly"
    ? trailingConsecutiveWeeks(dates, referenceKey)
    : trailingConsecutiveDays(dates, referenceKey);
  const bestStreak = cadence === "weekly"
    ? maxConsecutiveWeeks(dates)
    : maxConsecutiveDays(dates);

  const now = dateFromKey(referenceKey);
  const thisWeekStart = currentWeekStart(referenceKey).getTime();
  const thisWeekCompletions = dates.filter((key) => dateFromKey(key).getTime() >= thisWeekStart).length;
  const lookback = cadence === "weekly" ? 8 : 14;
  let missedWindows = 0;
  for (let index = 0; index < lookback; index += 1) {
    if (cadence === "weekly") {
      const weekStart = startOfWeek(subWeeks(now, index), { weekStartsOn: 1 });
      const weekKey = indiaDateKey(weekStart);
      if (!weekKeys(dates).includes(weekKey)) missedWindows += 1;
      continue;
    }
    const dayKey = indiaDateKey(subDays(now, index));
    if (!dates.includes(dayKey)) missedWindows += 1;
  }

  return {
    ...habit,
    cadence,
    logs,
    completedToday,
    streak,
    bestStreak,
    thisWeekCompletions,
    missedWindows,
    lastCompletedAt: dates[dates.length - 1] || "",
  };
}
