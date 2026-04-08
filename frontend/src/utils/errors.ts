import { ApiError } from 'types/errors';

/**
 * Извлекает понятное сообщение об ошибке из ApiError
 * @param error - ошибка для обработки
 * @param fallbackMessage - сообщение по умолчанию, если ошибка не бизнес-логическая
 * @returns понятное пользователю сообщение об ошибке
 */
export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return error instanceof ApiError && error.isBusinessError()
    ? error.message
    : fallbackMessage;
};