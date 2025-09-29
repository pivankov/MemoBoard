import { Badge, Space } from 'antd';
import { CoffeeOutlined, CrownFilled, EditOutlined, StarFilled, SunFilled } from "@ant-design/icons";

import { eventType } from "enums/events"
import { Event } from 'types/events';
import { getDay } from "utils/date";
import { isMonthly, isRecurring, isYearly } from "utils/events";

import "./EventsListItem.css";

const eventTypesObj = {
  [eventType.BIRTHDAY]: {
    icon: CrownFilled,
    title: "День рождения",
  },
  [eventType.HOLIDAY]: {
    icon: StarFilled,
    title: "Праздник",
  },
  [eventType.CHURCH]: {
    icon: SunFilled,
    title: "Церковный праздник",
  },
  [eventType.OTHER]: {
    icon: CoffeeOutlined,
    title: "Другое событие"
  },
}

const ruMonthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

const EventsListItem: React.FC<Event & { onEdit?: () => void }> = ({ title, originalDate, nextDate, type, recurrence, description, onEdit }) => {
  const eventDay = getDay(new Date(nextDate));
  const eventMonth = ruMonthFormatter.format(new Date(nextDate));  
  const Icon = eventTypesObj[type].icon;
  const eventTypeTitle = eventTypesObj[type].title;
  const isRecurringEvent = isRecurring(recurrence);
  const isYearlyEvent = isYearly(recurrence);
  const isMonthlyEvent = isMonthly(recurrence);
  const cls = `events-list-item events-list-item--${type}`

  return (
    <li className={cls}>
      <div className="events-list-item__icon" title={eventTypeTitle}>
        <Icon />
      </div>
      <div className="events-list-item__wrapper">
        <div className="events-list-item__event-date">
          <div className="events-list-item__event-date-day">
            {eventDay}
          </div>
          <div className="events-list-item__event-date-month">
            {eventMonth}
          </div>
        </div>

        <div className="events-list-item__title">
          {title}

          <EditOutlined className="ml-1" onClick={onEdit} />
        </div>

        {isRecurringEvent && (
          <Space className="events-list-item__flags">
            {isYearlyEvent && <Badge color="blue" text="Ежегодное" />}
            {isMonthlyEvent && <Badge color="orange" text="Ежемесячное" />}
          </Space>
        )}

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