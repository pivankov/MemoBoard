import { useState, useRef } from 'react';

import { Button, Alert, Spin } from 'antd';

import EventsList from "./EventsList";
import Panel from "../UI/Panel/Panel"
import { useEvents } from '../../hooks/useEvents';
import { Event } from '../../types/events';

import "./Events.css";
import EventsEdit, { EventsEditRef } from './EventsEdit';

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
                <p>Список предстоящих праздников, дней рождения и памятных дат.</p>
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
              <EventsList data={events} onEdit={handleEditEvent} />
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