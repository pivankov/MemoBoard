/**
 * Компонент-обёртка для защищённых маршрутов
 *
 * Проверяет, авторизован ли пользователь.
 * Если нет — перенаправляет на /login.
 * Пока идёт проверка токена — показывает индикатор загрузки.
 */

import { Navigate, Outlet } from 'react-router';
import { Spin } from 'antd';

import { useAuth } from 'hooks/useAuth';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
