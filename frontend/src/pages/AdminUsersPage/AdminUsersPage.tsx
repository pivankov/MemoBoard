/**
 * Страница административного раздела: список пользователей с возможностью удаления.
 *
 * Доступна только пользователям с ролью `admin`.
 * Должна располагаться внутри AdminRoute.
 *
 * При удалении пользователя каскадно удаляются все его данные (события,
 * закладки, категории, теги, сессии) и превью-файлы с диска (на стороне backend).
 */

import { useCallback, useEffect, useState } from 'react';
import { Button, message,Popconfirm, Table } from 'antd';

import type { AdminUserListItem } from 'types/auth';

import type { ColumnsType } from 'antd/es/table';
import * as adminService from 'services/adminService';

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminService.fetchUsers());
    } catch {
      message.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (uid: string) => {
    try {
      await adminService.deleteUser(uid);
      message.success('Пользователь удалён');
      await load();
    } catch {
      message.error('Не удалось удалить пользователя');
    }
  };

  const columns: ColumnsType<AdminUserListItem> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name ?? '—',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Создан',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, row) => (
        <Popconfirm
          title="Удалить пользователя?"
          description="Удалятся все события, закладки, категории и теги пользователя. Действие необратимо."
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(row.uid)}
        >
          <Button danger size="small">Удалить</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      rowKey="uid"
      loading={loading}
      dataSource={users}
      columns={columns}
      pagination={false}
    />
  );
}

export default AdminUsersPage;
