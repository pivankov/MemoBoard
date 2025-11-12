import { useMemo } from "react";

import { Bookmark, BookmarksListPanelHeader,Tag } from "types/bookmarks";

import BookmarksListItem from "./BookmarksListItem";
import BookmarksListPanel from "./BookmarksListPanel";

import "./BookmarksList.css";

const BookmarksList: React.FC<{ bookmarks: Bookmark[], tags: Tag[], panelHeader: BookmarksListPanelHeader  }> = ({ bookmarks, tags, panelHeader }) => {
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t] as const)), [tags]);

  const tagsMapping = (bookmarkTags: string[]): Tag[] => {
    return bookmarkTags.flatMap((tagId) => {
      const tag = tagById.get(tagId);
      
      return tag ? [tag] : [];
    });
  };

  return (
    <>
      <BookmarksListPanel tags={tags} header={panelHeader} />
      
      <div className="bookmarks-list">
        {
          bookmarks.map((bookmark) => <BookmarksListItem key={bookmark.id} {...bookmark} tags={tagsMapping(bookmark.tags)} />)
        }
      </div>
    </>
  );
};

export default BookmarksList;