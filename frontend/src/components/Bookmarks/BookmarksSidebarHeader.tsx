import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { useBookmarksModalContext } from 'contexts/BookmarksModalContext';

import "./BookmarksSidebarHeader.css";

const BookmarksSidebarHeader: React.FC = () => {
  const { openModal } = useBookmarksModalContext();

  const handleAddClick = () => {
    openModal({ type: 'create-collection' });
  };

  return (
    <div className="bookmarks-side-header">
      <span className="bookmarks-side-header__title">Закладки</span>
      <Tooltip title="Создать коллекцию">
        <Button 
          className="bookmarks-side-header__button"
          type="dashed" 
          shape="circle" 
          icon={<PlusOutlined />}
          onClick={handleAddClick}
        />
      </Tooltip>
    </div>
  );
};

export default BookmarksSidebarHeader;