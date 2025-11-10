import { Tag } from "types/bookmarks";

import BookmarksSidebarTagListItem from "./BookmarksSidebarTagListItem";

import "./BookmarksSidebarTagList.css";

const BookmarksSidebarTagList: React.FC<{ data: Tag[] }> = ({ data }) => {
  return (
    <div className="bookmarks-sidebar-tag-list">
      <div className="bookmarks-sidebar-tag-list__title">Теги</div>
      <div className="bookmarks-sidebar-tag-list__wrapper">
        {
          data.map((tag) => <BookmarksSidebarTagListItem key={tag.id} {...tag} />)
        }
      </div>
    </div>
  );
};

export default BookmarksSidebarTagList;