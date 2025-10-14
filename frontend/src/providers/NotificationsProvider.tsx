import { createContext, ReactNode, useContext } from 'react';
import { notification } from 'antd';

type NotificationsContextValue = {
  notifyError: (params: { message?: string; description: string }) => void;
  notifySuccess: (params: { message?: string; description: string }) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function NotificationsProvider({ children }: Props) {
  const [api, contextHolder] = notification.useNotification();

  const value: NotificationsContextValue = {
    notifyError: ({ message = 'Ошибка', description }) => {
      api.error({ message, description, placement: 'topRight', duration: 10 });
    },
    notifySuccess: ({ message = 'Успешно', description }) => {
      api.success({ message, description, placement: 'topRight' });
    },
  };

  return (
    <NotificationsContext.Provider value={value}>
      {contextHolder}
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}


