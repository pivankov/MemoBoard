/**
 * Страница входа в систему
 *
 * Отображает форму с email и паролем.
 * При успешном логине — редирект на главную.
 * Если пользователь уже авторизован — редирект на главную.
 */

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button, Card, Form, Input, Typography } from 'antd';

import { useAuth } from 'hooks/useAuth';

import './LoginPage.css';

const { Title, Text } = Typography;

function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      await login(values);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить вход');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-page__card">
        <Title level={3} className="login-page__title">Вход в MemoBoard</Title>

        {error && <Text type="danger" className="login-page__error">{error}</Text>}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный формат email' },
            ]}
          >
            <Input placeholder="email@example.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder="Пароль" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Войти
            </Button>
          </Form.Item>
        </Form>

        <Text>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></Text>
      </Card>
    </div>
  );
}

export default LoginPage;
