import { BookmarksSidebarListType } from "types/bookmarks";

import BookmarksSidebarDropdown from "./BookmarksSidebarDropdown";
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';

import "./BookmarksSidebarList.css";

interface BookmarksSidebarListProps {
  type: BookmarksSidebarListType;
  id: string;
  title: string;
  children: React.ReactNode;
};

const BookmarksSidebarList: React.FC<BookmarksSidebarListProps> = ({ type, id, title, children }) => {
  const isDropdownAvailable = id !== SYSTEM_CATEGORIES.SYSTEM;

  return (
    <div className="bookmarks-sidebar-list">
      <div className="bookmarks-sidebar-list__title">
        <div className="bookmarks-sidebar-list__title-label">
          {title}
        </div>
        { isDropdownAvailable && (
          <BookmarksSidebarDropdown
            type={type}
            id={id}
            title={title}
          />
        ) }
      </div>
      <div className="bookmarks-sidebar-list__wrapper">
        {children}
      </div>
    </div>
  );
};

export default BookmarksSidebarList;