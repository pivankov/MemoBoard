import { useEffect, useRef, useState } from 'react';
import { Button, Spin } from 'antd';

import EventsEdit, { EventsEditRef } from 'components/Events/EventsEdit';
import EventsList from "components/Events/EventsList";
import EventsMiniList from "components/Events/EventsMiniList";
import Panel from "components/UI/Panel/Panel";
import { useEvents } from 'hooks/useEvents';
import { useGroupedEvents } from 'hooks/useGroupedEvents';
import SingleColumnLayout from "layouts/SingleColumnLayout";
import { Event } from 'types/events';

import { EventsActionsProvider, useEventsActionsContext } from 'contexts/EventsActionsContext';
import { useNotifications } from 'providers/NotificationsProvider';

import "./Events.css";

const buildEventFormInitialValues = (event: Event) => {
  const { title, originalDate, nextDate, type, description, recurrence } = event;

  return {
    title,
    originalDate,
    nextDate,
    type,
    recurrence,
    description,
  };
};

/**
 * Внутренний компонент — потребляет EventsActionsContext
 * Содержит весь UI и обработчики событий
 */
const EventsContent: React.FC<{ events: Event[]; loading: boolean }> = ({ events, loading }) => {
  const { addEvent, updateEvent, deleteEvent, getEventById } = useEventsActionsContext();
  const [isPanelOpened, setIsPanelOpened] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const eventsEditRef = useRef<EventsEditRef>(null);

  const groupedEvents = useGroupedEvents(events);
  const hasPastEvents = groupedEvents.past.length > 0;
  const hasOverdueEvents = groupedEvents.overdue.length > 0;
  const isCardShown = hasPastEvents || hasOverdueEvents;

  const initialEventEditValues = editingEvent ? buildEventFormInitialValues(editingEvent) : undefined;
  const panelTitle = editingEvent ? "Редактировать событие" : "Добавить событие";

  const closePanel = () => {
    setIsPanelOpened(false);
    setEditingEvent(null);
    eventsEditRef.current?.resetForm();
  };

  const handleClickAddEvent = () => {
    setEditingEvent(null);
    setIsPanelOpened(true);
  };

  const handleEditEvent = async (id: string) => {
    try {
      const event = await getEventById(id);
      setEditingEvent(event);
      setIsPanelOpened(true);
    } catch {
      // Ошибка уже обработана в EventsActionsContext
    }
  };

  const handleSubmitForm = async (eventData: any) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }
      closePanel();
    } catch {
      // Ошибка уже обработана в EventsActionsContext
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    try {
      await deleteEvent(editingEvent.id);
      closePanel();
    } catch {
      // Ошибка уже обработана в EventsActionsContext
    }
  };

  return (
    <div className={isPanelOpened ? 'events events--narrow' : 'events'}>
      <div className="events__wrapper">
        <div className="events__body">
          <div className="events__header">
            <div>
              <h1>События</h1>
              <p>
                Список предстоящих праздников, дней рождения и памятных дат.
              </p>
            </div>
            {!isPanelOpened && (
              <Button
                type="primary"
                shape="round"
                onClick={handleClickAddEvent}
                loading={loading}
              >
                Добавить событие
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div className="events__container">
              <div className="events__main">
                <EventsList data={groupedEvents.actual} onEdit={handleEditEvent} />
              </div>
              {!isPanelOpened && (
                <div className="events__side">
                  {isCardShown && (
                    <div className="events__card">
                      {hasPastEvents && (
                        <div className="events__card-item">
                          <div className="events__card-item-title">Недавние события</div>
                          <EventsMiniList data={groupedEvents.past} isPastEvents onEdit={handleEditEvent} />
                        </div>
                      )}
                      {hasOverdueEvents && (
                        <div className="events__card-item">
                          <div className="events__card-item-title">Просроченные события</div>
                          <EventsMiniList data={groupedEvents.overdue} onEdit={handleEditEvent} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Panel
        title={panelTitle}
        isOpened={isPanelOpened}
        onClose={closePanel}
      >
        <EventsEdit
          ref={eventsEditRef}
          initialValues={initialEventEditValues}
          onSubmit={handleSubmitForm}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onCancel={closePanel}
        />
      </Panel>
    </div>
  );
};

/**
 * Внешний компонент — владеет данными и оборачивает в Provider
 * Загружает события и пробрасывает refreshEvents в EventsActionsProvider
 */
const Events: React.FC = () => {
  const { events, loading, error, refreshEvents } = useEvents();
  const { notifyError } = useNotifications();

  useEffect(() => {
    if (error) {
      notifyError({ description: error });
    }
  }, [error, notifyError]);

  return (
    <SingleColumnLayout>
      <EventsActionsProvider refreshEvents={refreshEvents}>
        <EventsContent events={events} loading={loading} />
      </EventsActionsProvider>
    </SingleColumnLayout>
  );
};

export default Events;
