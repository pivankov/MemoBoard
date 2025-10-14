import { eventType } from "enums/events"

type EventType = eventType;

/**
 * Тип повторения события
 * - 'none' - без повторений
 * - 'monthly' - ежемесячное повторение
 * - 'yearly' - ежегодное повторение
 */
export type Recurrence = 'none' | 'monthly' | 'yearly';

/** Массив всех возможных значений типа повторения события */
export const RECURRENCE_VALUES: readonly Recurrence[] = ['none','monthly','yearly'] as const;

/**
 * Основной тип события
 */
export type Event = {
  /** Уникальный идентификатор события */
  id: string;
  /** Название события */
  title: string;
  /** Исходная дата события в формате ISO (YYYY-MM-DD) */
  originalDate: string;
  /** Следующая дата наступления события в формате ISO (YYYY-MM-DD) */
  nextDate: string;
  /** Тип события (из enums/events) */
  type: EventType;
  /** Тип повторения события */
  recurrence: Recurrence;
  /** Описание события */
  description: string;
};

/**
 * Тип данных формы для создания/редактирования события
 * 
 * Используется для передачи данных в API
 */
export type EventFormValues = {
  /** Название события */
  title: string;
  /** Исходная дата события в формате ISO (YYYY-MM-DD) */
  originalDate: string;
  /** Тип события */
  type: EventType;
  /** Тип повторения события */
  recurrence: Recurrence;
  /** Описание события */
  description: string;
};

/**
 * Внутренний тип данных формы редактирования события
 * 
 * Используется в компонентах форм Ant Design, где дата представлена объектом Dayjs
 */
export type EventsEditFormValuesInternal = {
  /** Название события */
  title?: string;
  /** Исходная дата события как объект Dayjs */
  originalDate?: import('dayjs').Dayjs;
  /** Тип события */
  type?: EventType;
  /** Тип повторения события */
  recurrence?: Recurrence;
  /** Описание события */
  description?: string;
};
