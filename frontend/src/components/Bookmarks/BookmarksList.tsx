import { useCallback, useMemo, useState } from "react";
import { Tag } from 'antd';

import { BookmarksItem, BookmarksListPanelHeader, BookmarksTag } from "types/bookmarks";

import BookmarksListItem from "./BookmarksListItem";
import BookmarksListPanel from "./BookmarksListPanel";

import "./BookmarksList.css";

const BookmarksList: React.FC<{ bookmarks: BookmarksItem[], tags: BookmarksTag[], panelHeader: BookmarksListPanelHeader  }> = ({ bookmarks, tags, panelHeader }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t] as const)), [tags]);

  const mapTagIdsToTags = useCallback((bookmarkTags: string[]): BookmarksTag[] => {
    return bookmarkTags.flatMap((tagId) => {
      const tag = tagById.get(tagId);
      
      return tag ? [tag] : [];
    });
  }, [tagById]);

  const handleClickTag = useCallback((id: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleResetTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  /**
   * Активные теги с подсчетом количества закладок для каждого тега
   */
  const activeTagsWithCount = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tagId) => {
        tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
      });
    });

    return tags
      .filter((tag) => tagCounts.has(tag.id))
      .map((tag) => ({
        ...tag,
        count: tagCounts.get(tag.id) || 0
      }));
  }, [bookmarks, tags]);  

  /**
   * Фильтрация закладок по выбранным тегам
   * Использует Set для оптимизации проверки наличия тега
   */
  const filteredBookmarksByTag = useMemo(() => {
    if (!selectedTags.length) {
      return bookmarks;
    }
    
    const selectedTagsSet = new Set(selectedTags);
    
    return bookmarks.filter((bookmark) => 
      bookmark.tags.some((tagId) => selectedTagsSet.has(tagId))
      // Вариант фильтрации, когда отображаются закладки включающие в себя все выбранные теги
      // selectedTags.every((tagId) => bookmark.tags.includes(tagId))
    );
  }, [bookmarks, selectedTags]);

  return (
    <>
      <BookmarksListPanel header={panelHeader} onResetFilters={selectedTags.length > 0 ? handleResetTags : undefined}>
        {
          activeTagsWithCount.map((tag) => (
            <Tag 
              key={tag.id} 
              onClick={() => handleClickTag(tag.id)} 
              color={selectedTags.includes(tag.id) ? "blue" : ""}
              style={{ cursor: 'pointer' }}
            >
              {tag.title} ({tag.count})
            </Tag>
          ))
        }  
      </BookmarksListPanel>
      
      <div className="bookmarks-list">
        {
          filteredBookmarksByTag.map((bookmark) => (
            <BookmarksListItem 
              key={bookmark.id} 
              {...bookmark} 
              tags={mapTagIdsToTags(bookmark.tags)} 
            />
          ))
        }
      </div>
    </>
  );
};

export default BookmarksList;