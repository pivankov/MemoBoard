import { useRef,useState } from 'react';
import { Alert, Button, Spin } from 'antd';

import EventsEdit, { EventsEditRef } from 'components/Events/EventsEdit';
import EventsList from "components/Events/EventsList";
import EventsMiniList from "components/Events/EventsMiniList";
import Panel from "components/UI/Panel/Panel"
import { useEvents } from 'hooks/useEvents';
import { useGroupedEvents } from 'hooks/useGroupedEvents';
import { Event } from 'types/events';

import "./Events.css";

const buildEventFormInitialValues = (event: Event) => {
  const { title, date, type, description, isYearly } = event;

  return {
    title,
    date,
    type,
    isYearly,
    tags: [],
    description,
  }
}; 

const Events: React.FC = () => {
  const [isPanelOpened, setIsPanelOpened] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const eventsEditRef = useRef<EventsEditRef>(null);
  
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents();  

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

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsPanelOpened(true);
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

            {error && (
              <Alert
                message="Ошибка"
                description={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

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

                            <EventsMiniList data={groupedEvents.past} onEdit={handleEditEvent} />
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