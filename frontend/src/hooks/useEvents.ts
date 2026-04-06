import { useCallback, useEffect, useState } from 'react';

import { Event } from 'types/events';
import { getApiErrorMessage } from 'utils/errors';

import { eventsApiClient } from 'services/apiClients';

/**
 * Возвращаемое значение хука useEvents
 */
interface UseEventsReturn {
  /** Список всех событий */
  events: Event[];
  /** Флаг загрузки данных */
  loading: boolean;
  /** Сообщение об ошибке или null */
  error: string | null;
  /** Метод принудительного обновления списка событий */
  refreshEvents: () => Promise<void>;
}

/**
 * Хук для загрузки списка событий через REST API
 *
 * Отвечает только за получение данных и управление состоянием загрузки.
 * CRUD-операции вынесены в useEventsActions и EventsActionsContext.
 * Автоматически загружает список событий при монтировании компонента.
 *
 * @returns объект с данными и состоянием загрузки событий
 */
export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает список всех событий с сервера
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await eventsApiClient.get<{ data: Event[] }>('');
      setEvents(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, 'Не удалось загрузить события');
      setError(errorMessage);
      console.error('Ошибка загрузки событий:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Принудительно обновляет список событий с сервера
   */
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents,
  };
};
