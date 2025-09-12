import { Event } from 'types/events';
import { formatDateString } from "utils/date";

import "./EventsMiniList.css";

const EventsMiniList: React.FC<{data: Event[], onEdit?: (event: Event) => void}> = ({ data, onEdit }) => {
  return (
    <>
      <ul className="events-mini-list">
        {data.map((item) => (
          <li className="events-mini-list__item" key={item.id}>
            <span className="events-mini-list__item-title" onClick={() => onEdit?.(item)} >
              {item.title}
            </span>
            <div className="events-mini-list__item-date">
              {formatDateString(item.date)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default EventsMiniList;