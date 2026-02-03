import { Link } from "react-router";

import Icon, { isIconName } from 'components/UI/Icon/Icon'
import { BookmarksSidebarListType } from "types/bookmarks";

import BookmarksSidebarDropdown from "./BookmarksSidebarDropdown";
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';

import "./BookmarksSidebarListItem.css";

interface BookmarksSidebarListItemProps {
  type: BookmarksSidebarListType;
  id: string;
  link: string;
  icon?: string | null;
  title: string;
  amount: number;
};

const BookmarksSidebarListItem: React.FC<BookmarksSidebarListItemProps> = ({ type, id, link, icon, title, amount }) => {
  const hasAmount = !!amount;
  const iconName = icon && isIconName(icon) ? icon : null;
  const isDropdownAvailable = id !== SYSTEM_CATEGORIES.TRASH && id !== SYSTEM_CATEGORIES.UNSORTED;
  
  return (
    <Link to={link} className="bookmarks-sidebar-list-item">
      { iconName && (
        <span className="bookmarks-sidebar-list-item__icon">
          <Icon name={iconName} />
        </span>
      )}
      <span className="bookmarks-sidebar-list-item__title">
        {title}
      </span>
      {hasAmount && (
        <span className="bookmarks-sidebar-list-item__amount">
          {amount}
        </span>
      )}

      { isDropdownAvailable && (
        <BookmarksSidebarDropdown
          type={type}
          id={id}
          title={title}
        />
      ) }
    </Link>
  );
};

export default BookmarksSidebarListItem;