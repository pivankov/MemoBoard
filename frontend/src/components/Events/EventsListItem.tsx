import { Badge, Space } from 'antd';
import { CoffeeOutlined, CrownFilled, EditOutlined, StarFilled, SunFilled } from "@ant-design/icons";

import { eventType } from "enums/events"
import { Event } from 'types/events';
import { formatDateString } from "utils/date";
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

const EventsListItem: React.FC<Event & { onEdit?: () => void }> = ({ title, startDate, type, recurrence, description, onEdit }) => {
  const dateString = formatDateString(startDate);
  const Icon = eventTypesObj[type].icon;
  const evetnTypeTitle = eventTypesObj[type].title;
  const isRecurringEvent = isRecurring(recurrence);
  const isYearlyEvent = isYearly(recurrence);
  const isMonthlyEvent = isMonthly(recurrence);
    const cls = `events-list-item events-list-item--${type}`

  return (
    <li className={cls}>
      <div className="events-list-item__icon" title={evetnTypeTitle}>
        <Icon />
      </div>
      <div className="events-list-item__wrapper">
        <div className="events-list-item__title">
          {title}

          <EditOutlined className="ml-1" onClick={onEdit} />
        </div>
        <div className="events-list-item__date">
          {dateString}
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