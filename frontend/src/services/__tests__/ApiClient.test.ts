import { ApiError } from 'types/errors';

import { getApiClient } from '../ApiClient';

// Мокируем fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const TEST_BASE_URL = 'http://localhost:3001/api/bookmarks';

  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    mockFetch.mockClear();
    mockFetch.mockReset();
    // Сбрасываем Singleton (через приватное поле для тестов)
    // Доступ к приватному статическому полю через класс
    const ApiClientClass = require('../ApiClient').default;
    (ApiClientClass as any).instance = null;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Успешные запросы', () => {
    test('GET запрос возвращает данные', async () => {
      const mockData = { data: [{ id: '1', title: 'Test' }] };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      const result = await client.get('/');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        TEST_BASE_URL + '/',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    test('POST запрос отправляет данные', async () => {
      const postData = { url: 'https://test.com', categoryId: '1' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      const result = await client.post('/', postData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        TEST_BASE_URL + '/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    test('PUT запрос обновляет данные', async () => {
      const updateData = { title: 'Updated' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      const result = await client.put('/123', updateData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        TEST_BASE_URL + '/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    test('DELETE запрос удаляет данные', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      const result = await client.delete('/123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        TEST_BASE_URL + '/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    test('204 No Content возвращает пустой объект', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      const result = await client.delete('/123');

      expect(result).toEqual({});
    });
  });

  describe('Бизнес-ошибки от бэкенда', () => {
    test('400 с полем error создает бизнес-ошибку', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Заголовок обязателен для заполнения' }),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      
      try {
        await client.put('/123', {});
        fail('Должна была быть выброшена ошибка');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Заголовок обязателен для заполнения');
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).isBusinessError()).toBe(true);
        expect((error as ApiError).isUserFriendly).toBe(true);
      }
    });

    test('404 с полем error создает бизнес-ошибку', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Закладка не найдена' }),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.get('/999');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Закладка не найдена');
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).isBusinessError()).toBe(true);
      }
    });

    test('Бэкенд вернул некорректный JSON - техническая ошибка', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.post('/', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('HTTP 400: Bad Request');
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).isBusinessError()).toBe(false);
        expect((error as ApiError).isUserFriendly).toBe(false);
      }
    });
  });

  describe('Технические ошибки', () => {
    test('500 Internal Server Error - техническая ошибка', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.get('/');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('HTTP 500: Internal Server Error');
        expect((error as ApiError).statusCode).toBe(500);
        expect((error as ApiError).isBusinessError()).toBe(false);
      }
    });

    test('503 Service Unavailable - техническая ошибка', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.get('/');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('HTTP 503: Service Unavailable');
        expect((error as ApiError).statusCode).toBe(503);
        expect((error as ApiError).isBusinessError()).toBe(false);
      }
    });

    test('Network error - техническая ошибка', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.get('/');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Network request failed');
        expect((error as ApiError).statusCode).toBe(0);
        expect((error as ApiError).isBusinessError()).toBe(false);
      }
    });

    test('AbortError превращается в техническую ошибку', async () => {
      // Имитируем AbortError (который происходит при timeout)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      const client = getApiClient({ baseURL: TEST_BASE_URL });

      try {
        await client.get('/');
        fail('Должна была быть выброшена ошибка');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Превышено время ожидания');
        expect((error as ApiError).statusCode).toBe(408);
        expect((error as ApiError).isBusinessError()).toBe(false);
      }
    });
  });

  describe('Singleton поведение', () => {
    test('getInstance возвращает один и тот же экземпляр', () => {
      const client1 = getApiClient({ baseURL: TEST_BASE_URL });
      const client2 = getApiClient({ baseURL: 'http://other-url.com' }); // config игнорируется

      expect(client1).toBe(client2); // Один и тот же объект
    });

    test('setHeader обновляет заголовки для всех запросов', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      client.setHeader('Authorization', 'Bearer token123');

      await client.get('/');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('removeHeader удаляет заголовок', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      client.setHeader('Authorization', 'Bearer token123');
      client.removeHeader('Authorization');

      await client.get('/');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });

    test('setBaseURL изменяет базовый URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      client.setBaseURL('http://new-url.com/api');

      await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://new-url.com/api/test',
        expect.any(Object)
      );
    });
  });

  describe('Заголовки по умолчанию', () => {
    test('Content-Type: application/json устанавливается автоматически', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      await client.post('/', { test: 'data' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('Можно переопределить заголовки для конкретного запроса', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const client = getApiClient({ baseURL: TEST_BASE_URL });
      
      // Используем приватный метод напрямую для теста
      await (client as any).request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'text/plain',
          }),
        })
      );
    });
  });
});

