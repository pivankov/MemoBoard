import { type ElementType } from "react";
import { CoffeeOutlined,CrownOutlined, EditOutlined, StarFilled } from "@ant-design/icons";

import { eventType } from "enums/events"
import { Event } from 'types/events';
import { formatDateString } from "utils/date";

import "./EventsListItem.css";

const eventTypeIcon: Record<eventType, ElementType> = {
  [eventType.OTHER]: CoffeeOutlined,
  [eventType.HOLIDAY]: StarFilled,
  [eventType.BIRTHDAY]: CrownOutlined,
};

const EventsListItem: React.FC<Event & { onEdit?: () => void }> = ({ id, title, date, type, description, onEdit }) => {
  const dateString = formatDateString(date);
  const Icon = eventTypeIcon[type];

  return (
    <li className="events-list-item">
      <div className="events-list-item__icon">
      <Icon />
      </div>
      <div className="events-list-item__wrapper">
        <div className="events-list-item__title">
          {title}

          <EditOutlined className="ml-1" onClick={onEdit} />
        </div>
        <div className="date">
          {dateString}
        </div>
        {description && (
          <div className="events-list-item__description">
            {description}
          </div>            
        )}
      </div>
    </li>
  );
};

export default EventsListItem;