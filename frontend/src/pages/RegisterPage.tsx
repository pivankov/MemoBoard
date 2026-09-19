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
import { WarningFilled } from '@ant-design/icons';

import { useAuth } from 'hooks/useAuth';

import './LoginPage.css';

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
    <div className="login-page">
      <div className="login-page__left">
        <Card className="login-page__card">
          <div className="login-page__title">Регистрация</div>
          <div className="login-page__title-sub">Уже есть аккаунт? <Link to="/login">Войти</Link></div>

          {error && <Text type="danger" className="login-page__error">{error}</Text>}

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
        </Card>
      </div>
      <div className="login-page__right">
        <div className="login-page__text">
        <h1>MemoBoard</h1>
        <p>Добро пожаловать в MemoBoard — это проект для управления событиями и закладками.</p>
        <p>Календарь с умной группировкой дат, напоминания о праздниках и днях рождения, удобное хранение ссылок с тегами.</p>
        <p>GitHub: <a href="https://github.com/pivankov/MemoBoard" target="blank">https://github.com/pivankov/MemoBoard</a></p>
        <p className="login-page__text-note"><WarningFilled /> Сайт не адаптирован под мобильные устройства</p>
        </div>         
      </div>
    </div>
  );
}

export default RegisterPage;
