import { useParams } from "react-router";
import { Button } from 'antd';

import Icon from 'components/UI/Icon/Icon'
import { Tag } from "types/bookmarks";

import "./BookmarksListPanel.css";

const BookmarksListPanel: React.FC<{ tags: Tag[] }> = ({ tags }) => {
  const params = useParams();
  const tagId = params.tagId;

  const currentTag = tags.find((tag) => tag.id === tagId);
  const currentTagName = currentTag?.title;

  const title = currentTagName || '';

  return (
    <div className="bookmarks-list-panel">
      <div className="bookmarks-list-panel__title">
        <div className="bookmarks-list-panel__title-icon">
          <Icon name="Folder" />
        </div>
        <div className="bookmarks-list-panel__title-text">
          {title}
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