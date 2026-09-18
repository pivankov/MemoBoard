import type { AdminUserListItem } from 'types/auth';

import { adminApiClient } from 'services/apiClients';

/**
 * Возвращает список всех пользователей приложения.
 * Требует роль `admin`.
 */
export async function fetchUsers(): Promise<AdminUserListItem[]> {
  const response = await adminApiClient.get<{ users: AdminUserListItem[] }>('/users');
  return response.users;
}

/**
 * Удаляет пользователя по его публичному UID.
 * Каскадно удаляет все события, закладки, категории, теги и сессии.
 * Требует роль `admin`.
 *
 * @param uid - публичный идентификатор пользователя
 */
export async function deleteUser(uid: string): Promise<void> {
  await adminApiClient.delete(`/users/${uid}`);
}
