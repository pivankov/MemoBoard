import { useBookmarks } from 'hooks/useBookmarks';
import TwoColumnLayout from "layouts/TwoColumnLayout";

import BookmarksList from "./BookmarksList";
import BookmarksSidebarTagList from "./BookmarksSidebarTagList";

const Bookmarks: React.FC = () => {
  const { bookmarks, tags, categories, loading, error } = useBookmarks();

  const sidebar = (
    <div className="bookmarks-list-sidebar__wrapper">
      <BookmarksSidebarTagList data={tags} />
    </div>
  );

  return (
    <TwoColumnLayout
      sidebarHeader="Закладки"    
      sidebar={sidebar}
      content={<BookmarksList bookmarks={bookmarks} tags={tags} />}
    />
  );
};

export default Bookmarks;