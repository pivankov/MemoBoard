import Icon from 'components/UI/Icon/Icon'
import { Tag } from "types/bookmarks";

import "./BookmarksSidebarTagListItem.css";

const BookmarksSidebarTagListItem: React.FC<Tag> = ({ title, amount }) => {
  const hasAmount = !!amount;

  return (
    <a className="bookmarks-sidebar-tag-list-item" href="#">
      <span className="bookmarks-sidebar-tag-list-item__icon">
        <Icon name="Tag" />
      </span>
      <span className="bookmarks-sidebar-tag-list-item__title">
        {title}
      </span>
      {hasAmount && (
        <span className="bookmarks-sidebar-tag-list-item__amount">
          {amount}
        </span>
      )}
    </a>
  );
};

export default BookmarksSidebarTagListItem;