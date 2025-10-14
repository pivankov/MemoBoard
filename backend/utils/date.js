/**
 * Нормализует входящую дату к ISO-строке с таймзоной (UTC)
 * @param {string} dateInput - Входная дата в различных форматах (ISO строка, дата с временем и т.д.)
 * @returns {string | null} ISO строка с таймзоной UTC (например, "2024-06-13T00:00:00Z") или null при ошибке
 * 
 * Возвращает null если:
 * - dateInput не является строкой
 * - dateInput пустая строка после trim()
 * - dateInput не может быть распарсена как валидная дата
 */
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