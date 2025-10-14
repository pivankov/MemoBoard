import { Event } from 'types/events';
import { formatDateString } from "utils/date";

import "./EventsMiniList.css";

const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

const EventsMiniList: React.FC<{data: Event[], isPastEvents?: boolean, onEdit?: (id: string) => void}> = ({ data, isPastEvents, onEdit }) => {
  return (
    <>
      <ul className="events-mini-list">
        {data.map((item) => (
          <li className="events-mini-list__item" key={item.id}>
            <span className="events-mini-list__item-title" onClick={() => onEdit?.(item.id)} >
              {item.title}
            </span>
            <div className="events-mini-list__item-date">
              {isPastEvents ? formatter.format(new Date(item.originalDate)): formatDateString(item.originalDate)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default EventsMiniList;