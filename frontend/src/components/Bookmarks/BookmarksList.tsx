import { Bookmark } from "types/bookmarks";

import BookmarksListItem from "./BookmarksListItem";
import BookmarksListPanel from "./BookmarksListPanel";

import "./BookmarksList.css";

const BookmarksList: React.FC<{data: Bookmark[]}> = ({ data }) => {
  return (
    <>
      <BookmarksListPanel />
      
      <div className="bookmarks-list">
        {
          data.map((bookmark) => <BookmarksListItem key={bookmark.id} {...bookmark} />)
        }
      </div>
    </>
  );
};

export default BookmarksList;