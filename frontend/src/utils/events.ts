import type { Event, Recurrence } from 'types/events';
import { RECURRENCE_VALUES } from 'types/events';

/**
 * Проверяет, является ли событие ежегодным (yearly)
 * Принимает как объект события, так и строку типа повторения
 * @param e Событие или тип повторения
 * @returns true, если тип повторения yearly
 */
export const isYearly = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'yearly';
};

/**
 * Проверяет, является ли событие ежемесячным (monthly)
 * Принимает как объект события, так и строку типа повторения
 * @param e Событие или тип повторения
 * @returns true, если тип повторения monthly
 */
export const isMonthly = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'monthly';
};

/**
 * Проверяет, является ли событие разовым (none - без повторения)
 * Принимает как объект события, так и строку типа повторения
 * @param e Событие или тип повторения
 * @returns true, если тип повторения none
 */
export const isNone = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'none';
};

/**
 * Проверяет, является ли событие повторяющимся (monthly или yearly)
 * Принимает как объект события, так и строку типа повторения
 * @param e Событие или тип повторения
 * @returns true, если тип повторения monthly или yearly
 */
export const isRecurring = (e: Pick<Event, 'recurrence'> | Recurrence): boolean => {
  const value = typeof e === 'string' ? e : e.recurrence;

  return value === 'monthly' || value === 'yearly';
};

/**
 * Проверяет, является ли значение валидным типом повторения
 * Type guard для TypeScript - сужает тип до Recurrence
 * @param value Проверяемое значение
 * @returns true, если value является 'none' | 'monthly' | 'yearly'
 */
export const isValidRecurrence = (value: unknown): value is Recurrence => {
  return typeof value === 'string' && (RECURRENCE_VALUES as readonly string[]).includes(value);
};

/**
 * Нормализует неизвестное значение к валидному типу повторения
 * Возвращает 'none' для невалидных значений (безопасное значение по умолчанию)
 * @param value Проверяемое значение
 * @returns Валидный тип повторения: 'none' | 'monthly' | 'yearly'
 */
export const normalizeRecurrence = (value: unknown): Recurrence => {
  return isValidRecurrence(value) ? value : 'none';
};
