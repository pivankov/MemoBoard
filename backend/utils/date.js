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

// Вычисляет дату следующего события на основе оригинальной даты и типа повторения
export function calculateNextDate(originalDate, recurrence) {
  if (!originalDate || typeof originalDate !== 'string') {
    return '';
  }

  if (!recurrence || recurrence === 'none') {
    return '';
  }

  try {
    // Парсим оригинальную дату
    const original = new Date(originalDate);
    if (isNaN(original.getTime())) {
      return '';
    }

    // const now = new Date('2026-01-03');
    const now = new Date(Date.now());
    
    // Если оригинальная дата еще не наступила, возвращаем пустую строку
    // так как событие еще не происходило и не может повторяться
    if (original > now) {
      return '';
    }

    let nextDate = new Date(original);

    if (recurrence === 'monthly') {
      // Для ежемесячного повторения
      while (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (recurrence === 'yearly') {
      // Для ежегодного повторения
      while (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    // Возвращаем в формате YYYY-MM-DD
    return nextDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Ошибка вычисления следующей даты:', error);
    return '';
  }
}