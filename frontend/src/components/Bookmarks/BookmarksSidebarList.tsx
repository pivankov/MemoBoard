import "./BookmarksSidebarList.css";

const BookmarksSidebarCategoryList: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="bookmarks-sidebar-list">
      <div className="bookmarks-sidebar-list__title">
        {title}
      </div>
      <div className="bookmarks-sidebar-list__wrapper">
        {children}
      </div>
    </div>
  );
};

export default BookmarksSidebarCategoryList;