import { useState, useEffect, useCallback } from 'react';
import { Event, EventFormValues } from '../types/events';

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  addEvent: (event: EventFormValues) => Promise<boolean>;
  updateEvent: (id: string, event: EventFormValues) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  refreshEvents: () => Promise<void>;
}

const API_BASE_URL = 'http://localhost:4000/api/events';

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_BASE_URL);
      
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

  const addEvent = useCallback(async (eventData: EventFormValues): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          date: eventData.date,
          type: eventData.type,
          isYearly: eventData.isYearly,
          tags: eventData.tags,
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

  const updateEvent = useCallback(async (id: string, eventData: EventFormValues): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          date: eventData.date,
          type: eventData.type,
          isYearly: eventData.isYearly,
          tags: eventData.tags,
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

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
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
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  };
};
