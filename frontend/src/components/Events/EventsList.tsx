import EventsListItem from "./EventsListItem";
import { Event } from '../../types/events';

import "./EventsList.css";

const EventsList: React.FC<{data: Event[], onEdit?: (event: Event) => void}> = ({ data, onEdit }) => {
  return (
    <ul className="events-list">
      {data.map((item) => (
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
  );
};

export default EventsList;