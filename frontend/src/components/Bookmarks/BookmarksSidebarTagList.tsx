import { BookmarksTag } from "types/bookmarks";

import BookmarksSidebarList from "./BookmarksSidebarList";
import BookmarksSidebarListItem from "./BookmarksSidebarListItem";

const BookmarksSidebarTagList: React.FC<{ data: BookmarksTag[] }> = ({ data }) => {
  return (
    <BookmarksSidebarList title="Теги">
      {
        data.map((item) => (
          <BookmarksSidebarListItem
            key={item.id}
            link={`/bookmarks/tag/${item.id}`}
            icon="Tag"
            title={item.title}
            amount={item.amount}
          />          
        ))
      }
    </BookmarksSidebarList>
  );
};

export default BookmarksSidebarTagList;