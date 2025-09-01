export const isSameCalendarDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const formatDateString = (dateInput: string): string => {
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return "";
  return dateFormatter.format(parsed);
};


