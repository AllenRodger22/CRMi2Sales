// src/utils/date.ts

const TIME_UNITS = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
] as const;

type TimeUnit = typeof TIME_UNITS[number]['unit'];

export function formatRelativeTime(date: Date | string): string {
  const timeMs = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const nowMs = new Date().getTime();
  const seconds = Math.round((nowMs - timeMs) / 1000);
  
  if (seconds < 5) {
    return 'agora mesmo';
  }
  
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  for (const { unit, seconds: unitSeconds } of TIME_UNITS) {
    if (seconds >= unitSeconds) {
      const value = Math.floor(seconds / unitSeconds);
      return rtf.format(-value, unit);
    }
  }

  return 'agora mesmo';
}
