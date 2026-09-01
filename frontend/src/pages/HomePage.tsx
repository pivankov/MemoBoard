import { useCallback, useEffect, useState } from 'react';
import { Button, message, Modal, Popconfirm, Table, Typography } from 'antd';

import type { ColumnsType } from 'antd/es/table';
import type { ApiToken } from 'services/apiTokensService';
import * as apiTokensService from 'services/apiTokensService';

function HomePage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTokens(await apiTokensService.fetchApiTokens());
    } catch {
      message.error('Не удалось загрузить ключи');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await apiTokensService.createApiToken();
      setNewToken(created.token);
      await load();
    } catch {
      message.error('Не удалось создать ключ');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (uid: string) => {
    try {
      await apiTokensService.revokeApiToken(uid);
      message.success('Ключ отозван');
      await load();
    } catch {
      message.error('Не удалось отозвать ключ');
    }
  };

  const columns: ColumnsType<ApiToken> = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Создан', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Последнее использование',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, row) => (
        <Popconfirm
          title="Отозвать ключ?"
          description="Расширение с этим ключом перестанет работать. Действие необратимо."
          okText="Отозвать"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleRevoke(row.uid)}
        >
          <Button danger size="small">Отозвать</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <h1>Ключи для расширения</h1>
      <Button type="primary" loading={creating} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Сгенерировать ключ для расширения
      </Button>
      <Table rowKey="uid" loading={loading} dataSource={tokens} columns={columns} pagination={false} />

      <Modal
        title="Новый ключ создан"
        open={newToken !== null}
        onOk={() => setNewToken(null)}
        onCancel={() => setNewToken(null)}
        okText="Я скопировал ключ"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>Скопируйте ключ сейчас — он больше не будет показан.</p>
        <Typography.Paragraph copyable={{ text: newToken ?? '' }} code>
          {newToken}
        </Typography.Paragraph>
      </Modal>
    </>
  );
}

export default HomePage;
