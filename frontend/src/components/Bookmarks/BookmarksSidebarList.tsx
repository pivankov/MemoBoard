import { BookmarksSidebarListType } from "types/bookmarks";

import BookmarksSidebarDropdown from "./BookmarksSidebarDropdown";

import "./BookmarksSidebarList.css";

interface BookmarksSidebarListProps {
  type: BookmarksSidebarListType;
  id: string;
  title: string;
  children: React.ReactNode;
  showDropdown?: boolean;
};

const BookmarksSidebarList: React.FC<BookmarksSidebarListProps> = ({ type, id, title, children, showDropdown = true }) => {
  const isDropdownAvailable = showDropdown;  

  return (
    <div className="bookmarks-sidebar-list">
      {title && (
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
      )}
      <div className="bookmarks-sidebar-list__wrapper">
        {children}
      </div>
    </div>
  );
};

export default BookmarksSidebarList;