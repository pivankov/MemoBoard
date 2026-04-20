/**
 * Хук для доступа к контексту аутентификации
 *
 * Предоставляет данные пользователя и методы login/register/logout.
 * Должен использоваться внутри AuthProvider.
 */

import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from 'contexts/AuthContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
