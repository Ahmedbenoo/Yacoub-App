export function formatDisplayDate(isoDate: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDisplayTime(isoDate: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatDisplayDateTime(isoDate: string, locale = 'en'): string {
  return `${formatDisplayDate(isoDate, locale)} · ${formatDisplayTime(isoDate, locale)}`;
}

export function formatDisplayDateTimeCompact(isoDate: string, locale = 'en'): string {
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoDate));

  return `${date} · ${formatDisplayTime(isoDate, locale)}`;
}
