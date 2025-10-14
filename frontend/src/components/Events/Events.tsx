import { useEffect,useRef,useState } from 'react';
import { Button, Spin } from 'antd';

import EventsEdit, { EventsEditRef } from 'components/Events/EventsEdit';
import EventsList from "components/Events/EventsList";
import EventsMiniList from "components/Events/EventsMiniList";
import Panel from "components/UI/Panel/Panel"
import { useEvents } from 'hooks/useEvents';
import { useGroupedEvents } from 'hooks/useGroupedEvents';
import { Event } from 'types/events';

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
  }
}; 

const Events: React.FC = () => {
  const { notifyError } = useNotifications();
  const [isPanelOpened, setIsPanelOpened] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const eventsEditRef = useRef<EventsEditRef>(null);
  
  const { events, loading, error, addEvent, updateEvent, deleteEvent, getEventById } = useEvents();  

  useEffect(() => {
    if (error) {
      notifyError({ description: error });
    }
  }, [error, notifyError]);

  const initialEventEditValues  = editingEvent ? buildEventFormInitialValues(editingEvent) : undefined;
  const panelTitle = editingEvent ? "Редактировать событие" : "Добавить событие";
  const groupedEvents = useGroupedEvents(events);
  const hasPastEvents = groupedEvents.past.length > 0;
  const hasOverdueEvents = groupedEvents.overdue.length > 0;
  const isCardShown = hasPastEvents || hasOverdueEvents;
  
  const handleClickAddEvent = () => {
    setEditingEvent(null);
    setIsPanelOpened(true);
  }

  const handleEditEvent = async (id: string) => {
    const resp = await getEventById(id);

    if (resp) {
      setEditingEvent(resp);
      setIsPanelOpened(true);
    }
  }
  
  const handleClosePanel = () => {
    setIsPanelOpened(false);
    setEditingEvent(null);

    eventsEditRef.current?.resetForm();
  }

  const handleSubmitForm = async (eventData: any) => {
    const success = editingEvent 
      ? await updateEvent(editingEvent.id, eventData)
      : await addEvent(eventData);

    if (success) {
      setIsPanelOpened(false);
      setEditingEvent(null);
      eventsEditRef.current?.resetForm();
    }
  }

  const handleDeleteEvent = async () => {
    if (editingEvent) {
      const success = await deleteEvent(editingEvent.id);
      if (success) {
        setIsPanelOpened(false);
        setEditingEvent(null);
        eventsEditRef.current?.resetForm();
      }
    }
  }

  return (
    <>
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
              ) }
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
      </div>

      <Panel 
        title={panelTitle} 
        isOpened={isPanelOpened} 
        onClose={handleClosePanel}
      >
        <EventsEdit 
          ref={eventsEditRef} 
          initialValues={initialEventEditValues}
          onSubmit={handleSubmitForm}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onCancel={handleClosePanel}
        />
      </Panel>
    </>
  );
};

export default Events;