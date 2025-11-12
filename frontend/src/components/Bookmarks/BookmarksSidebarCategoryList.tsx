import { BookmarkCategogiesGrouped } from "types/bookmarks";

import BookmarksSidebarCategoryListItem from "./BookmarksSidebarCategoryListItem";

import "./BookmarksSidebarCategoryList.css";

const BookmarksSidebarCategoryList: React.FC<{ data: BookmarkCategogiesGrouped[] }> = ({ data }) => {
  return (
    <>
      {
        data.map((parent) => (
          <div className="bookmarks-sidebar-category-list" key={parent.id}>
            <div className="bookmarks-sidebar-category-list__title">
              {parent.title}
            </div>
            <div className="bookmarks-sidebar-category-list__wrapper">
              {
                parent.children.map((item) => <BookmarksSidebarCategoryListItem key={item.id} {...item} />)
              }
            </div>
          </div>
        ))      
      }
    </>
  );
};

export default BookmarksSidebarCategoryList;