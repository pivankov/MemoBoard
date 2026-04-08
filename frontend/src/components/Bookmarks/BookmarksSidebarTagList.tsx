import { BookmarksTag } from "types/bookmarks";

import BookmarksSidebarList from "./BookmarksSidebarList";
import BookmarksSidebarListItem from "./BookmarksSidebarListItem";
import { SYSTEM_CATEGORIES } from 'constants/bookmarks';

const BookmarksSidebarTagList: React.FC<{ data: BookmarksTag[] }> = ({ data }) => {
  return (
    <BookmarksSidebarList type="tags-collection" id={SYSTEM_CATEGORIES.TAGS} title="Теги">
      {
        data.map((item) => (
          <BookmarksSidebarListItem
            key={item.id}
            type="tag"
            id={item.id}
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