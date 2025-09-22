import { type EventMonthGroup } from "hooks/useGroupedEvents";

import EventsListItem from "./EventsListItem";

import "./EventsList.css";

const EventsList: React.FC<{data: EventMonthGroup[], onEdit?: (id: string) => void}> = ({ data, onEdit }) => {
  return (
    <>
      {data.map((group) => (
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
                isMonthly={item.isMonthly}
                description={item.description}
                onEdit={onEdit ? () => onEdit(item.id) : undefined}
              />
            ))}
          </ul>             
        </div>
      ))}
    </>
  );
};

export default EventsList;