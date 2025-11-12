import { Link } from "react-router";

import Icon from 'components/UI/Icon/Icon'
import { Tag } from "types/bookmarks";

import "./BookmarksSidebarTagListItem.css";

const BookmarksSidebarTagListItem: React.FC<Tag> = ({ id, title, amount }) => {
  const hasAmount = !!amount;

  return (
    <Link to={`/bookmarks/tag/${id}`} className="bookmarks-sidebar-tag-list-item">
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
    </Link>
  );
};

export default BookmarksSidebarTagListItem;