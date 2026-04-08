import { useCallback } from 'react';

import { Event, EventFormValues } from 'types/events';

import { eventsApiClient } from 'services/apiClients';

/**
 * Возвращаемое значение хука useEventsActions
 */
interface UseEventsActionsReturn {
  /** Получает событие по ID */
  getEventById: (id: string) => Promise<Event>;
  /** Создаёт новое событие */
  addEvent: (data: EventFormValues) => Promise<void>;
  /** Обновляет существующее событие */
  updateEvent: (id: string, data: EventFormValues) => Promise<void>;
  /** Удаляет событие */
  deleteEvent: (id: string) => Promise<void>;
}

/**
 * Хук для CRUD-операций с событиями
 *
 * Предоставляет методы для работы с API событий.
 * Не управляет state — только выполняет запросы.
 *
 * @returns объект с методами для работы с событиями
 */
export const useEventsActions = (): UseEventsActionsReturn => {
  /**
   * Получает событие по ID
   */
  const getEventById = useCallback(async (id: string): Promise<Event> => {
    const payload = await eventsApiClient.get<{ data: Event }>(`/${id}`);
    return payload.data;
  }, []);

  /**
   * Создаёт новое событие
   */
  const addEvent = useCallback(async (data: EventFormValues): Promise<void> => {
    await eventsApiClient.post('', data);
  }, []);

  /**
   * Обновляет существующее событие
   */
  const updateEvent = useCallback(async (id: string, data: EventFormValues): Promise<void> => {
    await eventsApiClient.put(`/${id}`, data);
  }, []);

  /**
   * Удаляет событие
   */
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await eventsApiClient.delete(`/${id}`);
  }, []);

  return {
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
  };
};
