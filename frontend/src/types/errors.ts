/**
 * Кастомная ошибка API
 * 
 * Расширяет стандартный Error дополнительными полями для классификации ошибок.
 * Позволяет различать бизнес-ошибки (понятные пользователю) и технические ошибки.
 */
export class ApiError extends Error {
  /**
   * @param message - текст ошибки
   * @param statusCode - HTTP код ответа
   * @param isUserFriendly - флаг, является ли ошибка понятной пользователю (бизнес-ошибка)
   */
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isUserFriendly: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Для корректной работы instanceof в старых версиях TypeScript/JavaScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  /**
   * Проверяет, является ли ошибка бизнес-ошибкой (понятной пользователю)
   * 
   * @returns true если это бизнес-ошибка от бэкенда
   */
  isBusinessError(): boolean {
    return this.isUserFriendly;
  }
  
  /**
   * Создает бизнес-ошибку (понятную пользователю)
   * 
   * @param message - текст ошибки от бэкенда
   * @param statusCode - HTTP код ответа
   * @returns экземпляр ApiError с флагом isUserFriendly = true
   */
  static createBusinessError(message: string, statusCode: number): ApiError {
    return new ApiError(message, statusCode, true);
  }
  
  /**
   * Создает техническую ошибку (не для показа пользователю)
   * 
   * @param message - техническое описание ошибки
   * @param statusCode - HTTP код ответа
   * @returns экземпляр ApiError с флагом isUserFriendly = false
   */
  static createTechnicalError(message: string, statusCode: number): ApiError {
    return new ApiError(message, statusCode, false);
  }
}

