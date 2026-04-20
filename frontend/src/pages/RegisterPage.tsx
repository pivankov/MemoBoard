/**
 * Страница регистрации нового пользователя
 *
 * Отображает форму с email, именем и паролем.
 * При успешной регистрации — редирект на главную.
 * Если пользователь уже авторизован — редирект на главную.
 */

import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button, Card, Form, Input, Typography } from 'antd';

import { useAuth } from 'hooks/useAuth';

import './RegisterPage.css';

const { Title, Text } = Typography;

function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values: { email: string; password: string; name?: string }) => {
    setLoading(true);
    setError(null);

    try {
      await register(values);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Card className="register-page__card">
        <Title level={3} className="register-page__title">Регистрация в MemoBoard</Title>

        {error && <Text type="danger" className="register-page__error">{error}</Text>}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            label="Имя"
            name="name"
          >
            <Input placeholder="Ваше имя (необязательно)" size="large" />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password placeholder="Пароль" size="large" />
          </Form.Item>

          <Form.Item
            label="Подтверждение пароля"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Повторите пароль" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <Text>Уже есть аккаунт? <Link to="/login">Войти</Link></Text>
      </Card>
    </div>
  );
}

export default RegisterPage;
