import { Link } from "react-router";

import Icon, { isIconName } from 'components/UI/Icon/Icon'
import { BookmarksSidebarListType } from "types/bookmarks";

import BookmarksSidebarDropdown from "./BookmarksSidebarDropdown";

import "./BookmarksSidebarListItem.css";

interface BookmarksSidebarListItemProps {
  type: BookmarksSidebarListType;
  id: string;
  link: string;
  icon?: string | null;
  title: string;
  amount: number;
  showDropdown?: boolean;
};

const BookmarksSidebarListItem: React.FC<BookmarksSidebarListItemProps> = ({ type, id, link, icon, title, amount, showDropdown = true }) => {
  const hasAmount = !!amount;
  const iconName = icon && isIconName(icon) ? icon : null;
  const isDropdownAvailable = showDropdown;
  
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
          icon={icon}
        />
      ) }
    </Link>
  );
};

export default BookmarksSidebarListItem;