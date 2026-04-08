import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { useEventsActions } from 'hooks/useEventsActions';
import { Event, EventFormValues } from 'types/events';
import { getApiErrorMessage } from 'utils/errors';

import { useNotifications } from 'providers/NotificationsProvider';

/**
 * Значение контекста действий с событиями
 */
interface EventsActionsContextValue {
  /** Метод для обновления списка событий после изменений */
  refreshEvents: () => Promise<void>;
  /** Получает событие по ID */
  getEventById: (id: string) => Promise<Event>;
  /** Создаёт новое событие */
  addEvent: (data: EventFormValues) => Promise<void>;
  /** Обновляет существующее событие */
  updateEvent: (id: string, data: EventFormValues) => Promise<void>;
  /** Удаляет событие */
  deleteEvent: (id: string) => Promise<void>;
}

const EventsActionsContext = createContext<EventsActionsContextValue | null>(null);

interface EventsActionsProviderProps {
  children: ReactNode;
  /** Метод обновления списка событий из родительского компонента */
  refreshEvents: () => Promise<void>;
}

/**
 * Provider для CRUD-операций с событиями
 *
 * Предоставляет стабильные методы для работы с событиями через API.
 * Централизует обработку ошибок и уведомления об успехе/ошибке.
 * Не содержит изменяемого state, поэтому не вызывает лишние ре-рендеры.
 *
 * @param refreshEvents - метод для обновления списка событий после изменений
 */
export const EventsActionsProvider: React.FC<EventsActionsProviderProps> = ({
  children,
  refreshEvents,
}) => {
  const {
    getEventById: getEventByIdAction,
    addEvent: addEventAction,
    updateEvent: updateEventAction,
    deleteEvent: deleteEventAction,
  } = useEventsActions();

  const { notifySuccess, notifyError } = useNotifications();

  /**
   * Получает событие по ID
   */
  const getEventById = useCallback(async (id: string): Promise<Event> => {
    try {
      return await getEventByIdAction(id);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось загрузить событие');
      notifyError({ description: errorMessage });
      console.error('Ошибка загрузки события:', error);
      throw error;
    }
  }, [getEventByIdAction, notifyError]);

  /**
   * Создаёт новое событие
   */
  const addEvent = useCallback(async (data: EventFormValues): Promise<void> => {
    try {
      await addEventAction(data);
      notifySuccess({ description: 'Событие создано' });
      await refreshEvents();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось создать событие');
      notifyError({ description: errorMessage });
      console.error('Ошибка создания события:', error);
      throw error;
    }
  }, [addEventAction, refreshEvents, notifySuccess, notifyError]);

  /**
   * Обновляет существующее событие
   */
  const updateEvent = useCallback(async (id: string, data: EventFormValues): Promise<void> => {
    try {
      await updateEventAction(id, data);
      notifySuccess({ description: 'Событие обновлено' });
      await refreshEvents();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось обновить событие');
      notifyError({ description: errorMessage });
      console.error('Ошибка обновления события:', error);
      throw error;
    }
  }, [updateEventAction, refreshEvents, notifySuccess, notifyError]);

  /**
   * Удаляет событие
   */
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteEventAction(id);
      notifySuccess({ description: 'Событие удалено' });
      await refreshEvents();
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Не удалось удалить событие');
      notifyError({ description: errorMessage });
      console.error('Ошибка удаления события:', error);
      throw error;
    }
  }, [deleteEventAction, refreshEvents, notifySuccess, notifyError]);

  const value = useMemo(() => ({
    refreshEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
  }), [
    refreshEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
  ]);

  return (
    <EventsActionsContext.Provider value={value}>
      {children}
    </EventsActionsContext.Provider>
  );
};

/**
 * Хук для доступа к действиям с событиями
 *
 * Предоставляет CRUD-методы для работы с событиями.
 * Должен использоваться внутри EventsActionsProvider.
 *
 * @returns объект с методами для работы с событиями
 */
export const useEventsActionsContext = (): EventsActionsContextValue => {
  const context = useContext(EventsActionsContext);

  if (!context) {
    throw new Error('useEventsActionsContext должен использоваться внутри EventsActionsProvider');
  }

  return context;
};
