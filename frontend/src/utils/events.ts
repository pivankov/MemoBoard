import type { Event, Recurrence } from 'types/events';
import { RECURRENCE_VALUES } from 'types/events';

export const isYearly = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'yearly';
};

export const isMonthly = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'monthly';
};

export const isNone = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'none';
};

export const isRecurring = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'monthly' || value === 'yearly';
};

export const isValidRecurrence = (value: unknown): value is Recurrence => {
  return typeof value === 'string' && (RECURRENCE_VALUES as readonly string[]).includes(value);
};

export const normalizeRecurrence = (value: unknown): Recurrence => {
  return isValidRecurrence(value) ? value : 'none';
};
