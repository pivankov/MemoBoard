import { type EventsGrouped } from "hooks/useGroupedEvents";
import { Event } from 'types/events';

import EventsListItem from "./EventsListItem";

import "./EventsList.css";

const EventsList: React.FC<{data: EventsGrouped, onEdit?: (event: Event) => void}> = ({ data, onEdit }) => {
  return (
    <>
      {data.actual.map((group) => (
        <div className="events-list" key={group.key}>
          <div className="events-list__title">
            {group.label}
          </div>
          <ul className="events-list__items">
            {group.items.map((item) => (
              <EventsListItem
                key={item.id}
                id={item.id}
                title={item.title}
                date={item.date}
                type={item.type}
                isYearly={item.isYearly}
                description={item.description}
                onEdit={onEdit ? () => onEdit(item) : undefined}
              />
            ))}
          </ul>             
        </div>
      ))}

      {data.overdue.length > 0 && (
        <div className="events-list pt-10 mt-10">
          <h2>
            Просроченные события
          </h2>

          <ul className="events-list__items">
            {data.overdue.map((item) => (
              <EventsListItem
                key={item.id}
                id={item.id}
                title={item.title}
                date={item.date}
                type={item.type}
                isYearly={item.isYearly}
                description={item.description}
                onEdit={onEdit ? () => onEdit(item) : undefined}
              />
            ))}
          </ul>           
        </div>
      )}
    </>
  );
};

export default EventsList;