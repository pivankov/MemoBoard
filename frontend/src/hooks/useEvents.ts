import { useCallback,useEffect, useState } from 'react';

import { Event, EventFormValues } from 'types/events';

import { API_EVENTS_BASE_URL } from 'constants/api';

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
  /** Метод добавления нового события */
  addEvent: (event: EventFormValues) => Promise<boolean>;
  /** Метод обновления существующего события */
  updateEvent: (id: string, event: EventFormValues) => Promise<boolean>;
  /** Метод удаления события */
  deleteEvent: (id: string) => Promise<boolean>;
  /** Метод принудительного обновления списка событий */
  refreshEvents: () => Promise<void>;
  /** Метод получения события по ID */
  getEventById: (id: string) => Promise<Event | null>;
}

/**
 * Хук для работы с событиями через REST API
 * 
 * Предоставляет методы для CRUD операций с событиями и управления их состоянием.
 * Автоматически загружает список событий при монтировании компонента.
 * 
 * @returns объект с методами и состоянием для работы с событиями
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
      const response = await fetch(API_EVENTS_BASE_URL);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки событий: ${response.status} ${response.statusText}`);
      }
      
      const payload = await response.json();
      const list: Event[] = Array.isArray(payload?.data) ? payload.data : [];

      setEvents(list);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке событий';

      setError(errorMessage);
      console.error('Ошибка загрузки событий:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Создаёт новое событие
   * 
   * @param eventData - данные нового события
   * @returns true в случае успешного создания, false при ошибке
   */
  const addEvent = useCallback(async (eventData: EventFormValues): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(API_EVENTS_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          originalDate: eventData.originalDate,
          type: eventData.type,
          recurrence: eventData.recurrence,
          description: eventData.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка создания события: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const savedEvent: Event | null = payload?.data ?? null;

      if (!savedEvent) {
        throw new Error('Некорректный ответ сервера при создании события');
      }

      setEvents((prev) => [savedEvent, ...prev]);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при создании события';
      setError(errorMessage);
      console.error('Ошибка создания события:', err);
      return false;
    }
  }, []);

  /**
   * Обновляет существующее событие
   * 
   * @param id - идентификатор события для обновления
   * @param eventData - новые данные события
   * @returns true в случае успешного обновления, false при ошибке
   */
  const updateEvent = useCallback(async (id: string, eventData: EventFormValues): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(`${API_EVENTS_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          originalDate: eventData.originalDate,
          type: eventData.type,
          recurrence: eventData.recurrence,
          description: eventData.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка обновления события: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const updatedEvent: Event | null = payload?.data ?? null;

      if (!updatedEvent) {
        throw new Error('Некорректный ответ сервера при обновлении события');
      }

      setEvents((prev) => prev.map(event => event.id === id ? updatedEvent : event));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при обновлении события';
      setError(errorMessage);
      console.error('Ошибка обновления события:', err);
      return false;
    }
  }, []);

  /**
   * Удаляет событие
   * 
   * @param id - идентификатор события для удаления
   * @returns true в случае успешного удаления, false при ошибке
   */
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`${API_EVENTS_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Ошибка удаления события: ${response.status} ${response.statusText}`);
      }

      setEvents((prev) => prev.filter((event) => event.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при удалении события';

      setError(errorMessage);
      console.error('Ошибка удаления события:', err);
      return false;
    }
  }, []);

  /**
   * Принудительно обновляет список событий с сервера
   */
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  /**
   * Получает событие по его идентификатору
   * 
   * @param id - идентификатор события
   * @returns объект события или null при ошибке/отсутствии
   */
  const getEventById = useCallback(async (id: string): Promise<Event | null> => {
    setError(null);

    try {
      const response = await fetch(`${API_EVENTS_BASE_URL}/${id}`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки события: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const event: Event | null = payload?.data ?? null;
      if (!event) {
        throw new Error('Некорректный ответ сервера при загрузке события');
      }

      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке события';
      setError(errorMessage);
      console.error('Ошибка загрузки события:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getEventById,
  };
};
