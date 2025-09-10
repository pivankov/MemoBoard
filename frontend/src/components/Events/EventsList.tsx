import { Event } from '../../types/events';
import { type EventsMonthGroup } from "../../hooks/useGroupedEvents";

import EventsListGroup from "./EventsListGroup";
import EventsListItem from "./EventsListItem";

import "./EventsList.css";

const EventsList: React.FC<{data: EventsMonthGroup[], onEdit?: (event: Event) => void}> = ({ data, onEdit }) => {
  return (
    <>
      {data.map((group) => (
        <EventsListGroup title={group.label} key={group.key}>
          <ul className="events-list">
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
        </EventsListGroup>        
      ))}
    </>
  );
};

export default EventsList;