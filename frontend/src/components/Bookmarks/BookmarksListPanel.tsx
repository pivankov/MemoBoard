import { Button } from 'antd';

import Icon, { isIconName } from 'components/UI/Icon/Icon'
import { BookmarksListPanelHeader,Tag } from "types/bookmarks";

import "./BookmarksListPanel.css";

const BookmarksListPanel: React.FC<{ tags: Tag[], header: BookmarksListPanelHeader }> = ({ tags, header }) => {
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

      <div className="bookmarks-list-panel__side">
        <Button 
          type="primary" 
          shape="round" 
        >
          Добавить закладку
        </Button>
      </div>
    </div>
  );
};

export default BookmarksListPanel;