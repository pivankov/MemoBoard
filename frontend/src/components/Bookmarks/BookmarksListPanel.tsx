import { Button } from 'antd';

import Icon from 'components/UI/Icon/Icon'

import "./BookmarksListPanel.css";

const BookmarksListPanel: React.FC = () => {
  return (
    <div className="bookmarks-list-panel">
      <div className="bookmarks-list-panel__title">
        <div className="bookmarks-list-panel__title-icon">
          <Icon name="Folder" />
        </div>
        <div className="bookmarks-list-panel__title-text">
          Несортированные
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