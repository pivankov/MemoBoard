// Нормализует входящую дату к ISO-строке с таймзоной (UTC); Возвращает null, если дата невалидна
export function normalizeInputDate(dateInput) {
  if (typeof dateInput !== 'string') {
    return null
  };

  const trimmed = dateInput.trim();

  if (trimmed.length === 0) {
    return null
  };

  const onlyDateRegexp = /^\d{4}-\d{2}-\d{2}$/;

  if (onlyDateRegexp.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }

  const parsed = new Date(trimmed);
  
  if (isNaN(parsed.getTime())) {
    return null
  };

  return parsed.toISOString();
}