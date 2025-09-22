import { Badge, Space } from 'antd';
import {CrownFilled, EditOutlined, StarFilled, SunFilled } from "@ant-design/icons";

import { eventType } from "enums/events"
import { Event } from 'types/events';
import { formatDateString } from "utils/date";

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
  [eventType.OTHER]: {
    icon: SunFilled,
    title: "Другое событие"
  },
}

const EventsListItem: React.FC<Event & { onEdit?: () => void }> = ({ title, date, type, isYearly, isMonthly, description, onEdit }) => {
  const dateString = formatDateString(date);
  const Icon = eventTypesObj[type].icon;
  const evetnTypeTitle = eventTypesObj[type].title;
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
        {(isYearly || isMonthly) && (
          <Space className="events-list-item__flags">
            {isYearly && <Badge color="blue" text="Ежегодное" />}
            {isMonthly && <Badge color="orange" text="Ежемесячное" />}
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