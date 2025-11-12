import { Link } from "react-router";

import Icon, { isIconName } from 'components/UI/Icon/Icon'
import { Category } from "types/bookmarks";

import "./BookmarksSidebarCategoryListItem.css";

const BookmarksSidebarCategoryListItem: React.FC<Category> = ({ id, title, icon, amount }) => {
  const hasAmount = !!amount;
  const iconName = icon && isIconName(icon) ? icon : null;

  return (
    <Link to={`/bookmarks/category/${id}`} className="bookmarks-sidebar-category-list-item">
      { iconName && (
        <span className="bookmarks-sidebar-category-list-item__icon">
          <Icon name={iconName} />
        </span>
      )}
      <span className="bookmarks-sidebar-category-list-item__title">
        {title}
      </span>
      { hasAmount && (
        <span className="bookmarks-sidebar-category-list-item__amount">
          {amount}
        </span>
      )}
    </Link>
  );
};

export default BookmarksSidebarCategoryListItem;