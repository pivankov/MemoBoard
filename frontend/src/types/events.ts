import { eventType } from "enums/events"

type EventType = eventType;

export type Recurrence = 'none' | 'monthly' | 'yearly';
export const RECURRENCE_VALUES: readonly Recurrence[] = ['none','monthly','yearly'] as const;

export type Event = {
  id: string;
  title: string;
  startDate: string;
  type: EventType;
  recurrence: Recurrence;
  description: string;
};

export type EventFormValues = {
  title: string;
  startDate: string;
  type: EventType;
  recurrence: Recurrence;
  description: string;
};

export type EventsEditFormValuesInternal = {
  title?: string;
  startDate?: import('dayjs').Dayjs;
  type?: EventType;
  recurrence?: Recurrence;
  description?: string;
};
