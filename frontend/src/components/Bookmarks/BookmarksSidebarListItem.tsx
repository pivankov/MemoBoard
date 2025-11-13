import { Link } from "react-router";

import Icon, { isIconName } from 'components/UI/Icon/Icon'

import "./BookmarksSidebarListItem.css";

const BookmarksSidebarListItem: React.FC<{ link: string, icon?: string | null, title: string, amount: number }> = ({ link, icon, title, amount }) => {
  const hasAmount = !!amount;
  const iconName = icon && isIconName(icon) ? icon : null; 
  
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
    </Link>
  );
};

export default BookmarksSidebarListItem;