import { Button, List, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

import { BookmarksCategory } from 'types/bookmarks';

interface BookmarksCategoriesReorderListProps {
  /** Список элементов для отображения в текущем порядке */
  items: BookmarksCategory[];
  /** ID активной (перемещаемой) сущности — выделяется визуально */
  activeId?: string;
  /**
   * ID заблокированных элементов — отображаются, но не могут перемещаться.
   * Элементы сразу после заблокированного также не могут подняться выше него.
   */
  disabledIds?: string[];
  /** Вызывается при нажатии кнопок "Поднять" / "Опустить" */
  onMove: (index: number, direction: 'up' | 'down') => void;
}

/**
 * Список категорий/коллекций с кнопками изменения порядка
 *
 * Презентационный компонент — только отображение и пробрасывание событий.
 * Управление состоянием списка находится в родительском компоненте.
 */
const BookmarksCategoriesReorderList: React.FC<BookmarksCategoriesReorderListProps> = ({
  items,
  activeId,
  disabledIds,
  onMove,
}) => {
  const isDisabled = (id: string) => disabledIds?.includes(id) ?? false;
  const isFirst = (index: number) => index === 0;
  const isLast = (index: number) => index === items.length - 1;

  const isUpDisabled = (index: number): boolean => {
    if (isFirst(index)) return true;
    if (isDisabled(items[index].id)) return true;
    // запрет подъёма выше заблокированного элемента
    return isDisabled(items[index - 1].id);
  };

  const isDownDisabled = (index: number): boolean => {
    if (isLast(index)) return true;
    return isDisabled(items[index].id);
  };

  return (
    <List
      size="small"
      dataSource={items}
      renderItem={(item, index) => (
        <List.Item
          actions={[
            <Button
              key="up"
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={isUpDisabled(index)}
              onClick={() => onMove(index, 'up')}
            />,
            <Button
              key="down"
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={isDownDisabled(index)}
              onClick={() => onMove(index, 'down')}
            />,
          ]}
        >
          <Typography.Text
            strong={item.id === activeId}
            type={isDisabled(item.id) ? 'secondary' : undefined}
          >
            {item.title}
          </Typography.Text>
        </List.Item>
      )}
    />
  );
};

export default BookmarksCategoriesReorderList;
