import { ApiError } from 'types/errors';

/**
 * Конфигурация API клиента
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Singleton API клиент для HTTP запросов
 * 
 * Централизует логику работы с API: обработку ошибок, таймауты, заголовки.
 * Поддерживает добавление заголовков авторизации и переключение baseURL.
 */
class ApiClient {
  /** Единственный экземпляр класса */
  private static instance: ApiClient | null = null;

  /** Конфигурация клиента */
  private config: ApiClientConfig;

  /**
   * Приватный конструктор — запрещает создание через new ApiClient()
   */
  private constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  /**
   * Получение единственного экземпляра API клиента
   * 
   * @param config - конфигурация (используется только при первом вызове)
   * @returns единственный экземпляр ApiClient
   */
  public static getInstance(config?: ApiClientConfig): ApiClient {
    if (!ApiClient.instance) {
      if (!config) {
        throw new Error('ApiClient не инициализирован. Передайте config при первом вызове.');
      }
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  /**
   * Выполняет HTTP запрос с обработкой ошибок и таймаутом
   * 
   * @param endpoint - путь к ресурсу (относительно baseURL)
   * @param options - опции fetch
   * @returns распарсенный JSON ответ
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Пытаемся получить детальное сообщение ошибки от бэкенда
        const defaultMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          // Если бэкенд вернул поле error, это бизнес-ошибка
          if (errorData?.error && typeof errorData.error === 'string') {
            throw ApiError.createBusinessError(errorData.error, response.status);
          }
        } catch (err) {
          // Если это уже ApiError - пробрасываем
          if (err instanceof ApiError) {
            throw err;
          }
          // Если не удалось распарсить JSON - техническая ошибка
        }
        
        // Техническая ошибка (не удалось получить детали от бэкенда)
        throw ApiError.createTechnicalError(defaultMessage, response.status);
      }

      // Если ответ пустой (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw ApiError.createTechnicalError(
            `Превышено время ожидания запроса: ${endpoint}`,
            408 // Request Timeout
          );
        }
        // Если это уже ApiError - пробрасываем как есть
        if (error instanceof ApiError) {
          throw error;
        }
        // Оборачиваем другие ошибки в ApiError
        throw ApiError.createTechnicalError(error.message, 0);
      }
      throw ApiError.createTechnicalError('Неизвестная ошибка при выполнении запроса', 0);
    }
  }

  /**
   * GET запрос
   * 
   * @param endpoint - путь к ресурсу
   * @returns данные ответа
   */
  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST запрос
   * 
   * @param endpoint - путь к ресурсу
   * @param data - данные для отправки
   * @returns данные ответа
   */
  public async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT запрос
   * 
   * @param endpoint - путь к ресурсу
   * @param data - данные для отправки
   * @returns данные ответа
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH запрос
   * 
   * @param endpoint - путь к ресурсу
   * @param data - данные для частичного обновления
   * @returns данные ответа
   */
  public async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE запрос
   * 
   * @param endpoint - путь к ресурсу
   * @returns данные ответа
   */
  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Устанавливает baseURL (для переключения между dev/prod)
   * 
   * @param baseURL - новый базовый URL
   */
  public setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  /**
   * Добавляет или обновляет заголовок (например, для авторизации)
   * 
   * @param key - название заголовка
   * @param value - значение заголовка
   */
  public setHeader(key: string, value: string): void {
    this.config.headers = {
      ...this.config.headers,
      [key]: value,
    };
  }

  /**
   * Удаляет заголовок
   * 
   * @param key - название заголовка
   */
  public removeHeader(key: string): void {
    if (this.config.headers) {
      const { [key]: _, ...rest } = this.config.headers;
      this.config.headers = rest;
    }
  }
}

/**
 * Функция доступа к единственному экземпляру API клиента
 * 
 * @param config - конфигурация (опционально, только при первой инициализации)
 * @returns единственный экземпляр ApiClient
 */
export const getApiClient = (config?: ApiClientConfig): ApiClient => {
  return ApiClient.getInstance(config);
};

export default ApiClient;

