import { eventType } from "enums/events"

type EventType = eventType;

export type Event = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  isYearly: boolean;
  isMonthly: boolean;
  description: string;
};

export type EventFormValues = {
  title: string;
  date: string;
  type: EventType;
  isYearly: boolean;
  isMonthly: boolean;
  description: string;
};

export type EventsEditFormValuesInternal = {
  title?: string;
  date?: import('dayjs').Dayjs;
  type?: EventType;
  isYearly?: boolean;
  isMonthly?: boolean;
  description?: string;
};
