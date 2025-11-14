
import { Button, Space } from 'antd';

import Icon, { isIconName } from 'components/UI/Icon/Icon'
import { BookmarksListPanelHeader } from "types/bookmarks";

import "./BookmarksListPanel.css";

interface BookmarksListPanelProps {
  header: BookmarksListPanelHeader;
  children: React.ReactNode;
  onResetFilters?: () => void;
}

/**
 * Панель для списка закладок с заголовком, фильтрами и действиями
 * 
 * @param header - заголовок панели с иконкой
 * @param children - содержимое панели (обычно теги для фильтрации)
 * @param onResetFilters - опциональный коллбек для сброса фильтров. Если не передан, кнопка сброса не отображается
 */
const BookmarksListPanel: React.FC<BookmarksListPanelProps> = ({ header, children, onResetFilters }) => {
  const iconName = header.icon && isIconName(header.icon) ? header.icon : null;

  return (
    <div className="bookmarks-list-panel">
      <div className="bookmarks-list-panel__title">
        { iconName && (
          <div className="bookmarks-list-panel__title-icon">
            <Icon name={iconName} />
          </div>
        )}
        <div className="bookmarks-list-panel__title-text">
          {header.title}
        </div>
      </div>

      <div className="bookmarks-list-panel__tags">
        {children}
      </div>

      <div className="bookmarks-list-panel__side">
        <Space>
          {onResetFilters && (
            <Button 
              onClick={onResetFilters}
              shape="round"
              color="default"
              variant="filled"
            >
              Сбросить теги
            </Button>
          )}
          <Button 
            type="primary" 
            shape="round" 
          >
            Добавить закладку
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default BookmarksListPanel;