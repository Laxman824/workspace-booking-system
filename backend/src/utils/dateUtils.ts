import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

export const toUTC = (dateString: string): Date => {
  return zonedTimeToUtc(dateString, TIMEZONE);
};

export const toKolkata = (date: Date): Date => {
  return utcToZonedTime(date, TIMEZONE);
};

export const isPeakHour = (date: Date): boolean => {
  const kolkataTime = toKolkata(date);
  const day = kolkataTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = kolkataTime.getHours();

  const isWeekday = day >= 1 && day <= 5;
  const isMorningPeak = hour >= 10 && hour < 13;
  const isEveningPeak = hour >= 16 && hour < 19;

  return isWeekday && (isMorningPeak || isEveningPeak);
};

export const formatTimeForError = (date: Date): string => {
  return format(toKolkata(date), 'h:mm a', { timeZone: TIMEZONE });
};

export const getHoursDifference = (start: Date, end: Date): number => {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
};