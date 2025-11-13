import { useMemo } from "react";

import { BookmarksItem, BookmarksListPanelHeader, BookmarksTag } from "types/bookmarks";

import BookmarksListItem from "./BookmarksListItem";
import BookmarksListPanel from "./BookmarksListPanel";

import "./BookmarksList.css";

const BookmarksList: React.FC<{ bookmarks: BookmarksItem[], tags: BookmarksTag[], panelHeader: BookmarksListPanelHeader  }> = ({ bookmarks, tags, panelHeader }) => {
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t] as const)), [tags]);

  const mapTagIdsToTags = (bookmarkTags: string[]): BookmarksTag[] => {
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
          bookmarks.map((bookmark) => <BookmarksListItem key={bookmark.id} {...bookmark} tags={mapTagIdsToTags(bookmark.tags)} />)
        }
      </div>
    </>
  );
};

export default BookmarksList;