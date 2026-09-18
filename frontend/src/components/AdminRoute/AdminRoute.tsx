/**
 * Компонент-обёртка для маршрутов административного раздела.
 *
 * Должен располагаться внутри ProtectedRoute (пользователь уже авторизован).
 * Если роль пользователя не `admin` — редиректит на `/`.
 * Пока идёт проверка токена — показывает индикатор загрузки.
 */

import { Navigate, Outlet } from 'react-router';
import { Spin } from 'antd';

import { useAuth } from 'hooks/useAuth';

function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
