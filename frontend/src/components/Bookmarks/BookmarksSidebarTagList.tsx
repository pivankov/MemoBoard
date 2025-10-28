import { Tag } from "types/bookmarks";

import BookmarksSidebarTagListItem from "./BookmarksSidebarTagListItem";

import "./BookmarksSidebarTagList.css";

const BookmarksSidebarTagList: React.FC<{ data: Tag[] }> = ({ data }) => {
  return (
    <div className="bookmarks-sidebar-tag-list">
      {
        data.map((tag) => <BookmarksSidebarTagListItem key={tag.id} {...tag} />)
      }
    </div>
  );
};

export default BookmarksSidebarTagList;