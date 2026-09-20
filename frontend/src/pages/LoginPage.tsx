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
import { InfoCircleFilled, WarningFilled } from '@ant-design/icons';

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
      <div className="login-page__left">
        <Card className="login-page__card">
          <div className="login-page__title">Вход</div>
          <div className="login-page__title-sub">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></div>

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
              <Input placeholder="demo@example.com" size="large" />
            </Form.Item>

            <Form.Item
              label="Пароль"
              name="password"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password placeholder="demo" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Войти
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      <div className="login-page__right">
        <div className="login-page__text">
          <h1>MemoBoard</h1>
          <p>Добро пожаловать в MemoBoard — это проект для управления событиями и закладками.</p>
          <p>Календарь с умной группировкой дат, напоминания о праздниках и днях рождения, удобное хранение ссылок с тегами.</p>
          <p>GitHub: <a href="https://github.com/pivankov/MemoBoard" target="blank">https://github.com/pivankov/MemoBoard</a></p>
          <div className="login-page__note">
            <div className="login-page__note-item">
              <InfoCircleFilled />Демо аккаунт: логин <b>"demo@example.com"</b>, пароль <b>"demo"</b>
            </div>
            <div className="login-page__note-item">
              <WarningFilled />Сайт не адаптирован под мобильные устройства
            </div>
          </div>
        </div>         
      </div>
    </div>
  );
}

export default LoginPage;
